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

// Path to Facebook cookies file
const COOKIES_PATH = path.join(__dirname, '../cookies-fb/cookies.txt');

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

export const getFacebookVideoInfo = async (req, res) => {
  const { url } = req.body;
  console.log('Facebook info request for URL:', url);

  try {
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

    // Try with cookies first
    let metadata;
    try {
      console.log('Trying with cookies...');
      const jsonOutput = await fetchInfo(true);
      metadata = JSON.parse(jsonOutput);
    } catch (cookieError) {
      console.warn('Failed with cookies, retrying without...', cookieError.message.split('\n')[0]);
      // Retry without cookies
      try {
        const jsonOutput = await fetchInfo(false);
        metadata = JSON.parse(jsonOutput);
      } catch (noCookieError) {
        // Both failed
        console.error('Failed without cookies too:', noCookieError.message);
        let userMessage = 'Failed to fetch video information';
        const errorMsg = (cookieError.message + noCookieError.message).toLowerCase();
        
        if (errorMsg.includes('login') || errorMsg.includes('sign in') || errorMsg.includes('private')) {
          userMessage = 'This video is private or requires login. Only public Facebook videos can be downloaded.';
        } else if (errorMsg.includes('not available') || errorMsg.includes('removed')) {
          userMessage = 'This video is not available or has been removed.';
        }

        return res.status(400).json({ 
          success: false,
          error: userMessage,
          details: noCookieError.message
        });
      }
    }

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
      title: metadata.title || 'Facebook Video',
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
    
    console.log('Available video formats:', videoOnlyFormats.map(f => ({ id: f.format_id, height: f.height, hasAudio: f.acodec !== 'none' })));

    const videoFormats = [];
    const qualityMap = new Map();
    
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
    
    const standardQualities = ['144p', '240p', '360p', '480p', '720p', '1080p'];
    const availableQualities = Array.from(qualityMap.keys());
    
    standardQualities.forEach(quality => {
      let format = qualityMap.get(quality);
      
      if (!format && availableQualities.length > 0) {
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
            itag: bestAudio ? `best[height<=${targetHeight}]+bestaudio/best` : `best[height<=${targetHeight}]/best`
          };
        }
      }
      
      if (format) {
        if (format.merge && format.vItag && format.aItag) {
          format.itag = `${format.vItag}+${format.aItag}`;
          format.hasAudio = true;
        }
        videoFormats.push(format);
      }
    });
    
    videoFormats.sort((a, b) => {
       const valA = parseInt(a.qualityLabel) || 0;
       const valB = parseInt(b.qualityLabel) || 0;
       return valA - valB;
    });

    console.log('Processed video formats:', videoFormats.map(f => ({ quality: f.qualityLabel, itag: f.itag, hasAudio: f.hasAudio, merge: f.merge })));

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

    console.log('Facebook video info retrieved successfully');
    res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Facebook Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

export const downloadFacebookVideo = async (req, res) => {
  let tempFilePath = null;
  let processedFilePath = null;
  try {
    const { url, itag, format_id, title, bitrate } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    
    // Check if it's an audio download request
    const isAudio = bitrate || (['96', '128', '160', '192', '256', '320'].includes(String(selectedFormatId)));
    
    console.log(`Facebook download request: URL=${url}, Format=${selectedFormatId}, Audio=${isAudio}`);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (isAudio) {
      // Forward to audio handler
      return downloadFacebookAudio(req, res);
    }

    const cleanTitle = safeFilename(title || 'facebook_video', '', 'mp4');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const tempFileName = `fb_${timestamp}_${randomStr}.mp4`;
    const processedFileName = `fb_ios_${timestamp}_${randomStr}.mp4`;
    
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    processedFilePath = path.join(os.tmpdir(), processedFileName);

    console.log(`Downloading Facebook video to temp file: ${tempFilePath}`);

    const args = [
      url,
      '--no-warnings',
      '--no-check-certificates',
      '--no-playlist',
      // '--cookies', COOKIES_PATH, // Cookies may block public videos, usually safe to omit for public
      '-S', 'vcodec:h264,res,acodec:m4a', // Prefer H.264
      '--output', tempFilePath
    ];

    if (selectedFormatId && selectedFormatId !== 'best') {
       args.splice(1, 0, '-f', selectedFormatId);
    }

    const ytdlpProcess = spawn(YT_DLP_PATH, args);

    let stderrData = '';
    ytdlpProcess.stderr.on('data', (data) => stderrData += data.toString());

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp process exited with code:', code);
        console.error('Full stderr:', stderrData);
        if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
        if (!res.headersSent) return res.status(500).json({ error: 'Download process failed.' });
        return;
      }

      console.log('Facebook download completed locally. Starting iOS compatibility transcoding...');

      if (fs.existsSync(tempFilePath)) {
          // Process with ffmpeg for iOS compatibility
          const ffmpegArgs = [
            '-i', tempFilePath,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'main',
            '-level:v', '4.0',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            processedFilePath
          ];
  
          const ffmpegProcess = spawn(ffmpegStatic, ffmpegArgs);
          
          ffmpegProcess.on('close', (ffmpegCode) => {
            if (ffmpegCode !== 0) {
              console.error('FFmpeg transcoding failed:', ffmpegCode);
              console.warn('Falling back to original file');
              // Fallback
              res.download(tempFilePath, cleanTitle, (err) => {
                if (err) console.error('Error sending file:', err);
                try { 
                  fs.unlinkSync(tempFilePath);
                  if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
                } catch (e) {}
              });
              return;
            }
  
            console.log('Transcoding complete. Sending iOS compatible file.');
            res.download(processedFilePath, cleanTitle, (err) => {
              if (err) console.error('Error sending file:', err);
              try { 
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
              } catch (e) {}
            });
          });
      } else {
        if (!res.headersSent) res.status(500).json({ error: 'Downloaded file not found.' });
      }
    });

  } catch (error) {
    console.error('Facebook Download Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
    if (processedFilePath && fs.existsSync(processedFilePath)) try { fs.unlinkSync(processedFilePath); } catch (e) {}
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const mergeFacebookVideoAudio = (req, res) => {
  let tempFilePath = null;
  let processedFilePath = null;
  try {
    const { url, vItag, aItag, title } = req.query;
    const cleanTitle = safeFilename(title || 'facebook_video', '', 'mp4');
    
    console.log(`Merging Facebook video+audio: vItag=${vItag}, aItag=${aItag}`);
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const tempFileName = `fb_merge_${timestamp}_${randomStr}.mp4`;
    const processedFileName = `fb_merge_ios_${timestamp}_${randomStr}.mp4`;

    tempFilePath = path.join(os.tmpdir(), tempFileName);
    processedFilePath = path.join(os.tmpdir(), processedFileName);
    
    console.log(`Downloading and merging to temp file: ${tempFilePath}`);
    
    const ytdlpArgs = [
      url,
      '-f', `${vItag}+${aItag}`,
      '--ffmpeg-location', ffmpegStatic,
      '--merge-output-format', 'mp4',
      '-S', 'vcodec:h264,res', // Prefer H.264
      '--output', tempFilePath,
      '--no-check-certificates',
      '--no-playlist'
    ];

    const ytdlpProcess = spawn(YT_DLP_PATH, ytdlpArgs);
    let stderrData = '';

    ytdlpProcess.stderr.on('data', (data) => stderrData += data.toString());

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp merge process exited with code:', code);
        console.error('Full stderr:', stderrData);
        if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
        if (!res.headersSent) return res.status(500).json({ error: 'Merge process failed.' });
        return;
      }

      console.log('Facebook merge completed locally. Starting iOS compatibility transcoding...');

      if (fs.existsSync(tempFilePath)) {
          const ffmpegArgs = [
            '-i', tempFilePath,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-pix_fmt', 'yuv420p',
            '-profile:v', 'main',
            '-level:v', '4.0',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y',
            processedFilePath
          ];
  
          const ffmpegProcess = spawn(ffmpegStatic, ffmpegArgs);
          
          ffmpegProcess.on('close', (ffmpegCode) => {
            if (ffmpegCode !== 0) {
              console.error('FFmpeg transcoding failed:', ffmpegCode);
              // Fallback
              res.download(tempFilePath, cleanTitle, (err) => {
                if (err) console.error('Error sending file:', err);
                try { 
                  fs.unlinkSync(tempFilePath);
                  if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
                 } catch (e) {}
              });
              return;
            }
  
            console.log('Transcoding complete. Sending iOS compatible file.');
            res.download(processedFilePath, cleanTitle, (err) => {
              if (err) console.error('Error sending merged file:', err);
              try { 
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
              } catch (e) {}
            });
          });
      } else {
        if (!res.headersSent) res.status(500).json({ error: 'Merged file not found.' });
      }
    });

  } catch (error) {
    console.error('Facebook Merge Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
    if (processedFilePath && fs.existsSync(processedFilePath)) try { fs.unlinkSync(processedFilePath); } catch (e) {}
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const downloadFacebookAudio = (req, res) => {
  let tempFilePath = null;
  try {
    const { url, bitrate, title } = req.query;
    const targetBitrate = parseInt(bitrate) || 128;
    const cleanTitle = safeFilename(title || 'facebook_audio', `${targetBitrate}kbps`, 'mp3');
    
    console.log(`Downloading Facebook MP3 audio: ${url} at ${targetBitrate}kbps`);
    
    const tempFileName = `fb_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    
    const ytdlpProcess = spawn(YT_DLP_PATH, [
      url,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${targetBitrate}k`,
      '--ffmpeg-location', ffmpegStatic,
      '--output', tempFilePath,
      '--no-check-certificates',
      '--no-playlist'
    ]);

    let stderrData = '';
    ytdlpProcess.stderr.on('data', (data) => stderrData += data.toString());

    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp audio process exited with code:', code);
        console.error('Full stderr:', stderrData);
        if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
        if (!res.headersSent) return res.status(500).json({ error: 'Audio download failed.' });
        return;
      }

      console.log('Facebook audio download completed locally.');

      if (fs.existsSync(tempFilePath)) {
         res.download(tempFilePath, cleanTitle, (err) => {
           if (err) console.error('Error sending audio file:', err);
           try { fs.unlinkSync(tempFilePath); } catch (e) {}
         });
      } else {
        if (!res.headersSent) res.status(500).json({ error: 'Audio file not found.' });
      }
    });

  } catch (error) {
    console.error('Facebook Audio Download Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};
