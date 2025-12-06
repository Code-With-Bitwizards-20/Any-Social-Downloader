import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { pipeline } from 'stream';

// Path to yt-dlp executable
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

// Path to YouTube cookies file
const COOKIES_PATH = './cookies-yt/cookies.txt';

// Utility function to create safe filenames
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

// Get Video Information
export const getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    console.log(`Fetching YouTube video info for URL: ${url}`);

    // Use yt-dlp to get video information (with cookies)
    const ytdlpProcess = spawn(YT_DLP_PATH, [
      '--dump-single-json',
      '--no-warnings',
      '--cookies', COOKIES_PATH,  // Use YouTube cookies
      url
    ]);

    let jsonOutput = '';
    let errorOutput = '';

    ytdlpProcess.stdout.on('data', (data) => {
      jsonOutput += data.toString();
    });

    ytdlpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorOutput);
        
        // Check for specific error types
        let userMessage = 'Failed to fetch video information';
        
        if (errorOutput.toLowerCase().includes('sign in') || 
            errorOutput.toLowerCase().includes('bot') ||
            errorOutput.toLowerCase().includes('private')) {
          userMessage = 'This video requires login or is age-restricted. Please try a different video.';
        } else if (errorOutput.toLowerCase().includes('not available') ||
                   errorOutput.toLowerCase().includes('removed')) {
          userMessage = 'This video is not available or has been removed.';
        }
        
        return res.status(400).json({ 
          success: false,
          error: userMessage,
          hint: 'Try a different video or check if the video is publicly accessible'
        });
      }

      try {
        const metadata = JSON.parse(jsonOutput);

        // Build video info
        const videoInfo = {
          title: metadata.title || 'Unknown Title',
          author: metadata.uploader || metadata.channel || 'Unknown',
          lengthSeconds: metadata.duration || 0,
          viewCount: metadata.view_count || 0,
          publishDate: metadata.upload_date || null,
          description: metadata.description || '',
          thumbnail: metadata.thumbnail || ''
        };

        // Process video formats
        const videoFormats = [];
        if (metadata.formats && Array.isArray(metadata.formats)) {
          metadata.formats.forEach(format => {
            if (format.vcodec && format.vcodec !== 'none') {
              const height = format.height || 0;
              const qualityLabel = height ? `${height}p` : 'unknown';
              
              videoFormats.push({
                itag: format.format_id,
                qualityLabel: qualityLabel,
                quality: height,
                hasAudio: format.acodec && format.acodec !== 'none',
                url: format.url || null,
                mimeType: format.ext || 'mp4',
                contentLength: format.filesize || null,
                width: format.width || null,
                height: height,
                fps: format.fps || null
              });
            }
          });
        }

        // Sort by quality descending
        videoFormats.sort((a, b) => (b.quality || 0) - (a.quality || 0));

        // Audio formats
        const audioFormats = [
          { bitrate: 320 },
          { bitrate: 256 },
          { bitrate: 192 },
          { bitrate: 160 },
          { bitrate: 128 },
          { bitrate: 96 }
        ];

        console.log(`Found ${videoFormats.length} video formats`);

        res.status(200).json({
          success: true,
          videoInfo,
          formats: {
            video: videoFormats,
            audio: audioFormats
          }
        });

      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to parse video information' 
        });
      }
    });

  } catch (error) {
    console.error('Get Info Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch video information'
    });
  }
};

// Download Video
export const downloadVideo = async (req, res) => {
  try {
    const { url: videoUrl, itag, title } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoTitle = title || 'video';
    const filename = safeFilename(videoTitle, '', 'mp4');

    console.log(`Downloading YouTube video: ${filename}`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const formatArg = itag ? `-f ${itag}` : '-f best';
    const ytDlpArgs = [
      ...formatArg.split(' '),
      '--cookies', COOKIES_PATH,
      '--buffer-size', '32M',           // Massive buffer
      '--http-chunk-size', '20M',       // Large chunks
      '--concurrent-fragments', '10',    // Max concurrency
      '--no-check-certificates',
      '--no-warnings',
      '--no-playlist',
      '-o', '-',
      videoUrl
    ];

    const ytDlpProcess = spawn(YT_DLP_PATH, ytDlpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

    ytDlpProcess.stdout.pipe(res);

    ytDlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });

    ytDlpProcess.on('error', (error) => {
      console.error('yt-dlp process error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });

  } catch (error) {
    console.error('Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed' });
    }
  }
};

// Download Video (GET method)
export const downloadVideoGet = async (req, res) => {
  req.body = { ...req.query };
  return downloadVideo(req, res);
};

// Merge Download
export const mergeDownloadGet = async (req, res) => {
  const { url, vItag, title } = req.query;
  req.body = { url, itag: vItag, title };
  return downloadVideo(req, res);
};

// Download Audio
export const downloadAudioGet = async (req, res) => {
  try {
    const { url: videoUrl, bitrate, title } = req.query;

    if (!videoUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoTitle = title || 'audio';
    const targetBitrate = parseInt(bitrate) || 128;
    const filename = safeFilename(videoTitle, `${targetBitrate}k`, 'mp3');

    console.log(`Downloading YouTube audio: ${filename} at ${targetBitrate}kbps`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    // Use yt-dlp to extract audio
    const ytdlpStream = spawn(YT_DLP_PATH, [
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${targetBitrate}K`,
      '--cookies', COOKIES_PATH,
      '--buffer-size', '32M',
      '--http-chunk-size', '20M',
      '--no-check-certificates',
      '--no-warnings',
      '--no-playlist',
      '-o', '-',
      videoUrl
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    ytdlpStream.stdout.pipe(res);

    ytdlpStream.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlpStream.on('close', (code) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Audio download failed' });
      }
    });

    ytdlpStream.on('error', (error) => {
      console.error('yt-dlp process error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Audio download failed' });
      }
    });

  } catch (error) {
    console.error('Audio Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Audio download failed' });
    }
  }
};

