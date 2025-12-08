import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to yt-dlp executable
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

// Path to Twitter cookies file - use absolute path
const COOKIES_PATH = path.join(__dirname, '../cookies-tw/cookies.txt');

// Utility function to create safe filenames
const safeFilename = (title, suffix = '', ext = 'mp4') => {
  const base = (title || 'video')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  const sfx = suffix ? `_${suffix}` : '';
  return `${base}${sfx}.${ext}`;
};

/**
 * Get Twitter video/media information using yt-dlp
 */
export const getTwitterMediaInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('Twitter info request for URL:', url);
    
    // Validate Twitter/X URL
    const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
    if (!twitterRegex.test(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Twitter/X URL provided. Please provide a valid tweet URL.'
      });
    }

    const ytdlpProcess = spawn(YT_DLP_PATH, [
      '--dump-single-json',
      '--no-warnings',
      '--cookies', COOKIES_PATH,
      '--no-check-certificates',
      url
    ]);

    let jsonData = '';
    let errorData = '';

    ytdlpProcess.stdout.on('data', (data) => {
      jsonData += data.toString();
    });

    ytdlpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp process exited with code:', code);
        console.error('Error output:', errorData);
        return res.status(404).json({ 
          success: false,
          error: 'Could not extract tweet URL. The tweet might be private, deleted, or have restricted access.',
          details: errorData
        });
      }

      try {
        const metadata = JSON.parse(jsonData);
        
        // Helper function to parse upload date
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
        
        // Extract thumbnail with multiple fallback options
        let thumbnail = metadata.thumbnail || null;
        if (!thumbnail && metadata.thumbnails && metadata.thumbnails.length > 0) {
          // Try different thumbnail sizes
          thumbnail = metadata.thumbnails.find(t => t.url && t.url.includes('media'))?.url ||
                     metadata.thumbnails[0]?.url || null;
        }

        // Format tweet details to match other platforms
        const videoDetails = {
          title: metadata.title || metadata.description || 'Twitter Video',
          author: metadata.uploader || metadata.creator || 'Twitter User',
          lengthSeconds: metadata.duration || 0,
          viewCount: Math.max(0, metadata.view_count || 0),
          publishDate: parseUploadDate(metadata.upload_date),
          description: (metadata.description || '').substring(0, 200),
          thumbnail: thumbnail
        };

        // Process formats to separate video and create standard qualities
        const allFormats = metadata.formats || [];
        
        // Get video formats with proper quality mapping
        const videoOnlyFormats = allFormats.filter(f => f.vcodec !== 'none' && f.height);
        console.log('Available video formats:', videoOnlyFormats.map(f => ({ id: f.format_id, height: f.height, hasAudio: f.acodec !== 'none' })));
        
        // Define standard quality options for Twitter (including higher qualities)
        const standardQualities = [
          { label: '144p', height: 144, selector: 'worst[height>=144]/best[height<=240]/best' },
          { label: '240p', height: 240, selector: 'best[height<=240]/worst[height>=240]/best' },
          { label: '360p', height: 360, selector: 'best[height<=360]/worst[height>=360]/best' },
          { label: '480p', height: 480, selector: 'best[height<=480]/worst[height>=480]/best' },
          { label: '720p', height: 720, selector: 'best[height<=720]/worst[height>=720]/best' },
          { label: '1080p', height: 1080, selector: 'best[height<=1080]/worst[height>=1080]/best' }
        ];

        // Create video formats
        const videoFormats = [];
        const qualityMap = new Map();
        
        // First, collect actual available video formats
        videoOnlyFormats.forEach(f => {
          let qualityLabel = `${f.height}p`;
          
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
          
          const existingFormat = qualityMap.get(qualityLabel);
          
          // Check if current format is H.264
          const isH264 = f.vcodec && (f.vcodec.includes('avc1') || f.vcodec.includes('h264'));
          const existingIsH264 = existingFormat && existingFormat.vcodec && (existingFormat.vcodec.includes('avc1') || existingFormat.vcodec.includes('h264'));

          // Logic to determine if this format is "better"
          let isBetter = false;

          if (!existingFormat) {
            isBetter = true;
          } else if (isH264 && !existingIsH264) {
            // Always replace non-H.264 with H.264
            isBetter = true;
          } else if (isH264 === existingIsH264) {
             // Prefer MP4 container and higher bitrate if codecs match
             if ((f.ext === 'mp4' && existingFormat.ext !== 'mp4') || (f.tbr || 0) > (existingFormat.tbr || 0)) {
                 isBetter = true;
             }
          }

          if (isBetter) {
            qualityMap.set(qualityLabel, {
              itag: f.format_id,
              qualityLabel,
              quality: f.height,
              hasAudio: f.acodec !== 'none',
              url: f.url,
              fps: f.fps,
              mimeType: `video/mp4`, // Force mp4 mimetype for client
              contentLength: f.filesize,
              width: f.width,
              height: f.height,
              tbr: f.tbr || 0,
              ext: f.ext,
              vcodec: f.vcodec
            });
          }
        });

        // Create formats for all standard qualities using intelligent selectors
        standardQualities.forEach(qualitySpec => {
          const exactFormat = qualityMap.get(qualitySpec.label);
          
          if (exactFormat) {
            videoFormats.push(exactFormat);
          } else {
            // Create a fallback format using yt-dlp's intelligent selection
            videoFormats.push({
              itag: qualitySpec.selector,
              qualityLabel: qualitySpec.label,
              quality: qualitySpec.height,
              hasAudio: true,
              url: '', // Will be resolved by yt-dlp
              fps: 30,
              mimeType: 'video/mp4',
              contentLength: null,
              width: null,
              height: qualitySpec.height,
              tbr: null
            });
          }
        });
        
        // Add a "Best Quality" option
        videoFormats.push({
          itag: 'best',
          qualityLabel: 'Best Quality',
          quality: 'best',
          hasAudio: true,
          url: '',
          fps: null,
          mimeType: 'video/mp4',
          contentLength: null,
          width: null,
          height: null,
          tbr: 0
        });
        
        console.log('Processed video formats:', videoFormats.map(f => ({ quality: f.qualityLabel, itag: f.itag, hasAudio: f.hasAudio })));

        // Audio formats - Twitter videos usually have integrated audio, so offer transcoding options
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

        console.log('Twitter media info retrieved successfully');
        res.status(200).json(formattedResponse);
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        res.status(500).json({ 
          success: false,
          error: 'Failed to parse media information',
          details: parseError.message
        });
      }
    });

  } catch (error) {
    console.error('Twitter Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Download Twitter video using yt-dlp with temp file strategy
 */
export const downloadTwitterVideo = async (req, res) => {
  let tempFilePath = null;
  try {
    const { url, itag, format_id, title } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    
    console.log('Twitter download request:', { url, itag: selectedFormatId, title });
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cleanTitle = safeFilename(title || 'twitter_media', '', 'mp4');
    const tempFileName = `twitter_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);

    console.log(`Downloading Twitter video to temp file: ${tempFilePath}`);

    const args = [
      url,
      '--cookies', COOKIES_PATH,
      '--no-check-certificates',
      '--no-warnings',
      '--output', tempFilePath
    ];

    // Ensure we get formats with audio by using explicit format selection
    if (selectedFormatId) {
      // Handle both specific format IDs and generic quality selectors
      if (selectedFormatId.includes('[') || selectedFormatId.includes('best') || selectedFormatId.includes('worst') || selectedFormatId.includes('/')) {
        // Use the selector as-is but ensure audio is included
        args.splice(1, 0, '--format', `${selectedFormatId}+bestaudio/best`);
      } else {
        // Specific format ID - try to merge with audio, fallback to format with audio
        args.splice(1, 0, '--format', `${selectedFormatId}+bestaudio/${selectedFormatId}/best`);
      }
    } else {
      // Default: prefer merged video+audio, fallback to best with audio
      args.splice(1, 0, '--format', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    }
    
    // Add ffmpeg location for merging if needed
    args.splice(1, 0, '--ffmpeg-location', ffmpegStatic);
    args.splice(1, 0, '--merge-output-format', 'mp4');

    const ytdlpProcess = spawn(YT_DLP_PATH, args);

    let stderrData = '';

    ytdlpProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      if (data.toString().toLowerCase().includes('error')) {
         console.error('yt-dlp stderr:', data.toString());
      }
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp process exited with code:', code);
        console.error('Full stderr:', stderrData);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
        if (!res.headersSent) {
          return res.status(500).json({ error: 'Download process failed.' });
        }
        return;
      }

      console.log('Twitter download completed locally.');

      if (fs.existsSync(tempFilePath)) {
         res.download(tempFilePath, cleanTitle, (err) => {
           if (err) {
             console.error('Error sending file:', err);
             if (!res.headersSent) res.status(500).send('Error downloading file');
           }
           
           // Cleanup temp file
           try {
             fs.unlinkSync(tempFilePath);
           } catch (unlinkErr) {
             console.error('Failed to delete temp file:', unlinkErr);
           }
         });
      } else {
        console.error('Temp file not found after success code:', tempFilePath);
        if (!res.headersSent) res.status(500).json({ error: 'Downloaded file not found.' });
      }
    });

    ytdlpProcess.on('error', (err) => {
        console.error('Failed to start yt-dlp:', err);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
        if (!res.headersSent) res.status(500).json({ error: 'Failed to start download process.' });
    });

  } catch (error) {
    console.error('Twitter Download Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

/**
 * Download Twitter audio using yt-dlp and ffmpeg with temp file strategy
 */
export const downloadTwitterAudio = (req, res) => {
  let tempFilePath = null;
  try {
    const { url, bitrate, title } = req.query;
    const quality = `${bitrate}k`;
    const cleanTitle = safeFilename(title, quality, 'mp3');
    
    // Create temp file path
    const tempFileName = `twitter_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);

    console.log(`Downloading Twitter MP3 audio to temp file: ${tempFilePath} at ${bitrate}kbps`);

    // We can use yt-dlp's built-in audio extraction to save to a file
    const ytdlpProcess = spawn(YT_DLP_PATH, [
      url,
      '--cookies', COOKIES_PATH,
      '--no-check-certificates',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${bitrate}k`,
      '--ffmpeg-location', ffmpegStatic,
      '--output', tempFilePath
    ]);

    let stderrData = '';
    ytdlpProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp audio extract exited with code:', code);
        console.error('Middleware stderr:', stderrData);
        if (tempFilePath && fs.existsSync(tempFilePath)) {
           try { fs.unlinkSync(tempFilePath); } catch (e) {}
        }
        if (!res.headersSent) {
          return res.status(500).send('Audio download failed.');
        }
        return;
      }

      console.log('Twitter audio extraction completed locally.');

      if (fs.existsSync(tempFilePath)) {
         res.download(tempFilePath, cleanTitle, (err) => {
           if (err) {
             console.error('Error sending audio:', err);
             if (!res.headersSent) res.status(500).send('Error downloading audio');
           }
           
           try {
             fs.unlinkSync(tempFilePath);
           } catch (unlinkErr) {
             console.error('Failed to delete temp audio file:', unlinkErr);
           }
         });
      } else {
        console.error('Temp audio file not found:', tempFilePath);
        if (!res.headersSent) res.status(500).send('Audio file not found.');
      }
    });

  } catch (error) {
    console.error('Twitter Audio Download Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

// Keep backwards compatibility for existing frontend
export const downloadTwitterMedia = downloadTwitterVideo;
