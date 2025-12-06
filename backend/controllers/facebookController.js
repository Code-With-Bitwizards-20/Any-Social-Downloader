import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { pipeline } from 'stream';

// Path to yt-dlp executable
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

// Path to Facebook cookies file
const COOKIES_PATH = './cookies-fb/cookies.txt';

// Utility function to create safe filenames (Windows-safe, similar to YouTube controller)
const safeFilename = (title, suffix = '', ext = 'mp4') => {
  const raw = (title || 'video').toString();
  const cleaned = raw
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const ascii = cleaned.normalize('NFKD').replace(/[^\w\d\-\. ]+/g, '');
  const base = ascii.replace(/\s+/g, '_').slice(0, 80) || 'video';
  const sfx = suffix ? `_${suffix}` : '';
  return `${base}${sfx}.${ext}`;
};

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

const safePipe = (src, dest, onError) => {
  return pipeline(src, dest, (err) => {
    if (err) {
      onError?.(err);
    }
  });
};

export const getFacebookVideoInfo = async (req, res) => {
  const { url } = req.body;
  console.log('Facebook info request for URL:', url);

  try {
    // Helper function to fetch info
    const fetchInfo = (withCookies) => {
      return new Promise((resolve, reject) => {
        const args = [
          '--dump-single-json',
          '--no-warnings',
          '--no-check-certificates',
          '--no-playlist',
        ];

        if (withCookies) {
          args.push('--cookies', COOKIES_PATH);
        }

        args.push(url);

        const process = spawn(YT_DLP_PATH, args);
        let jsonData = '';
        let errorData = '';

        process.stdout.on('data', (data) => jsonData += data.toString());
        process.stderr.on('data', (data) => errorData += data.toString());

        process.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(errorData || 'Process exited with code ' + code));
          } else {
            resolve(jsonData);
          }
        });
      });
    };

    // Try with cookies first
    let metadata;
    try {
      console.log('Trying with cookies...');
      const jsonOutput = await fetchInfo(true);
      metadata = JSON.parse(jsonOutput);
    } catch (cookieError) {
      console.warn('Failed with cookies, retrying without...', cookieError.message.split('\n')[0]);
      // Retry without cookies
      try {
        const jsonOutput = await fetchInfo(false);
        metadata = JSON.parse(jsonOutput);
      } catch (noCookieError) {
        // Both failed, throw the original or most relevant error
        console.error('Failed without cookies too:', noCookieError.message);
        
        // Check for specific error types to give better user feedback
        let userMessage = 'Failed to fetch video information';
        const errorMsg = (cookieError.message + noCookieError.message).toLowerCase();
        
        if (errorMsg.includes('login') || errorMsg.includes('sign in') || errorMsg.includes('private')) {
          userMessage = 'This video is private or requires login. Only public Facebook videos can be downloaded.';
        } else if (errorMsg.includes('not available') || errorMsg.includes('removed')) {
          userMessage = 'This video is not available or has been removed.';
        }

        // Must return JSON content-type explicitly if global error handler misses it
        return res.status(400).json({ 
          success: false,
          error: userMessage,
          details: noCookieError.message
        });
      }
    }


        const parseUploadDate = (dateString) => {
          if (!dateString) return null;
          if (typeof dateString === 'string' && dateString.length === 8 && /^\d{8}$/.test(dateString)) {
            // Format: YYYYMMDD -> YYYY-MM-DD
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            return `${year}-${month}-${day}`;
          }
          return dateString; // Return as-is if not in YYYYMMDD format
        };

        // Format video details to match YouTube controller format
        const videoDetails = {
          title: metadata.title || 'Facebook Video',
          author: metadata.uploader || 'Unknown',
          lengthSeconds: metadata.duration || 0,
          viewCount: metadata.view_count || 0,
          publishDate: parseUploadDate(metadata.upload_date),
          description: metadata.description || '',
          thumbnail: metadata.thumbnail || null
        };

        // Process formats to separate video and audio
        const allFormats = metadata.formats || [];
        
        // Get available video and audio formats
        const videoOnlyFormats = allFormats.filter(f => f.vcodec !== 'none' && f.height);
        const audioFormats = allFormats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
        const bestAudio = audioFormats.length > 0 ? audioFormats[0] : null;
        
        console.log('Available video formats:', videoOnlyFormats.map(f => ({ id: f.format_id, height: f.height, hasAudio: f.acodec !== 'none' })));
        console.log('Best audio format:', bestAudio ? bestAudio.format_id : 'None');
        
        // Process video formats and map to standard qualities
        const videoFormats = [];
        const qualityMap = new Map();
        
        // First, collect all available video formats
        videoOnlyFormats.forEach(f => {
          let qualityLabel = `${f.height}p`;
          
          // Map Facebook resolutions to standard qualities
          if (f.height >= 1080) {
            qualityLabel = '1080p';
          } else if (f.height >= 720) {
            qualityLabel = '720p';
          } else if (f.height >= 480) {
            qualityLabel = '480p';
          } else if (f.height >= 360) {
            qualityLabel = '360p';
          } else if (f.height >= 240) {
            qualityLabel = '240p';
          } else {
            qualityLabel = '144p';
          }
          
          // Only keep the best format for each quality
          const existingFormat = qualityMap.get(qualityLabel);
          if (!existingFormat || f.tbr > existingFormat.tbr) {
            qualityMap.set(qualityLabel, {
              itag: f.format_id,
              qualityLabel,
              quality: f.height,
              hasAudio: f.acodec !== 'none',
              merge: f.acodec === 'none' && bestAudio ? true : false,
              vItag: f.acodec === 'none' && bestAudio ? f.format_id : undefined,
              aItag: f.acodec === 'none' && bestAudio ? bestAudio.format_id : undefined,
              fps: f.fps,
              mimeType: `video/${f.ext}`,
              contentLength: f.filesize,
              width: f.width,
              height: f.height,
              tbr: f.tbr || 0
            });
          }
        });
        
        // Convert map to array and sort by quality (ascending - lowest first)
        const standardQualities = ['144p', '240p', '360p', '480p', '720p', '1080p'];
        const availableQualities = Array.from(qualityMap.keys());
        
        standardQualities.forEach(quality => {
          let format = qualityMap.get(quality);
          
          // If exact quality not available, use the best available quality as fallback
          if (!format && availableQualities.length > 0) {
            // Find the best quality that's >= the requested quality, or use the highest available
            const targetHeight = parseInt(quality);
            const bestAvailable = availableQualities
              .map(q => ({ quality: q, height: parseInt(q) }))
              .filter(q => q.height >= targetHeight)
              .sort((a, b) => a.height - b.height)[0] || 
              availableQualities
              .map(q => ({ quality: q, height: parseInt(q) }))
              .sort((a, b) => b.height - a.height)[0];
              
            if (bestAvailable) {
              const originalFormat = qualityMap.get(bestAvailable.quality);
              format = {
                ...originalFormat,
                qualityLabel: quality,
                // Use a more generic format selector for fallback
                itag: bestAudio ? `best[height<=${targetHeight}]+bestaudio/best` : `best[height<=${targetHeight}]/best`
              };
            }
          }
          
          if (format) {
            // Ensure proper format setup for merging or direct download
            if (format.merge && format.vItag && format.aItag) {
              format.itag = `${format.vItag}+${format.aItag}`;
              format.hasAudio = true;
            }
            
            videoFormats.push(format);
          }
        });
        
        // Sort by quality ASCENDING (lowest first: 144p at top, 1080p at bottom)
        videoFormats.sort((a, b) => {
           const valA = parseInt(a.qualityLabel) || 0;
           const valB = parseInt(b.qualityLabel) || 0;
           return valA - valB;
        });

        console.log('Processed video formats:', videoFormats.map(f => ({ quality: f.qualityLabel, itag: f.itag, hasAudio: f.hasAudio, merge: f.merge })));

        // Audio formats - standard MP3 bitrates (lowest first)
        const transcodeAudioFormats = [96, 128, 160, 192, 256, 320].map(bitrate => ({
          bitrate,
          isTranscoded: true
        }));

        const formattedResponse = {
          success: true,
          videoInfo: videoDetails,
          formats: {
            video: videoFormats,
            audio: transcodeAudioFormats
          }
        };

        console.log('Facebook video info retrieved successfully');
        res.status(200).json(formattedResponse);



  } catch (error) {
    console.error('Facebook Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

export const downloadFacebookVideo = async (req, res) => {
  try {
    const { url, itag, format_id, title, bitrate } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    
    // Check if it's an audio download request (standard bitrates)
    const isAudio = bitrate || (['96', '128', '160', '192', '256', '320'].includes(String(selectedFormatId)));
    
    console.log(`Facebook download request: URL=${url}, Format=${selectedFormatId}, Audio=${isAudio}`);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Common Headers
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Connection', 'keep-alive');

    if (isAudio) {
      // --- AUDIO DOWNLOAD (Convert to MP3) ---
      const targetBitrate = parseInt(bitrate || selectedFormatId) || 128;
      const filename = safeFilename(title || 'facebook_audio', `${targetBitrate}kbps`, 'mp3');

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      // 1. Get Audio Stream from yt-dlp
      const ytdlpArgs = [
        '-f', 'bestaudio/best',    // Get best available audio
        // '--cookies', COOKIES_PATH, // Cookies removed to prevent 0KB errors on public videos
        '--no-warnings',
        '--no-check-certificates',
        '--no-playlist',
        '--buffer-size', '16M',
        '-o', '-',                 // Output to stdout
        url
      ];

      const ytdlpProcess = spawn(YT_DLP_PATH, ytdlpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

      // 2. Pipe to FFmpeg for Conversion
      const ffmpegArgs = [
        '-i', 'pipe:0',            // Input from yt-dlp
        '-vn',                     // No video
        '-acodec', 'libmp3lame',   // MP3 Encoder
        '-b:a', `${targetBitrate}k`,
        '-ar', '44100',
        '-ac', '2',
        '-f', 'mp3',               // Force MP3 behavior
        'pipe:1'                   // Output to stdout
      ];

      const ffmpegProcess = spawn(ffmpegStatic, ffmpegArgs, { stdio: ['pipe', 'pipe', 'pipe'] });

      // Pipeline: yt-dlp -> ffmpeg -> response
      ytdlpProcess.stdout.pipe(ffmpegProcess.stdin);
      ffmpegProcess.stdout.pipe(res);

      // Error Handling
      ytdlpProcess.stderr.on('data', d => console.error('yt-dlp stderr:', d.toString()));
      ffmpegProcess.stderr.on('data', d => {
        const msg = d.toString();
        if (msg.includes('Error')) console.error('FFmpeg stderr:', msg);
      });

      const cleanup = () => {
        ytdlpProcess.kill();
        ffmpegProcess.kill();
      };

      req.on('close', cleanup);

    } else {
      // --- VIDEO DOWNLOAD (Direct Stream) ---
      const filename = safeFilename(title || 'facebook_video', '', 'mp4');
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Type', 'video/mp4');

      const args = [
        // '--cookies', COOKIES_PATH, // Cookies removed to prevent 0KB errors
        '--no-warnings',
        '--no-check-certificates',
        '--no-playlist',
        '--buffer-size', '32M',
        '--http-chunk-size', '10M',
        '-o', '-',
      ];

      if (selectedFormatId && selectedFormatId !== 'best') {
         args.push('-f', selectedFormatId);
      } else {
         args.push('-f', 'best');
      }

      args.push(url); // URL last

      const ytdlpProcess = spawn(YT_DLP_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

      ytdlpProcess.stdout.pipe(res);

      ytdlpProcess.stderr.on('data', d => console.error('yt-dlp stderr:', d.toString()));
      
      req.on('close', () => ytdlpProcess.kill());
    }

  } catch (error) {
    console.error('Download Logic Error:', error);
    if (!res.headersSent) res.status(500).send('Internal Server Error');
  }
};

export const mergeFacebookVideoAudio = (req, res) => {
  try {
    const { url, vItag, aItag, title } = req.query;
    const filename = safeFilename(title || 'facebook_video', '', 'mp4');
    
    console.log(`Merging Facebook video+audio: vItag=${vItag}, aItag=${aItag}`);
    
    // Set response headers for download so browser starts immediately
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked'); // Use chunked for streaming
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

    if (res.flushHeaders) res.flushHeaders();

    // Spawn TWO yt-dlp processes: one for video, one for audio
    // This prevents "ffmpeg exited with code -11" (segfault) by avoiding yt-dlp's internal merge
    
    const commonArgs = [
      url,
      '--output', '-',
      // '--cookies', COOKIES_PATH,    // Removed to fix 0KB public video issues
      '--no-check-certificates',
      '--no-warnings',
      '--no-playlist',
      '--no-progress',
      '--quiet',
      '--retries', '10',
      '--fragment-retries', '10',
      '--buffer-size', '16M'
    ];

    // Video Process
    const videoArgs = [...commonArgs, '-f', vItag];
    const videoProcess = spawn(YT_DLP_PATH, videoArgs, { stdio: ['ignore', 'pipe', 'ignore'] });

    // Audio Process
    const audioArgs = [...commonArgs, '-f', aItag];
    const audioProcess = spawn(YT_DLP_PATH, audioArgs, { stdio: ['ignore', 'pipe', 'ignore'] });

    // FFmpeg Process: Inputs from pipe:3 (Video) and pipe:4 (Audio)
    const ffmpegProcess = spawn(ffmpegStatic, [
      '-hide_banner', '-loglevel', 'error',
      '-i', 'pipe:3', // Video Input
      '-i', 'pipe:4', // Audio Input
      '-map', '0:v',
      '-map', '1:a',
      '-c:v', 'copy', // Copy video (no transcoding = fast)
      '-c:a', 'aac',  // Transcode audio to AAC (safe for MP4)
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      '-avoid_negative_ts', 'make_zero',
      'pipe:1' // Output to stdout
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

    // Pipe Video -> FFmpeg pipe:3
    videoProcess.stdout.pipe(ffmpegProcess.stdio[3]);
    
    // Pipe Audio -> FFmpeg pipe:4
    audioProcess.stdout.pipe(ffmpegProcess.stdio[4]);

    // Pipe FFmpeg -> Response
    safePipe(ffmpegProcess.stdout, res, (err) => {
      if (err && !res.headersSent && !res.writableEnded) {
        console.error('Pipeline error (Facebook ffmpeg -> res):', err.message);
      }
      cleanup();
    });

    // Error Handling
    const handleProcError = (proc, name) => {
      proc.on('error', (err) => {
        console.error(`${name} process error:`, err);
        cleanup();
        if (!res.headersSent) res.status(500).json({ error: `${name} failed` });
      });
      // We don't fail on non-zero exit immediately as one stream might finish earlier
    };

    handleProcError(videoProcess, 'Video Download');
    handleProcError(audioProcess, 'Audio Download');

    ffmpegProcess.stderr.on('data', (data) => {
      console.error('FFmpeg stderr:', data.toString());
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg process error:', err);
      cleanup();
      if (!res.headersSent) res.status(500).json({ error: 'Conversion failed' });
    });

    ffmpegProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`FFmpeg exited with code ${code}`);
      } else {
        console.log('Facebook merge completed successfully');
      }
      cleanup();
    });

  } catch (error) {
    console.error('Facebook Merge Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const downloadFacebookAudio = (req, res) => {
  try {
    const { url, bitrate, title } = req.query;
    const quality = `${bitrate}k`;
    const filename = safeFilename(title, quality, 'mp3');
    
    console.log(`Downloading Facebook MP3 audio: ${url} at ${bitrate}kbps`);
    
    // Set proper headers for streaming MP3 download so browser starts immediately
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'none');

    // First, use yt-dlp to get the best audio stream (with optimization)
    const ytdlpStream = spawn(YT_DLP_PATH, [
      url,
      '-f', 'bestaudio',      // Get best audio quality
      '-o', '-',              // Output to stdout
      '--cookies', COOKIES_PATH,  // Use Facebook cookies
      '--buffer-size', '32M', // Massive buffer for speed
      '--http-chunk-size', '20M',
      '--no-check-certificates',
      '--no-progress',
      '--quiet'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Then pipe through FFmpeg to convert to MP3 with specified bitrate
    const ffmpegStream = spawn(ffmpegStatic, [
      '-hide_banner', '-loglevel', 'error',
      '-i', 'pipe:0', // Input from stdin (yt-dlp output)
      '-vn', // No video
      '-acodec', 'libmp3lame', // Use MP3 encoder
      '-b:a', `${bitrate}k`, // Set audio bitrate
      '-ar', '44100', // Set sample rate
      '-ac', '2', // Stereo audio
      '-f', 'mp3', // Output format
      '-write_xing', '0', // Disable Xing header for streaming
      'pipe:1' // Output to stdout
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

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
      if (err) console.error('Pipeline error (Facebook yt-dlp -> ffmpeg audio):', err.message);
    });
    
    // Pipe FFmpeg output to response
    safePipe(ffmpegStream.stdout, res, (err) => {
      if (err && !res.headersSent && !res.writableEnded) {
        console.error('Pipeline error (Facebook ffmpeg audio -> res):', err.message);
      }
      cleanup();
    });

    // Track if data has been sent
    let dataSent = false;
    ffmpegStream.stdout.on('data', () => {
      dataSent = true;
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
      // Only log actual errors, not progress messages
      if (message.toLowerCase().includes('error')) {
        console.error(`FFmpeg stderr: ${message}`);
      }
    });

    ffmpegStream.on('error', (err) => {
      console.error('FFmpeg process error:', err);
      if (!res.headersSent) {
        res.status(500).send('Audio conversion failed.');
      } else if (!dataSent) {
        res.end();
      }
    });

    ffmpegStream.on('close', (code) => {
      if (code === 0) {
        console.log(`Facebook MP3 download completed: ${filename}`);
      } else {
        console.error(`FFmpeg exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).send('Audio conversion failed.');
        }
      }
    });

    // Client disconnect cleanup handled by onClientDisconnect

  } catch (error) {
    console.error('Facebook Audio Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};
