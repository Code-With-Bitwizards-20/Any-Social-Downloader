import axios from 'axios';

// Cobalt.tools API for YouTube downloads
const COBALT_API = 'https://api.cobalt.tools/api/json';

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

    const videoId = getVideoId(url);
    if (!videoId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid YouTube URL' 
      });
    }

    console.log(`Fetching YouTube video info for ID: ${videoId}`);

    // Use Cobalt API to get video info
    const response = await axios.post(COBALT_API, {
      url: url,
      vQuality: 'max'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;

    if (data.status === 'error') {
      console.error('Cobalt API error:', data.text);
      return res.status(400).json({
        success: false,
        error: data.text || 'Failed to fetch video information'
      });
    }

    // Build video info from basic data
    const videoInfo = {
      title: `YouTube Video ${videoId}`,
      author: 'Unknown',
      lengthSeconds: 0,
      viewCount: 0,
      publishDate: null,
      description: '',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    };

    // Standard video qualities
    const videoFormats = [
      { itag: '2160', qualityLabel: '2160p', quality: 2160, hasAudio: true },
      { itag: '1440', qualityLabel: '1440p', quality: 1440, hasAudio: true },
      { itag: '1080', qualityLabel: '1080p', quality: 1080, hasAudio: true },
      { itag: '720', qualityLabel: '720p', quality: 720, hasAudio: true },
      { itag: '480', qualityLabel: '480p', quality: 480, hasAudio: true },
      { itag: '360', qualityLabel: '360p', quality: 360, hasAudio: true },
      { itag: '240', qualityLabel: '240p', quality: 240, hasAudio: true },
      { itag: '144', qualityLabel: '144p', quality: 144, hasAudio: true }
    ];

    // Audio formats
    const audioFormats = [
      { bitrate: 320 },
      { bitrate: 256 },
      { bitrate: 192 },
      { bitrate: 160 },
      { bitrate: 128 },
      { bitrate: 96 }
    ];

    console.log(`Video info fetched successfully for ${videoId}`);

    res.status(200).json({
      success: true,
      videoInfo,
      formats: {
        video: videoFormats,
        audio: audioFormats
      }
    });

  } catch (error) {
    console.error('Get Info Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch video information',
      details: error.message
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
    const quality = itag || '720';
    const filename = safeFilename(videoTitle, quality, 'mp4');

    console.log(`Downloading video: ${filename}`);

    // Request download from Cobalt
    const response = await axios.post(COBALT_API, {
      url: videoUrl,
      vQuality: quality,
      filenamePattern: 'basic',
      isAudioOnly: false
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;

    if (data.status === 'error') {
      return res.status(400).json({ error: data.text || 'Download failed' });
    }

    // Redirect to download URL
    if (data.url) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.redirect(data.url);
    }

    return res.status(404).json({ error: 'Download URL not found' });

  } catch (error) {
    console.error('Download Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Download failed', details: error.message });
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

    // Request audio download from Cobalt
    const response = await axios.post(COBALT_API, {
      url: videoUrl,
      isAudioOnly: true,
      aFormat: 'mp3',
      filenamePattern: 'basic'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;

    if (data.status === 'error') {
      return res.status(400).json({ 
        error: data.text || 'Audio download failed' 
      });
    }

    // Redirect to download URL
    if (data.url) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.redirect(data.url);
    }

    return res.status(404).json({ error: 'Audio download URL not found' });

  } catch (error) {
    console.error('Audio Download Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Audio download failed',
        details: error.message
      });
    }
  }
};
