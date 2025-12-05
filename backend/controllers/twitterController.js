import { spawn } from 'child_process';
import axios from 'axios';
import ffmpegStatic from 'ffmpeg-static';
import * as cheerio from 'cheerio';

// Path to yt-dlp executable
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

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
        
        // Define standard quality options for Twitter
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
          if (!existingFormat || (f.tbr || 0) > (existingFormat.tbr || 0)) {
            qualityMap.set(qualityLabel, {
              itag: f.format_id,
              qualityLabel,
              quality: f.height,
              hasAudio: f.acodec !== 'none',
              url: f.url,
              fps: f.fps,
              mimeType: `video/${f.ext}`,
              contentLength: f.filesize,
              width: f.width,
              height: f.height,
              tbr: f.tbr || 0
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
 * Download Twitter video using yt-dlp
 */
export const downloadTwitterVideo = (req, res) => {
  try {
    const { url, itag, format_id, title } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    
    console.log('Twitter download request:', { url, itag: selectedFormatId, title });
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const filename = safeFilename(title || 'twitter_media', '', 'mp4');
    
    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const args = [
      url,
      '--output', '-'
    ];

    if (selectedFormatId) {
      // Handle both specific format IDs and generic quality selectors
      if (selectedFormatId.includes('[') || selectedFormatId.includes('best') || selectedFormatId.includes('worst') || selectedFormatId.includes('/')) {
        // Generic format selector (like "best[height<=480]/worst[height>=480]/best")
        args.splice(1, 0, '--format', selectedFormatId);
      } else {
        // Specific format ID
        args.splice(1, 0, '--format', selectedFormatId);
      }
    }

    const ytdlpProcess = spawn(YT_DLP_PATH, args);

    ytdlpProcess.stdout.pipe(res);

    ytdlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlpProcess.on('error', (error) => {
      console.error('Process error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download process failed' });
      }
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp process exited with code:', code);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
      console.log('Twitter download completed');
    });

    req.on('close', () => {
      ytdlpProcess.kill();
    });

  } catch (error) {
    console.error('Twitter Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

/**
 * Download Twitter audio using yt-dlp and ffmpeg
 */
export const downloadTwitterAudio = (req, res) => {
  try {
    const { url, bitrate, title } = req.query;
    const quality = `${bitrate}k`;
    const filename = safeFilename(title, quality, 'mp3');
    
    console.log(`Downloading Twitter MP3 audio: ${url} at ${bitrate}kbps`);
    
    // Set proper headers for streaming MP3 download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Twitter videos have integrated audio, so we get the best video format and extract audio
    const ytdlpStream = spawn(YT_DLP_PATH, [
      url,
      '-f', 'best', // Get best overall format (video with audio)
      '-o', '-' // Output to stdout
    ]);

    // Then pipe through FFmpeg to convert to MP3 with specified bitrate
    const ffmpegStream = spawn(ffmpegStatic, [
      '-i', 'pipe:0', // Input from stdin (yt-dlp output)
      '-vn', // No video
      '-acodec', 'libmp3lame', // Use MP3 encoder
      '-b:a', `${bitrate}k`, // Set audio bitrate
      '-ar', '44100', // Set sample rate
      '-ac', '2', // Stereo audio
      '-f', 'mp3', // Output format
      '-write_xing', '0', // Disable Xing header for streaming
      'pipe:1' // Output to stdout
    ]);

    // Pipe yt-dlp output to FFmpeg input
    ytdlpStream.stdout.pipe(ffmpegStream.stdin);
    
    // Pipe FFmpeg output to response
    ffmpegStream.stdout.pipe(res);

    // Track if data has been sent
    let dataSent = false;
    ffmpegStream.stdout.on('data', () => {
      dataSent = true;
    });

    // Error handling for yt-dlp
    ytdlpStream.stderr.on('data', (data) => {
      const message = data.toString();
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
        console.log(`Twitter MP3 download completed: ${filename}`);
      } else {
        console.error(`FFmpeg exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).send('Audio conversion failed.');
        }
      }
    });

    // Kill processes if client disconnects
    req.on('close', () => {
      try { ytdlpStream.kill(); } catch {}
      try { ffmpegStream.kill(); } catch {}
    });

  } catch (error) {
    console.error('Twitter Audio Download Error:', error);
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
