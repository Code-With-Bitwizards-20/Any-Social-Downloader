import { spawn } from 'child_process';
import axios from 'axios';
import ffmpegStatic from 'ffmpeg-static';

// Path to yt-dlp executable
const YT_DLP_PATH = 'C:/Users/ACCER/AppData/Roaming/Python/Python313/Scripts/yt-dlp.exe';

// Utility function to create safe filenames
const safeFilename = (title, suffix = '', ext = 'mp4') => {
  const base = (title || 'video')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  const sfx = suffix ? `_${suffix}` : '';
  return `${base}${sfx}.${ext}`;
};

export const getTikTokVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('TikTok info request for URL:', url);
    
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
          error: 'Could not extract video URL. The video might be private or have restricted access.',
          details: errorData
        });
      }

      try {
        const metadata = JSON.parse(jsonData);
        
        // Helper function to parse upload date format (YYYYMMDD)
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
        
        // Format video details to match other platforms
        const videoDetails = {
          title: metadata.title || 'TikTok Video',
          author: metadata.uploader || metadata.creator || 'Unknown',
          lengthSeconds: metadata.duration || 0,
          viewCount: Math.max(0, metadata.view_count || 0),
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
        console.log('Thumbnail extracted:', videoDetails.thumbnail ? 'Success' : 'Failed');
        console.log('View count:', metadata.view_count, 'Final viewCount:', videoDetails.viewCount);
        
        // Process video formats and map to standard qualities
        const videoFormats = [];
        const qualityMap = new Map();
        
        // First, collect all available video formats
        videoOnlyFormats.forEach(f => {
          let qualityLabel = `${f.height}p`;
          
          // Map TikTok resolutions to standard qualities
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
        
        // Define standard quality options from 144p to 1080p
        const standardQualities = [
          { label: '144p', height: 144, selector: 'best[height<=144]/worst[height>=144]/best' },
          { label: '240p', height: 240, selector: 'best[height<=240]/worst[height>=240]/best' },
          { label: '360p', height: 360, selector: 'best[height<=360]/worst[height>=360]/best' },
          { label: '480p', height: 480, selector: 'best[height<=480]/worst[height>=480]/best' },
          { label: '720p', height: 720, selector: 'best[height<=720]/worst[height>=720]/best' },
          { label: '1080p', height: 1080, selector: 'best[height<=1080]/worst[height>=1080]/best' }
        ];

        // Create video formats for all standard qualities
        standardQualities.forEach(qualitySpec => {
          // Check if we have an exact or close match from actual formats
          const exactFormat = qualityMap.get(qualitySpec.label);
          
          if (exactFormat) {
            // Use the actual format if available
            if (exactFormat.merge && exactFormat.vItag && exactFormat.aItag) {
              exactFormat.itag = `${exactFormat.vItag}+${exactFormat.aItag}`;
              exactFormat.hasAudio = true;
            }
            videoFormats.push(exactFormat);
          } else {
            // Create a fallback format using yt-dlp's intelligent selection
            videoFormats.push({
              itag: qualitySpec.selector,
              qualityLabel: qualitySpec.label,
              quality: qualitySpec.height,
              hasAudio: true,
              merge: false,
              fps: 30, // Typical TikTok fps
              mimeType: 'video/mp4',
              contentLength: null,
              width: null,
              height: qualitySpec.height,
              tbr: null
            });
          }
        });
        
        // Add a "Best Quality" option that will work for any TikTok video
        videoFormats.push({
          itag: 'best',
          qualityLabel: 'Best Quality',
          quality: 'best',
          hasAudio: true,
          merge: false,
          fps: null,
          mimeType: 'video/mp4',
          contentLength: null,
          width: null,
          height: null,
          tbr: 0
        });
        
        console.log('Processed video formats:', videoFormats.map(f => ({ quality: f.qualityLabel, itag: f.itag, hasAudio: f.hasAudio, merge: f.merge })));

        // Audio formats - create standard MP3 bitrates like other platforms
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

        console.log('TikTok media info retrieved successfully');
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
    console.error('TikTok Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

export const downloadTikTokVideo = (req, res) => {
  try {
    const { url, itag, format_id, title } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    
    console.log('TikTok download request:', { url, itag: selectedFormatId, title });
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const filename = safeFilename(title || 'tiktok_media', '', 'mp4');
    
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
      console.log('TikTok download completed');
    });

    req.on('close', () => {
      ytdlpProcess.kill();
    });

  } catch (error) {
    console.error('TikTok Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const mergeTikTokVideoAudio = (req, res) => {
  try {
    const { url, vItag, aItag, title } = req.query;
    const filename = safeFilename(title || 'tiktok_video', '', 'mp4');
    
    console.log(`Merging TikTok video+audio: vItag=${vItag}, aItag=${aItag}`);
    
    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Use yt-dlp to get merged streams in Matroska format (better for AV1)
    const ytdlpProcess = spawn(YT_DLP_PATH, [
      url,
      '--format', `${vItag}+${aItag}`,
      '--ffmpeg-location', ffmpegStatic,
      '--merge-output-format', 'mkv', // Use Matroska format which handles AV1 better
      '--output', '-'
    ]);

    // Use FFmpeg to convert Matroska to streamable MP4 with both video and audio
    const ffmpegProcess = spawn(ffmpegStatic, [
      '-i', 'pipe:0', // Input from yt-dlp (MKV format)
      '-c:v', 'copy', // Copy video stream without re-encoding 
      '-c:a', 'copy', // Copy audio stream without re-encoding
      '-f', 'mp4', // Force MP4 output format
      '-movflags', 'frag_keyframe+empty_moov', // Make it streamable
      '-avoid_negative_ts', 'make_zero', // Fix timestamp issues
      'pipe:1' // Output to stdout
    ]);

    // Pipe yt-dlp MKV output through FFmpeg to get proper MP4
    ytdlpProcess.stdout.pipe(ffmpegProcess.stdin);
    
    // Pipe final MP4 output to response
    ffmpegProcess.stdout.pipe(res);

    // Error handling for yt-dlp
    ytdlpProcess.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlpProcess.on('error', (error) => {
      console.error('yt-dlp process error:', error);
      ffmpegProcess.kill();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Video extraction failed' });
      }
    });

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp process exited with code:', code);
        ffmpegProcess.kill();
        if (!res.headersSent) {
          res.status(500).json({ error: 'Video extraction failed' });
        }
      }
    });

    // Error handling for FFmpeg
    ffmpegProcess.stderr.on('data', (data) => {
      console.error('FFmpeg stderr:', data.toString());
    });

    ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg process error:', error);
      ytdlpProcess.kill();
      if (!res.headersSent) {
        res.status(500).json({ error: 'Video conversion failed' });
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        console.log('TikTok MP4 conversion completed successfully');
      } else {
        console.error('FFmpeg process exited with code:', code);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Video conversion failed' });
        }
      }
    });

    req.on('close', () => {
      ytdlpProcess.kill();
      ffmpegProcess.kill();
    });

  } catch (error) {
    console.error('TikTok Merge Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const downloadTikTokAudio = (req, res) => {
  try {
    const { url, bitrate, title } = req.query;
    const quality = `${bitrate}k`;
    const filename = safeFilename(title, quality, 'mp3');
    
    console.log(`Downloading TikTok MP3 audio: ${url} at ${bitrate}kbps`);
    
    // Set proper headers for streaming MP3 download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // TikTok videos have integrated audio, so we get the best video format and extract audio
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
        console.log(`TikTok MP3 download completed: ${filename}`);
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
    console.error('TikTok Audio Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};
