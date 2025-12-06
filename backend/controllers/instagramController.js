import { spawn } from 'child_process';
import path from 'path';
import ffmpegStatic from 'ffmpeg-static';
import axios from 'axios';

// Path to yt-dlp executable
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

// Path to Instagram cookies file
const COOKIES_PATH = './cookies-ig/cookies.txt';

// Utility function to create safe filenames
const safeFilename = (title, suffix = '', ext = 'mp4') => {
  const base = (title || 'video')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 80);
  const sfx = suffix ? `_${suffix}` : '';
  return `${base}${sfx}.${ext}`;
};

export const getInstagramMediaInfo = async (req, res) => {
  try {
    const { url } = req.body;
    
    console.log('Instagram info request for URL:', url);
    
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

    // Try with cookies first (best for private/restricted)
    let metadata;
    try {
      console.log('Trying with cookies...');
      const jsonOutput = await fetchInfo(true);
      metadata = JSON.parse(jsonOutput);
    } catch (cookieError) {
      console.warn('Failed with cookies, retrying without...', cookieError.message.split('\n')[0]);
      // Retry without cookies (best for public/shared links)
      try {
        const jsonOutput = await fetchInfo(false);
        metadata = JSON.parse(jsonOutput);
      } catch (noCookieError) {
        console.error('Failed without cookies too:', noCookieError.message);
        
        // Provide user-friendly error
        let userMessage = 'Could not extract media URL.';
        const errorMsg = (cookieError.message + noCookieError.message).toLowerCase();
        
        if (errorMsg.includes('login') || errorMsg.includes('private')) {
          userMessage = 'This post appears to be private or requires login.';
        } else if (errorMsg.includes('not found')) {
          userMessage = 'Post not found. It may have been deleted.';
        }

        return res.status(404).json({
          success: false,
          error: userMessage,
          details: noCookieError.message
        });
      }
    }



        
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
          title: metadata.title || 'Instagram Media',
          author: metadata.uploader || 'Unknown',
          lengthSeconds: metadata.duration || 0,
          viewCount: Math.max(0, metadata.like_count || metadata.view_count || 0), // Instagram uses like_count, ensure non-negative
          publishDate: parseUploadDate(metadata.upload_date),
          description: metadata.description || '',
          thumbnail: extractBestThumbnail(metadata)
        };
        
        // Helper function to extract the best thumbnail
        function extractBestThumbnail(metadata) {
          let thumbnailUrl = null;
          
          // Try direct thumbnail field first
          if (metadata.thumbnail) {
            thumbnailUrl = metadata.thumbnail;
          }
          // Try thumbnails array with highest resolution
          else if (metadata.thumbnails && metadata.thumbnails.length > 0) {
            // Sort thumbnails by resolution (width * height) descending
            const sortedThumbnails = metadata.thumbnails
              .filter(t => t.url)
              .sort((a, b) => {
                const aRes = (a.width || 0) * (a.height || 0);
                const bRes = (b.width || 0) * (b.height || 0);
                return bRes - aRes;
              });
            
            if (sortedThumbnails.length > 0) {
              thumbnailUrl = sortedThumbnails[0].url;
            }
          }
          
          // Return the direct Instagram URL - let frontend handle CORS via proxy
          return thumbnailUrl;
        }

        // Process formats to separate video and audio
        const allFormats = metadata.formats || [];
        
        // Get available video and audio formats
        const videoOnlyFormats = allFormats.filter(f => f.vcodec !== 'none' && f.height);
        const audioFormats = allFormats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
        const bestAudio = audioFormats.length > 0 ? audioFormats[0] : null;
        
        console.log('Available video formats:', videoOnlyFormats.map(f => ({ id: f.format_id, height: f.height, hasAudio: f.acodec !== 'none' })));
        console.log('Best audio format:', bestAudio ? bestAudio.format_id : 'None');
        console.log('Thumbnail extracted:', videoDetails.thumbnail ? 'Success' : 'Failed');
        console.log('Like count:', metadata.like_count, 'View count:', metadata.view_count, 'Final viewCount:', videoDetails.viewCount);
        if (metadata.thumbnails && metadata.thumbnails.length > 0) {
          console.log('Available thumbnails:', metadata.thumbnails.map(t => ({ url: t.url ? 'Present' : 'Missing', width: t.width, height: t.height })));
        }
        
        // Process video formats and map to standard qualities
        const videoFormats = [];
        const qualityMap = new Map();
        
        // First, collect all available video formats
        videoOnlyFormats.forEach(f => {
          let qualityLabel = `${f.height}p`;
          
          // Map Instagram resolutions to standard qualities
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
        
        // Convert map to array and sort by quality (ascending)
        const standardQualities = ['144p', '240p', '360p', '480p', '720p', '1080p'];
        const availableQualities = Array.from(qualityMap.keys());
        
        standardQualities.forEach((quality, qualityIndex) => {
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
                // Use a more generic format selector for fallback with unique ID
                itag: bestAudio ? `best[height<=${targetHeight}]+bestaudio/best-${qualityIndex}` : `best[height<=${targetHeight}]/best-${qualityIndex}`
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

        console.log('Instagram media info retrieved successfully');

        console.log('Instagram media info retrieved successfully');
        res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Instagram Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Add alias for consistency with other controllers
export const getInstagramInfo = getInstagramMediaInfo;

export const downloadInstagramVideo = (req, res) => {
  try {
    const { url, itag, format_id, title } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    
    console.log('Instagram download request:', { url, itag: selectedFormatId, title });
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const filename = safeFilename(title || 'instagram_media', '', 'mp4');
    
    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    const args = [
      url,
      '--cookies', COOKIES_PATH,
      '--buffer-size', '32M',
      '--http-chunk-size', '20M',
      '--concurrent-fragments', '10',
      '--no-check-certificates',
      '--output', '-'
    ];

    if (selectedFormatId) {
      // Handle both specific format IDs and generic quality selectors
      if (selectedFormatId.includes('[') || selectedFormatId.includes('best') || selectedFormatId.includes('worst')) {
        // Generic format selector (like "best[height<=480]/best")
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
      console.log('Instagram download completed');
    });

    req.on('close', () => {
      ytdlpProcess.kill();
    });

  } catch (error) {
    console.error('Instagram Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const mergeInstagramVideoAudio = (req, res) => {
  try {
    const { url, vItag, aItag, title } = req.query;
    const filename = safeFilename(title || 'instagram_video', '', 'mp4');
    
    console.log(`Merging Instagram video+audio: vItag=${vItag}, aItag=${aItag}`);
    
    // Set response headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Use yt-dlp to get merged streams in Matroska format (better for AV1)
    // Use yt-dlp to get merged streams in Matroska format (better for AV1)
    const ytdlpArgs = [
      url,
      '--format', `${vItag}+${aItag}`,
      // '--cookies', COOKIES_PATH, // Removed to fix 0KB issues
      '--no-check-certificates',
      '--no-playlist',
      '--no-warnings',
      '--ffmpeg-location', ffmpegStatic,
      '--merge-output-format', 'mkv', // Use Matroska format
      '--output', '-'
    ];

    const ytdlpProcess = spawn(YT_DLP_PATH, ytdlpArgs);

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
        console.log('Instagram MP4 conversion completed successfully');
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
    console.error('Instagram Merge Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

export const downloadInstagramAudio = (req, res) => {
  try {
    const { url, bitrate, title } = req.query;
    const quality = `${bitrate}k`;
    const filename = safeFilename(title, quality, 'mp3');
    
    console.log(`Downloading Instagram MP3 audio: ${url} at ${bitrate}kbps`);
    
    // Set proper headers for streaming MP3 download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // First, use yt-dlp to get the best audio stream (without conversion)
    const ytdlpStream = spawn(YT_DLP_PATH, [
      url,
      '-f', 'bestaudio', // Get best audio quality
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
        console.log(`Instagram MP3 download completed: ${filename}`);
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
    console.error('Instagram Audio Download Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

// Thumbnail proxy endpoint to bypass CORS
export const getInstagramThumbnail = async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    console.log('Proxying thumbnail:', url);
    
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site'
      },
      timeout: 10000
    });
    
    // Set appropriate headers before sending
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Send the image data
    res.send(Buffer.from(response.data));
    console.log('Thumbnail proxy successful');
    
  } catch (error) {
    console.error('Thumbnail proxy error:', error.message);
    
    // Send a default placeholder image or error response
    res.status(404).json({ error: 'Thumbnail not available' });
  }
};

// Legacy function name for compatibility
export const downloadInstagramMedia = downloadInstagramVideo;
