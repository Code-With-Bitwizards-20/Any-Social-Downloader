import axios from 'axios';

// RapidAPI Configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '1d84225686msh604fb4f67a9befcp1ce16ejsn879505b6dba0';
const RAPIDAPI_HOST = 'youtube-media-downloader.p.rapidapi.com';

// Utility: Extract video ID from YouTube URL
const getVideoId = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Handle different YouTube URL formats
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

// Utility: Format duration from seconds
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
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

    // Call RapidAPI
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/v2/video/details`,
      {
        params: {
          videoId: videoId,
          urlAccess: 'normal',
          videos: 'auto',
          audios: 'auto'
        },
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        timeout: 30000
      }
    );

    const data = response.data;

    if (!data || !data.title) {
      return res.status(404).json({
        success: false,
        error: 'Video not found or unavailable'
      });
    }

    // Build video details
    const videoInfo = {
      title: data.title || 'Unknown Title',
      author: data.channel?.name || data.author || 'Unknown',
      lengthSeconds: data.lengthSeconds || 0,
      viewCount: data.viewCount || 0,
      publishDate: data.publishDate || null,
      description: data.description || '',
      thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || ''
    };

    // Process video formats
    const videoFormats = [];
    if (data.videos && Array.isArray(data.videos)) {
      data.videos.forEach(video => {
        const quality = video.quality || video.qualityLabel || 'unknown';
        
        videoFormats.push({
          itag: video.itag || video.url,
          qualityLabel: quality,
          quality: parseInt(quality) || 0,
          hasAudio: video.hasAudio !== false,
          url: video.url,
          mimeType: video.mimeType || 'video/mp4',
          contentLength: video.contentLength || null,
          width: video.width || null,
          height: video.height || null
        });
      });
    }

    // Sort by quality descending
    videoFormats.sort((a, b) => (b.quality || 0) - (a.quality || 0));

    // Process audio formats
    const audioFormats = [];
    if (data.audios && Array.isArray(data.audios)) {
      data.audios.forEach(audio => {
        const bitrate = parseInt(audio.bitrate) || parseInt(audio.audioBitrate) || 128;
        
        audioFormats.push({
          bitrate: bitrate,
          url: audio.url,
          mimeType: audio.mimeType || 'audio/mp4',
          contentLength: audio.contentLength || null
        });
      });
    }

    // If no audios from API, provide standard bitrates
    if (audioFormats.length === 0) {
      [96, 128, 160, 192, 256, 320].forEach(bitrate => {
        audioFormats.push({ bitrate, isTranscoded: true });
      });
    }

    res.status(200).json({
      success: true,
      videoInfo,
      formats: {
        video: videoFormats,
        audio: audioFormats
      }
    });

  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        success: false, 
        error: 'Video not found' 
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({ 
        success: false, 
        error: 'API key invalid or quota exceeded' 
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
    const { url: videoUrl, itag, title } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video details first to find the download URL
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/v2/video/details`,
      {
        params: {
          videoId: videoId,
          urlAccess: 'normal',
          videos: 'auto',
          audios: 'auto'
        },
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = response.data;
    const videoTitle = title || data.title || 'video';

    // Find requested format or best quality
    let downloadUrl;
    if (itag && data.videos) {
      const format = data.videos.find(v => v.itag === itag || v.url === itag);
      downloadUrl = format?.url;
    }

    if (!downloadUrl && data.videos && data.videos.length > 0) {
      // Get highest quality
      const sorted = data.videos.sort((a, b) => 
        (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0)
      );
      downloadUrl = sorted[0].url;
    }

    if (!downloadUrl) {
      return res.status(404).json({ error: 'Download URL not found' });
    }

    const filename = safeFilename(videoTitle, '', 'mp4');

    // Redirect to the download URL
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.redirect(downloadUrl);

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

// Download Video (GET method)
export const downloadVideoGet = async (req, res) => {
  req.body = { ...req.query };
  return downloadVideo(req, res);
};

// Merge Download (for compatibility - redirects to regular download)
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

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`Downloading audio for video ID: ${videoId} at ${bitrate}kbps`);

    // Get video details
    const response = await axios.get(
      `https://${RAPIDAPI_HOST}/v2/video/details`,
      {
        params: {
          videoId: videoId,
          urlAccess: 'normal',
          videos: 'auto',
          audios: 'auto'
        },
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        }
      }
    );

    const data = response.data;
    const videoTitle = title || data.title || 'audio';
    const targetBitrate = parseInt(bitrate) || 128;

    let downloadUrl;

    // Find audio format closest to requested bitrate
    if (data.audios && data.audios.length > 0) {
      const sorted = data.audios.sort((a, b) => {
        const aBitrate = parseInt(a.bitrate) || parseInt(a.audioBitrate) || 128;
        const bBitrate = parseInt(b.bitrate) || parseInt(b.audioBitrate) || 128;
        return Math.abs(aBitrate - targetBitrate) - Math.abs(bBitrate - targetBitrate);
      });
      downloadUrl = sorted[0].url;
    }

    if (!downloadUrl) {
      return res.status(404).json({ error: 'Audio download URL not found' });
    }

    const filename = safeFilename(videoTitle, `${targetBitrate}k`, 'mp3');

    // Redirect to the download URL
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.redirect(downloadUrl);

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
