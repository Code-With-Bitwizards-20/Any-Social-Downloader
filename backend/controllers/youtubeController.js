import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

// yt-dlp path (will be installed on VPS)
const ytDlpPath = process.env.YT_DLP_PATH || 'yt-dlp';

// Utility: Extract video ID from YouTube URL
const getVideoId = (url) => {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Utility: Safe filename generator
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

// Get Video Information using yt-dlp
export const getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        error: 'URL is required' 
      });
    }

    const videoId = getVideoId(url);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid YouTube URL' 
      });
    }

    console.log(`Fetching YouTube video info for ID: ${videoId}`);

    // Use yt-dlp to get video information
    const ytDlpProcess = spawn(ytDlpPath, [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      url
    ]);

    let jsonOutput = '';
    let errorOutput = '';

    ytDlpProcess.stdout.on('data', (data) => {
      jsonOutput += data.toString();
    });

    ytDlpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorOutput);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch video information',
          details: errorOutput
        });
      }

      try {
        const data = JSON.parse(jsonOutput);

        // Build video info
        const videoInfo = {
          title: data.title || 'Unknown Title',
          author: data.uploader || data.channel || 'Unknown',
          lengthSeconds: data.duration || 0,
          viewCount: data.view_count || 0,
          publishDate: data.upload_date || null,
          description: data.description || '',
          thumbnail: data.thumbnail || ''
        };

        // Process video formats
        const videoFormats = [];
        if (data.formats && Array.isArray(data.formats)) {
          data.formats.forEach(format => {
            // Only include formats with video
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

        // Audio formats (standard bitrates)
        const audioFormats = [
          { bitrate: 320 },
          { bitrate: 256 },
          { bitrate: 192 },
          { bitrate: 160 },
          { bitrate: 128 },
          { bitrate: 96 }
        ];

        console.log(`Found ${videoFormats.length} video formats and ${audioFormats.length} audio options`);

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

    console.log(`Downloading video: ${filename}`);

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Use yt-dlp to download
    const formatArg = itag ? `-f ${itag}` : '-f best';
    const ytDlpArgs = [
      ...formatArg.split(' '),
      '--no-warnings',
      '--no-playlist',
      '-o', '-',  // Output to stdout
      videoUrl
    ];

    const ytDlpProcess = spawn(ytDlpPath, ytDlpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

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

// Merge Download (for compatibility)
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

    console.log(`Downloading audio: ${filename} at ${targetBitrate}kbps`);

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    // Use yt-dlp to extract audio
    const ytDlpProcess = spawn(ytDlpPath, [
      '-f', 'bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${targetBitrate}K`,
      '--no-warnings',
      '--no-playlist',
      '-o', '-',  // Output to stdout
      videoUrl
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    ytDlpProcess.stdout.pipe(res);

    ytDlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytDlpProcess.on('close', (code) => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: 'Audio download failed' });
      }
    });

    ytDlpProcess.on('error', (error) => {
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
