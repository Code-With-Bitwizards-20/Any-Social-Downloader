import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';
const COOKIES_PATH = path.join(__dirname, '../cookies-yt/cookies.txt');

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

export const getYoutubeVideoInfo = async (req, res) => {
  const { url } = req.body;
  console.log('YouTube info request for URL:', url);

  try {
    const fetchInfo = () => {
      return new Promise((resolve, reject) => {
        const args = [
          '--dump-single-json',
          '--no-warnings',
          '--no-check-certificates',
          '--no-playlist',
          '--cookies', COOKIES_PATH,
          url
        ];

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

    const jsonOutput = await fetchInfo();
    const metadata = JSON.parse(jsonOutput);

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
      title: metadata.title || 'YouTube Video',
      author: metadata.uploader || 'Unknown',
      lengthSeconds: metadata.duration || 0,
      viewCount: metadata.view_count || 0,
      publishDate: parseUploadDate(metadata.upload_date),
      description: metadata.description || '',
      thumbnail: metadata.thumbnail || null
    };

    const allFormats = metadata.formats || [];
    const videoOnlyFormats = allFormats.filter(f => f.vcodec !== 'none' && f.height);
    const audioFormats = allFormats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
    const bestAudio = audioFormats.length > 0 ? audioFormats[0] : null;

    console.log('Available video formats:', videoOnlyFormats.map(f => ({ id: f.format_id, height: f.height })));

    const videoFormats = [];
    const qualityMap = new Map();

    videoOnlyFormats.forEach(f => {
      let qualityLabel = `${f.height}p`;
      if (f.height >= 2160) qualityLabel = '4k';
      else if (f.height >= 1440) qualityLabel = '1440p';
      else if (f.height >= 1080) qualityLabel = '1080p';
      else if (f.height >= 720) qualityLabel = '720p';
      else if (f.height >= 480) qualityLabel = '480p';
      else if (f.height >= 360) qualityLabel = '360p';
      else if (f.height >= 240) qualityLabel = '240p';
      else qualityLabel = '144p';

      const existingFormat = qualityMap.get(qualityLabel);
      const isH264 = f.vcodec && (f.vcodec.includes('avc1') || f.vcodec.includes('h264'));
      const existingIsH264 = existingFormat && existingFormat.vcodec && (existingFormat.vcodec.includes('avc1') || existingFormat.vcodec.includes('h264'));

      let isBetter = false;
      if (!existingFormat) {
        isBetter = true;
      } else if (isH264 && !existingIsH264) {
        isBetter = true;
      } else if (isH264 === existingIsH264) {
         if (f.tbr > existingFormat.tbr) {
             isBetter = true;
         }
      }

      if (isBetter) {
        qualityMap.set(qualityLabel, {
          itag: f.format_id,
          qualityLabel,
          quality: f.height,
          hasAudio: f.acodec !== 'none',
          merge: f.acodec === 'none' && bestAudio ? true : false,
          vItag: f.acodec === 'none' && bestAudio ? f.format_id : undefined,
          aItag: f.acodec === 'none' && bestAudio ? bestAudio.format_id : undefined,
          fps: f.fps,
          mimeType: `video/mp4`,
          contentLength: f.filesize,
          width: f.width,
          height: f.height,
          tbr: f.tbr || 0,
          vcodec: f.vcodec
        });
      }
    });

    const standardQualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '4k'];
    standardQualities.forEach(quality => {
      let format = qualityMap.get(quality);
      
      // If quality not available in H.264, create fallback with yt-dlp selector
      if (!format) {
        const targetHeight = quality === '4k' ? 2160 : parseInt(quality);
        const bestAudioItag = bestAudio ? bestAudio.format_id : null;
        
        format = {
          itag: bestAudioItag ? `bestvideo[height<=${targetHeight}]+bestaudio/best` : `best[height<=${targetHeight}]/best`,
          qualityLabel: quality,
          quality: targetHeight,
          hasAudio: true,
          merge: bestAudioItag ? true : false,
          fps: null,
          mimeType: 'video/mp4',
          contentLength: null,
          width: null,
          height: targetHeight
        };
      } else if (format.merge && format.vItag && format.aItag) {
        format.itag = `${format.vItag}+${format.aItag}`;
        format.hasAudio = true;
      }
      
      videoFormats.push(format);
    });

    videoFormats.sort((a, b) => {
       const valA = a.qualityLabel === '4k' ? 2160 : parseInt(a.qualityLabel) || 0;
       const valB = b.qualityLabel === '4k' ? 2160 : parseInt(b.qualityLabel) || 0;
       return valA - valB;
    });

    const transcodeAudioFormats = [96, 128, 160, 192, 256, 320].map(bitrate => ({
      bitrate,
      isTranscoded: true
    }));

    res.status(200).json({
      success: true,
      videoInfo: videoDetails,
      formats: {
        video: videoFormats,
        audio: transcodeAudioFormats
      }
    });

  } catch (error) {
    console.error('YouTube Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch YouTube info',
      details: error.message
    });
  }
};

export const downloadVideo = async (req, res) => {
  try {
    const { url, itag, format_id, title } = req.method === 'POST' ? req.body : req.query;
    const selectedFormat = itag || format_id;
    const cleanTitle = safeFilename(title || 'youtube_video', '', 'mp4');

    console.log(`Streaming YouTube video: ${cleanTitle}`);

    const args = [
      url,
      '--cookies', COOKIES_PATH,
      '-S', 'vcodec:h264,res,acodec:m4a',
      '--no-check-certificates',
      '--no-playlist',
      '-o', '-'  // Output to stdout for streaming
    ];

    if (selectedFormat && selectedFormat !== 'best') {
       args.splice(1, 0, '-f', selectedFormat);
    }

    // Set headers for immediate download
    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const ytdlpProcess = spawn(YT_DLP_PATH, args);

    // Stream directly to response - downloads start immediately
    ytdlpProcess.stdout.pipe(res);

    ytdlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Download failed with code:', code);
        if (!res.headersSent) res.status(500).json({ error: 'Download failed.' });
      } else {
        console.log('YouTube download streaming completed');
      }
    });

    ytdlpProcess.on('error', (err) => {
      console.error('Failed to start yt-dlp:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to start download.' });
    });

  } catch (error) {
    console.error('YouTube Download Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Also export as getVideoInfo (YouTube convention)
export const getVideoInfo = getYoutubeVideoInfo;
export const downloadVideoGet = downloadVideo;
export const mergeDownloadGet = downloadVideo;

export const downloadAudioGet = async (req, res) => {
  try {
    const { url, bitrate, title } = req.query;
    const targetBitrate = parseInt(bitrate) || 128;
    const cleanTitle = safeFilename(title || 'youtube_audio', `${targetBitrate}kbps`, 'mp3');

    console.log(`Streaming YouTube audio: ${cleanTitle}`);

    res.setHeader('Content-Disposition', `attachment; filename="${cleanTitle}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const ytdlpProcess = spawn(YT_DLP_PATH, [
      url,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${targetBitrate}k`,
      '--ffmpeg-location', ffmpegStatic,
      '--cookies', COOKIES_PATH,
      '--no-check-certificates',
      '--no-playlist',
      '-o', '-'
    ]);

    ytdlpProcess.stdout.pipe(res);

    ytdlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Audio download failed with code:', code);
        if (!res.headersSent) res.status(500).json({ error: 'Audio download failed.' });
      } else {
        console.log('YouTube audio streaming completed');
      }
    });

    ytdlpProcess.on('error', (err) => {
      console.error('Failed to start yt-dlp:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to start audio download.' });
    });

  } catch (error) {
    console.error('YouTube Audio Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};
