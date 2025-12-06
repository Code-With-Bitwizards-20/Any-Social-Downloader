import ytdl from 'ytdl-core';
import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
import { pipeline } from 'stream';
import { google } from 'googleapis';

// YouTube Data API v3 client (optional)
const youtube = process.env.YOUTUBE_API_KEY && process.env.USE_YOUTUBE_API === 'true'
  ? google.youtube({ version: 'v3', auth: process.env.YOUTUBE_API_KEY })
  : null;

// Utility: Extract video ID from YouTube URL
const getVideoId = (url) => {
  try {
    const videoId = ytdl.getURLVideoID(url);
    return videoId;
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

// Utility: Format numbers (views, likes, etc.)
const formatNumber = (num) => {
  if (!num) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Utility: Parse duration to seconds
const parseDuration = (duration) => {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);
  
  return hours * 3600 + minutes * 60 + seconds;
};

// Get Video Information
export const getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid YouTube URL provided' 
      });
    }

    const videoId = getVideoId(url);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not extract video ID from URL' 
      });
    }

    // Fetch video info using ytdl-core
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Optionally enhance with YouTube Data API
    let enhancedDetails = null;
    if (youtube) {
      try {
        const response = await youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails'],
          id: [videoId]
        });
        
        if (response.data.items && response.data.items.length > 0) {
          enhancedDetails = response.data.items[0];
        }
      } catch (apiError) {
        console.warn('YouTube API error (falling back to ytdl-core):', apiError.message);
      }
    }

    // Build video details object
    const videoInfo = {
      title: videoDetails.title,
      author: videoDetails.author?.name || videoDetails.ownerChannelName,
      lengthSeconds: parseInt(videoDetails.lengthSeconds) || 0,
      viewCount: parseInt(videoDetails.viewCount) || 0,
      publishDate: enhancedDetails?.snippet?.publishedAt || videoDetails.publishDate,
      description: videoDetails.description,
      thumbnail: videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || 
                 enhancedDetails?.snippet?.thumbnails?.maxres?.url ||
                 enhancedDetails?.snippet?.thumbnails?.high?.url
    };

    // Get available formats
    const formats = info.formats;

    // Filter video formats (with video stream)
    const videoFormats = formats
      .filter(f => f.hasVideo && f.container === 'mp4')
      .filter(f => f.qualityLabel) // Has quality label like 720p, 1080p
      .sort((a, b) => (b.height || 0) - (a.height || 0)); // Sort by quality descending

    // Create quality map to get best format for each quality
    const qualityMap = new Map();
    videoFormats.forEach(f => {
      const label = f.qualityLabel;
      if (!qualityMap.has(label)) {
        qualityMap.set(label, {
          itag: f.itag,
          qualityLabel: label,
          quality: f.height,
          fps: f.fps,
          hasAudio: f.hasAudio,
          mimeType: f.mimeType,
          contentLength: f.contentLength,
          width: f.width,
          height: f.height,
          bitrate: f.bitrate
        });
      }
    });

    // Convert to array and ensure we have all standard qualities
    const standardQualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
    const videoFormatsList = [];
    
    standardQualities.forEach(label => {
      if (qualityMap.has(label)) {
        videoFormatsList.push(qualityMap.get(label));
      }
    });

    // Audio formats (for downloads)
    const audioFormats = [
      { bitrate: 96, isTranscoded: true },
      { bitrate: 128, isTranscoded: true },
      { bitrate: 160, isTranscoded: true },
      { bitrate: 192, isTranscoded: true },
      { bitrate: 256, isTranscoded: true },
      { bitrate: 320, isTranscoded: true }
    ];

    res.status(200).json({
      success: true,
      videoInfo,
      formats: {
        video: videoFormatsList,
        audio: audioFormats
      }
    });

  } catch (error) {
    console.error('Get Info Error:', error);
    
    // Handle specific ytdl-core errors
    if (error.message.includes('Video unavailable')) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not available or has been removed' 
      });
    }
    
    if (error.message.includes('private video')) {
      return res.status(403).json({ 
        success: false, 
        error: 'This video is private' 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch video information',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Download Video
export const downloadVideo = async (req, res) => {
  try {
    const { url, itag, title } = req.body;

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoTitle = title || info.videoDetails.title;
    
    // Find format by itag or use best quality
    let format;
    if (itag) {
      format = info.formats.find(f => f.itag == itag);
    }
    
    if (!format) {
      // Fallback to best quality with audio
      format = ytdl.chooseFormat(info.formats, { 
        quality: 'highestvideo',
        filter: f => f.hasVideo && f.hasAudio 
      });
    }

    const filename = safeFilename(videoTitle, format.qualityLabel || 'video', 'mp4');

    // Set headers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    if (format.contentLength) {
      res.setHeader('Content-Length', format.contentLength);
    }

    // Stream video directly to response
    const videoStream = ytdl(url, { format });
    
    videoStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });

    pipeline(videoStream, res, (err) => {
      if (err) {
        console.error('Pipeline error:', err);
      }
    });

  } catch (error) {
    console.error('Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Download Video (GET method for direct links)
export const downloadVideoGet = async (req, res) => {
  try {
    const { url, itag, title } = req.query;

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoTitle = title || info.videoDetails.title;
    
    // Find format by itag or use best quality
    let format;
    if (itag) {
      format = info.formats.find(f => f.itag == itag);
    }
    
    if (!format) {
      format = ytdl.chooseFormat(info.formats, { 
        quality: 'highestvideo',
        filter: f => f.hasVideo && f.hasAudio 
      });
    }

    const filename = safeFilename(videoTitle, format.qualityLabel || 'video', 'mp4');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    if (format.contentLength) {
      res.setHeader('Content-Length', format.contentLength);
    }

    const videoStream = ytdl(url, { format });
    
    videoStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).send('Download failed');
      }
    });

    pipeline(videoStream, res, (err) => {
      if (err) {
        console.error('Pipeline error:', err);
      }
    });

  } catch (error) {
    console.error('Download Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Download failed');
    }
  }
};

// Merge Download (for video-only + audio formats)
export const mergeDownloadGet = async (req, res) => {
  try {
    const { url, vItag, aItag, title } = req.query;

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoTitle = title || info.videoDetails.title;
    const filename = safeFilename(videoTitle, '', 'mp4');

    console.log(`Merging video (itag ${vItag}) with audio (itag ${aItag})`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Get video and audio streams
    const videoStream = ytdl(url, { quality: vItag });
    const audioStream = ytdl(url, { quality: aItag });

    // Merge using ffmpeg
    const ffmpegProcess = spawn(ffmpegStatic, [
      '-i', 'pipe:3', // Video input
      '-i', 'pipe:4', // Audio input
      '-map', '0:v',
      '-map', '1:a',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      'pipe:1'
    ], {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
    });

    // Pipe streams to ffmpeg
    videoStream.pipe(ffmpegProcess.stdio[3]);
    audioStream.pipe(ffmpegProcess.stdio[4]);

    // Handle errors
    const cleanup = () => {
      try { videoStream.destroy(); } catch {}
      try { audioStream.destroy(); } catch {}
      try { ffmpegProcess.kill(); } catch {}
    };

    videoStream.on('error', (err) => {
      console.error('Video stream error:', err);
      cleanup();
    });

    audioStream.on('error', (err) => {
      console.error('Audio stream error:', err);
      cleanup();
    });

    ffmpegProcess.stderr.on('data', (data) => {
      console.error('FFmpeg:', data.toString());
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg error:', err);
      cleanup();
      if (!res.headersSent) {
        res.status(500).send('Merge failed');
      }
    });

    // Pipe output to response
    pipeline(ffmpegProcess.stdout, res, (err) => {
      if (err) {
        console.error('Pipeline error:', err);
      }
      cleanup();
    });

  } catch (error) {
    console.error('Merge Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Merge failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Download Audio
export const downloadAudioGet = async (req, res) => {
  try {
    const { url, bitrate, title } = req.query;

    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const info = await ytdl.getInfo(url);
    const videoTitle = title || info.videoDetails.title;
    const targetBitrate = parseInt(bitrate) || 192;
    const filename = safeFilename(videoTitle, `${targetBitrate}k`, 'mp3');

    console.log(`Downloading audio: ${videoTitle} at ${targetBitrate}kbps`);

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Get best audio stream
    const audioStream = ytdl(url, {
      quality: 'highestaudio',
      filter: 'audioonly'
    });

    // Convert to MP3 using ffmpeg
    const ffmpegProcess = spawn(ffmpegStatic, [
      '-i', 'pipe:0',
      '-vn',
      '-acodec', 'libmp3lame',
      '-b:a', `${targetBitrate}k`,
      '-ar', '44100',
      '-ac', '2',
      '-f', 'mp3',
      'pipe:1'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Cleanup function
    const cleanup = () => {
      try { audioStream.destroy(); } catch {}
      try { ffmpegProcess.kill(); } catch {}
    };

    // Handle errors
    audioStream.on('error', (err) => {
      console.error('Audio stream error:', err);
      cleanup();
      if (!res.headersSent) {
        res.status(500).send('Audio download failed');
      }
    });

    ffmpegProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('error')) {
        console.error('FFmpeg:', msg);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('FFmpeg error:', err);
      cleanup();
      if (!res.headersSent) {
        res.status(500).send('Audio conversion failed');
      }
    });

    // Pipeline: audioStream -> ffmpeg -> response
    audioStream.pipe(ffmpegProcess.stdin);
    
    pipeline(ffmpegProcess.stdout, res, (err) => {
      if (err) {
        console.error('Pipeline error:', err);
      }
      cleanup();
    });

  } catch (error) {
    console.error('Audio Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Audio download failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};
