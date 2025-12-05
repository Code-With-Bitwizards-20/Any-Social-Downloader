import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { pipeline } from 'stream';

import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve yt-dlp path: prefer explicit path, fallback to PATH if available
const ytDlpPath = process.env.YT_DLP_PATH || 'yt-dlp';

// STRATEGY: Client Spoofing (Android/iOS)
// YouTube is less strict with mobile API clients than web clients.
// We force yt-dlp to pretend it is the "Android" official app.
const getAuthArgs = () => {
    return [
       '--extractor-args', 'youtube:player_client=android', // Pretend to be Android App
       '--user-agent', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
       '--force-ipv4', // Sometimes forcing IPv4 or IPv6 helps stability
    ];
};

const safeFilename = (title, suffix = '', ext = 'mp4') => {
  const raw = (title || 'video').toString();
  // Remove Windows-reserved characters and control chars
  const cleaned = raw
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Collapse to safe ASCII-ish fallback
  const ascii = cleaned.normalize('NFKD').replace(/[^\w\d\-\. ]+/g, '');
  const base = ascii.replace(/\s+/g, '_').slice(0, 80) || 'video';
  const sfx = suffix ? `_${suffix}` : '';
  return `${base}${sfx}.${ext}`;
};

// Utility: attach disconnect handlers and call provided cleanup
const onClientDisconnect = (req, res, cleanup) => {
  let called = false;
  const call = () => {
    if (called) return;
    called = true;
    try { cleanup(); } catch {}
  };
  req.on('aborted', call);
  req.on('close', call);
  res.on('close', call);
  res.on('error', call);
  return () => call();
};

// Utility: safe pipeline with unified error handling
const safePipe = (src, dest, onError) => {
  return pipeline(src, dest, (err) => {
    if (err) {
      onError?.(err);
    }
  });
};

// Detect if ffmpeg has MP3 encoder (libmp3lame). Cached after first check.
let mp3SupportChecked = false;
let hasMp3Encoder = false;
const checkMp3Support = () => new Promise((resolve) => {
  if (mp3SupportChecked) return resolve(hasMp3Encoder);
  try {
    const proc = spawn(ffmpegStatic, ['-hide_banner', '-encoders']);
    let out = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.on('close', () => {
      hasMp3Encoder = /libmp3lame/i.test(out);
      mp3SupportChecked = true;
      resolve(hasMp3Encoder);
    });
    proc.on('error', () => {
      mp3SupportChecked = true;
      hasMp3Encoder = false;
      resolve(false);
    });
  } catch {
    mp3SupportChecked = true;
    hasMp3Encoder = false;
    resolve(false);
  }
});

export const getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ success: false, error: 'Invalid YouTube URL provided' });
    }

    const ytDlpProcess = spawn(ytDlpPath, [
      '--dump-single-json',
      '--no-warnings',
      ...getAuthArgs(),
      url
    ]);

    let jsonData = '';
    ytDlpProcess.stdout.on('data', (data) => {
      jsonData += data.toString();
    });

    ytDlpProcess.stderr.on('data', (data) => {
      console.error(`yt-dlp stderr: ${data}`);
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ success: false, error: 'Failed to fetch video information from yt-dlp.' });
      }

      try {
        const metadata = JSON.parse(jsonData);

        // Helper function to parse upload date format (YYYYMMDD)
        const parseUploadDate = (dateString) => {
          if (!dateString) return null;
          if (typeof dateString === 'string' && dateString.length === 8 && /^\d{8}$/.test(dateString)) {
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            return `${year}-${month}-${day}`;
          }
          return dateString;
        };

        const videoDetails = {
          title: metadata.title,
          author: metadata.uploader,
          lengthSeconds: metadata.duration,
          viewCount: metadata.view_count,
          publishDate: parseUploadDate(metadata.upload_date),
          description: metadata.description,
          thumbnail: metadata.thumbnail
        };

        const allFormats = metadata.formats || [];
        const audioFormats = allFormats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
        const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

        // Collect video candidates (video-only and progressive)
        const videoCandidates = allFormats.filter(f => f.vcodec !== 'none' && f.height);

        const qualityMap = new Map();
        videoCandidates.forEach(f => {
          let qualityLabel;
          if (f.height >= 2160) qualityLabel = '2160p';
          else if (f.height >= 1440) qualityLabel = '1440p';
          else if (f.height >= 1080) qualityLabel = '1080p';
          else if (f.height >= 720) qualityLabel = '720p';
          else if (f.height >= 480) qualityLabel = '480p';
          else if (f.height >= 360) qualityLabel = '360p';
          else if (f.height >= 240) qualityLabel = '240p';
          else qualityLabel = '144p';

          const existing = qualityMap.get(qualityLabel);
          if (!existing || (f.tbr || 0) > (existing.tbr || 0)) {
            qualityMap.set(qualityLabel, f);
          }
        });

        // Build ordered list of standard qualities (ascending)
        const standardQualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
        const videoFormats = [];

        // Get all available qualities for fallback
        const availableQualities = Array.from(qualityMap.keys());
        
        standardQualities.forEach(label => {
          let f = qualityMap.get(label);
          
          // If exact quality not available, find closest available quality
          if (!f && availableQualities.length > 0) {
            const targetHeight = parseInt(label);
            
            // Find the closest quality that's >= target, or use highest available
            const sortedAvailable = availableQualities
              .map(q => ({ label: q, height: parseInt(q) }))
              .sort((a, b) => a.height - b.height);
            
            const closest = sortedAvailable.find(q => q.height >= targetHeight) || 
                           sortedAvailable[sortedAvailable.length - 1];
            
            if (closest) {
              f = qualityMap.get(closest.label);
            }
          }
          
          if (!f) return; // Skip if still no format available

          const baseInfo = {
            qualityLabel: label,
            quality: f.height,
            fps: f.fps,
            mimeType: 'video/mp4',
            contentLength: f.filesize || f.filesize_approx || null,
            width: f.width,
            height: f.height,
            tbr: f.tbr || 0
          };

          if (f.acodec && f.acodec !== 'none') {
            // Progressive (already has audio)
            videoFormats.push({
              ...baseInfo,
              itag: f.format_id,
              hasAudio: true,
              merge: false
            });
          } else if (bestAudio) {
            // Video-only: require merge with best audio
            videoFormats.push({
              ...baseInfo,
              vItag: f.format_id,
              aItag: bestAudio.format_id,
              hasAudio: true,
              merge: true
            });
          }
        });

        // Add fallback formats for all standard qualities to ensure we always show all options
        // This ensures users see all quality options even if some aren't directly available
        const existingQualities = videoFormats.map(f => f.qualityLabel);
        standardQualities.forEach(label => {
          if (!existingQualities.includes(label) && bestAudio) {
            // Add a fallback format selector for this quality
            videoFormats.push({
              itag: `best[height<=${parseInt(label)}]/worst[height>=${parseInt(label)}]/best`,
              qualityLabel: label,
              quality: parseInt(label),
              hasAudio: true,
              merge: true,
              vItag: `best[height<=${parseInt(label)}]/worst[height>=${parseInt(label)}]/best`,
              aItag: bestAudio.format_id,
              fps: 30,
              mimeType: 'video/mp4',
              contentLength: null,
              width: null,
              height: parseInt(label),
              tbr: null
            });
          }
        });

        const audioFinal = [96, 128, 160, 192, 256, 320].map(bitrate => ({ bitrate, isTranscoded: true }));

        res.status(200).json({
          success: true,
          videoInfo: videoDetails,
          formats: { video: videoFormats, audio: audioFinal }
        });
      } catch (e) {
        res.status(500).json({ success: false, error: 'Failed to parse video information.' });
      }
    });

  } catch (error) {
    console.error('Get Info Error:', error);
    res.status(500).json({ success: false, error: 'An unexpected error occurred.' });
  }
};

// Direct streaming: yt-dlp stdout -> HTTP response so the browser download starts immediately
const downloadWithYtDlp = (req, res, url, args, title, ext, qualityLabel) => {
  try {
    const filename = safeFilename(title, qualityLabel, ext);

    // Set headers immediately so browser shows download bar right away
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Accept-Ranges', 'none');
    
    // Force headers to be sent immediately
    if (res.flushHeaders) res.flushHeaders();

    // Ensure yt-dlp writes media to stdout
    const ytdlpArgs = [
      ...args,
      '--retries', '10',
      '--fragment-retries', '10',
      '--buffer-size', '1024K',
      '-N', '4'
    ];
    const outIndex = ytdlpArgs.indexOf('-o');
    if (outIndex !== -1 && outIndex + 1 < ytdlpArgs.length) {
      ytdlpArgs[outIndex + 1] = '-';
    } else {
      ytdlpArgs.push('-o', '-');
    }

    const ytdlpProc = spawn(ytDlpPath, [url, ...ytdlpArgs, ...getAuthArgs()], { stdio: ['ignore', 'pipe', 'pipe'] });

    const cleanup = () => {
      try { ytdlpProc.stdout.destroy(); } catch {}
      try { ytdlpProc.stderr.destroy(); } catch {}
      try { ytdlpProc.kill('SIGKILL'); } catch {}
    };

    onClientDisconnect(req, res, () => {
      cleanup();
      try { if (!res.writableEnded && !res.destroyed) res.end(); } catch {}
    });

    safePipe(ytdlpProc.stdout, res, (err) => {
      if (err) {
        console.error('Pipeline error (yt-dlp -> res):', err.message);
      }
      cleanup();
    });

    ytdlpProc.stderr.on('data', (data) => {
      const message = data.toString();
      if (/error/i.test(message)) {
        console.error('yt-dlp stderr:', message);
      }
    });

    ytdlpProc.on('error', (err) => {
      console.error('yt-dlp process error:', err);
      if (!res.headersSent && !res.writableEnded) res.status(500).send('Download process failed.');
      cleanup();
    });

    ytdlpProc.on('close', (code, signal) => {
      if (code === null) {
        console.error('yt-dlp exited with code null, signal:', signal);
      } else if (code !== 0) {
        console.error(`yt-dlp exited with code ${code}`);
      }
      cleanup();
    });

  } catch (error) {
    console.error('Download Error:', error);
    if (!res.headersSent) res.status(500).send('Internal Server Error.');
  }
};

export const downloadVideoGet = (req, res) => {
  const { url, itag, title } = req.query;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Invalid url' });
  }
  const fmt = (itag && typeof itag === 'string' && itag.length)
    ? itag
    : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';

  const args = ['-f', fmt, '-o', '-'];
  const quality = itag ? `itag ${itag}` : 'best';
  downloadWithYtDlp(req, res, url, args, title, 'mp4', quality);
};

export const mergeDownloadGet = (req, res) => {
  try {
    const { url, vItag, aItag, title } = req.query;
    const filename = safeFilename(title || 'youtube_video', '', 'mp4');

    console.log(`Merging YouTube video: vItag=${vItag}, aItag=${aItag}`);

    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');

    if (res.flushHeaders) res.flushHeaders();

    // Spawn TWO yt-dlp processes: one for video, one for audio
    // This allows us to pipe them both into ffmpeg simultaneously for on-the-fly merging
    // avoiding the need to wait for full download.

    const commonArgs = [
      url,
      '--output', '-',
      '--no-progress',
      '--quiet',
      '--retries', '10',
      '--fragment-retries', '10',
      '--buffer-size', '1024K',
      '-N', '4',
      ...getAuthArgs()
    ];

    const videoArgs = [...commonArgs, '-f', vItag];
    const audioArgs = [...commonArgs, '-f', aItag];

    const videoProcess = spawn(ytDlpPath, videoArgs, { stdio: ['ignore', 'pipe', 'ignore'] });
    const audioProcess = spawn(ytDlpPath, audioArgs, { stdio: ['ignore', 'pipe', 'ignore'] });

    // FFmpeg process
    // Inputs: pipe:3 (video), pipe:4 (audio)
    // We map them to the corresponding pipes in stdio array
    const ffmpegProcess = spawn(ffmpegStatic, [
      '-hide_banner', '-loglevel', 'error',
      '-i', 'pipe:3',
      '-i', 'pipe:4',
      '-map', '0:v',
      '-map', '1:a',
      '-c:v', 'copy', // Copy video stream (no transcoding)
      '-c:a', 'aac',  // Transcode audio to AAC for better MP4 compatibility (or copy if compatible)
      // Note: We use 'aac' to ensure audio works in MP4. 'copy' might fail if source is Opus/Vorbis in MP4 container for some players.
      // But for speed, 'copy' is better. Let's try 'copy' first, if it fails we might need aac.
      // Actually, standard is: if video is H.264, audio AAC. If video VP9, audio Opus.
      // MP4 container supports VP9+Opus (mostly).
      // Let's use -c copy for both to be safe on CPU.
      '-c', 'copy',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      '-avoid_negative_ts', 'make_zero',
      'pipe:1'
    ], { 
      stdio: [
        'ignore', 'pipe', 'pipe', 
        'pipe', // pipe:3 (video input)
        'pipe'  // pipe:4 (audio input)
      ] 
    });

    const cleanup = () => {
      try { videoProcess.stdout.destroy(); } catch {}
      try { videoProcess.kill('SIGKILL'); } catch {}
      try { audioProcess.stdout.destroy(); } catch {}
      try { audioProcess.kill('SIGKILL'); } catch {}
      try { ffmpegProcess.stdin.destroy(); } catch {}
      try { ffmpegProcess.stdout.destroy(); } catch {}
      try { ffmpegProcess.stderr.destroy(); } catch {}
      try { ffmpegProcess.kill('SIGKILL'); } catch {}
      try { if (!res.writableEnded && !res.destroyed) res.destroy(); } catch {}
    };

    onClientDisconnect(req, res, cleanup);

    // Pipe video -> ffmpeg pipe:3
    videoProcess.stdout.pipe(ffmpegProcess.stdio[3]);
    
    // Pipe audio -> ffmpeg pipe:4
    audioProcess.stdout.pipe(ffmpegProcess.stdio[4]);

    // Pipe ffmpeg stdout -> response
    safePipe(ffmpegProcess.stdout, res, (err) => {
      if (err && !res.headersSent && !res.writableEnded) {
        res.status(499).end();
      }
      cleanup();
    });

    // Error handling
    const handleProcError = (proc, name) => {
      proc.on('error', (err) => {
        console.error(`${name} process error:`, err);
        cleanup();
        if (!res.headersSent) res.status(500).json({ error: `${name} failed` });
      });
      proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
          console.error(`${name} exited with code ${code}`);
          // Don't necessarily fail here, as one stream might finish before the other
        }
      });
    };

    handleProcError(videoProcess, 'Video Download');
    handleProcError(audioProcess, 'Audio Download');

    ffmpegProcess.stderr.on('data', (data) => {
      console.error('FFmpeg stderr:', data.toString());
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg error:', err);
      cleanup();
      if (!res.headersSent) res.status(500).json({ error: 'Conversion failed' });
    });

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`FFmpeg exited with code ${code}`);
      } else {
        console.log('Merge completed successfully');
      }
      cleanup();
    });

  } catch (error) {
    console.error('YouTube Merge Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const downloadAudioGet = async (req, res) => {
  try {
    const { url, bitrate, title } = req.query;
    const quality = `${bitrate}k`;
    const mp3Ok = await checkMp3Support();
    const ext = mp3Ok ? 'mp3' : 'm4a';
    const filename = safeFilename(title, quality, ext);

    console.log(`Downloading audio: ${url} at ${bitrate}kbps as ${ext.toUpperCase()}`);

    // Set headers immediately so browser shows download bar right away
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', mp3Ok ? 'audio/mpeg' : 'audio/mp4');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'none');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Connection', 'keep-alive');

    if (res.flushHeaders) res.flushHeaders();

    // First, use yt-dlp to get a consistent audio stream (prefer m4a/AAC)
    const ytdlpStream = spawn(ytDlpPath, [
      url,
      '-f', 'ba[ext=m4a]/ba/bestaudio/best', // Prefer m4a (AAC), fallback to best available
      '-o', '-',
      '--no-progress',
      '--quiet',
      '--retries', '10',
      '--fragment-retries', '10',
      '--buffer-size', '1024K',
      '-N', '4',
      ...getAuthArgs()
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Validate bitrate
    const br = Number.parseInt(bitrate, 10);
    const safeBr = Number.isFinite(br) && br > 0 ? Math.min(Math.max(br, 64), 320) : 192;

    // Prefer MP3 only if libmp3lame is available
    const preferMp3 = mp3Ok;

    const ffmpegArgsMp3 = [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-vn',
      '-acodec', 'libmp3lame',
      '-b:a', `${safeBr}k`,
      '-ar', '44100',
      '-ac', '2',
      '-f', 'mp3',
      '-write_xing', '0',
      'pipe:1'
    ];

    const ffmpegArgsAac = [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-vn',
      '-c:a', 'aac',
      '-b:a', `${safeBr}k`,
      '-ar', '44100',
      '-ac', '2',
      '-f', 'mp4',
      'pipe:1'
    ];

    // Choose encoder based on requested extension (we keep MP3 request, but can fallback to AAC if env lacks mp3 encoder)
    let ffmpegStream = spawn(ffmpegStatic, preferMp3 ? ffmpegArgsMp3 : ffmpegArgsAac, { stdio: ['pipe', 'pipe', 'pipe'] });

    const cleanup = () => {
      try { ytdlpStream.stdout.destroy(); } catch {}
      try { ytdlpStream.stderr.destroy(); } catch {}
      try { ffmpegStream.stdin.destroy(); } catch {}
      try { ffmpegStream.stdout.destroy(); } catch {}
      try { ffmpegStream.stderr.destroy(); } catch {}
      try { ytdlpStream.kill('SIGKILL'); } catch {}
      try { ffmpegStream.kill('SIGKILL'); } catch {}
    };

    onClientDisconnect(req, res, () => {
      cleanup();
      try { if (!res.writableEnded && !res.destroyed) res.end(); } catch {}
    });

    // Pipe yt-dlp output to FFmpeg input
    safePipe(ytdlpStream.stdout, ffmpegStream.stdin, (err) => {
      if (err) console.error('Pipeline error (yt-dlp -> ffmpeg):', err.message);
    });
    ffmpegStream.stdin.on('error', (e) => {
      // Happens if ffmpeg dies early; avoid crashing the process
      console.warn('FFmpeg stdin error:', e.message);
    });

    // Pipe FFmpeg output to response
    safePipe(ffmpegStream.stdout, res, (err) => {
      if (err && !res.headersSent && !res.writableEnded) {
        console.error('Pipeline error (ffmpeg -> res):', err.message);
      }
      cleanup();
    });

    // Error handling for yt-dlp
    ytdlpStream.stderr.on('data', (data) => {
      const message = data.toString();
      // Only log actual errors, not progress messages
      if (message.toLowerCase().includes('error')) {
        console.error(`yt-dlp stderr: ${message}`);
      }
    });

    ytdlpStream.on('error', (err) => {
      console.error('yt-dlp process error:', err);
      if (!res.headersSent) {
        res.status(500).send('Audio download failed.');
      }
    });

    ytdlpStream.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp exited with code ${code}`);
      }
    });

    // Error handling for FFmpeg
    ffmpegStream.stderr.on('data', (data) => {
      const message = data.toString();
      if (message) {
        console.error(`FFmpeg stderr: ${message}`);
      }
    });

    ffmpegStream.on('error', (err) => {
      console.error('FFmpeg process error (audio):', err);
      if (!res.headersSent) {
        res.status(500).send('Audio conversion failed.');
      }
    });

    ffmpegStream.on('close', (code) => {
      if (code === 0) {
        console.log(`Audio download completed: ${filename}`);
      } else {
        console.error(`FFmpeg exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).send('Audio conversion failed.');
        }
      }
    });

  } catch (error) {
    console.error('Audio Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const downloadVideo = (req, res) => {
  req.query = { ...req.query, ...req.body };
  return downloadVideoGet(req, res);
};
