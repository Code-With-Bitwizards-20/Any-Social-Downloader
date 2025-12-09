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

// Path to cookies file (TikTok specific)
const COOKIES_PATH = path.join(__dirname, '../cookies-tk/cookies.txt');

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

export const getTikTokVideoInfo = async (req, res) => {
  const { url } = req.body;
  console.log('TikTok info request for URL:', url);

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
      title: metadata.title || 'TikTok Video',
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
    standardQualities.forEach((quality, idx) => {
      let format = qualityMap.get(quality);
      
      // If exact quality not available, create a fallback format using yt-dlp's intelligent selection
      if (!format) {
        const targetHeight = parseInt(quality);
        format = {
          itag: `best[height<=${targetHeight}]/worst[height>=${targetHeight}]/best`,
          qualityLabel: quality,
          quality: targetHeight,
          hasAudio: true,
          merge: false,
          fps: 30,
          mimeType: 'video/mp4',
          contentLength: null,
          width: null,
          height: targetHeight,
          tbr: null
        };
      }
      
      if (format.merge && format.vItag && format.aItag) {
        format.itag = `${format.vItag}+${format.aItag}`;
        format.hasAudio = true;
      }
      videoFormats.push(format);
    });

    videoFormats.sort((a, b) => {
       const valA = parseInt(a.qualityLabel) || 0;
       const valB = parseInt(b.qualityLabel) || 0;
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
    console.error('TikTok Info Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch TikTok video info.',
      details: error.message
    });
  }
};

export const downloadTikTokVideo = async (req, res) => {
  let tempFilePath = null;
  let processedFilePath = null;
  try {
    const { url, itag, format_id, title, bitrate } = req.method === 'POST' ? req.body : req.query;
    const selectedFormatId = itag || format_id;
    const isAudio = bitrate || (['96', '128', '160', '192', '256', '320'].includes(String(selectedFormatId)));
    
    if (isAudio) {
      return downloadTikTokAudio(req, res);
    }

    const cleanTitle = safeFilename(title || 'tiktok_video', '', 'mp4');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const tempFileName = `tiktok_${timestamp}_${randomStr}.mp4`;
    const processedFileName = `tiktok_ios_${timestamp}_${randomStr}.mp4`;

    tempFilePath = path.join(os.tmpdir(), tempFileName);
    processedFilePath = path.join(os.tmpdir(), processedFileName);

    console.log(`Downloading TikTok video to temp file: ${tempFilePath}`);

    const args = [
      url,
      '--cookies', COOKIES_PATH,
      '-S', 'vcodec:h264,res', // Prefer H.264
      '--output', tempFilePath,
      '--no-check-certificates',
      '--no-playlist'
    ];

    if (selectedFormatId && selectedFormatId !== 'best') {
       args.splice(1, 0, '-f', selectedFormatId);
    }

    const process = spawn(YT_DLP_PATH, args);

    process.on('close', (code) => {
      if (code !== 0) {
        console.error('Download failed with code:', code);
        if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
        if (!res.headersSent) return res.status(500).json({ error: 'Download failed.' });
        return;
      }
      
      console.log('TikTok download completed locally. Starting iOS compatibility transcoding...');

      if (fs.existsSync(tempFilePath)) {
          // Process with ffmpeg
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
              if (err) console.error('Error sending file:', err);
              try { 
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                if (fs.existsSync(processedFilePath)) fs.unlinkSync(processedFilePath);
              } catch (e) {}
            });
          });
      } else {
        if (!res.headersSent) res.status(500).json({ error: 'File not found.' });
      }
    });

  } catch (error) {
    console.error('TikTok Download Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
    if (processedFilePath && fs.existsSync(processedFilePath)) try { fs.unlinkSync(processedFilePath); } catch (e) {}
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const mergeTikTokVideoAudio = (req, res) => {
  let tempFilePath = null;
  let processedFilePath = null;
  try {
    const { url, vItag, aItag, title } = req.query;
    const cleanTitle = safeFilename(title || 'tiktok_video', '', 'mp4');
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const tempFileName = `tiktok_merge_${timestamp}_${randomStr}.mp4`;
    const processedFileName = `tiktok_merge_ios_${timestamp}_${randomStr}.mp4`;

    tempFilePath = path.join(os.tmpdir(), tempFileName);
    processedFilePath = path.join(os.tmpdir(), processedFileName);
    
    console.log(`Merging TikTok video+audio to: ${tempFilePath}`);
    
    const ytdlpArgs = [
      url,
      '-f', `${vItag}+${aItag}`,
      '--cookies', COOKIES_PATH,
      '-S', 'vcodec:h264,res', // Prefer H.264
      '--ffmpeg-location', ffmpegStatic,
      '--merge-output-format', 'mp4',
      '--output', tempFilePath,
      '--no-check-certificates',
      '--no-playlist'
    ];

    const process = spawn(YT_DLP_PATH, ytdlpArgs);

    process.on('close', (code) => {
      if (code !== 0) {
        console.error('Merge failed with code:', code);
        if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
        if (!res.headersSent) return res.status(500).json({ error: 'Merge failed.' });
        return;
      }
      
      console.log('TikTok merge completed locally. Starting iOS compatibility transcoding...');

      if (fs.existsSync(tempFilePath)) {
          // Process with ffmpeg
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
              if (err) console.error('Error sending file:', err);
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
    console.error('TikTok Merge Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
    if (processedFilePath && fs.existsSync(processedFilePath)) try { fs.unlinkSync(processedFilePath); } catch (e) {}
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const downloadTikTokAudio = (req, res) => {
  let tempFilePath = null;
  try {
    const { url, bitrate, title } = req.query;
    const targetBitrate = parseInt(bitrate) || 128;
    const cleanTitle = safeFilename(title || 'tiktok_audio', `${targetBitrate}kbps`, 'mp3');
    
    const tempFileName = `tiktok_audio_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
    tempFilePath = path.join(os.tmpdir(), tempFileName);
    
    console.log(`Downloading TikTok audio to: ${tempFilePath}`);
    
    const process = spawn(YT_DLP_PATH, [
      url,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${targetBitrate}k`,
      '--ffmpeg-location', ffmpegStatic,
      '--output', tempFilePath,
      '--cookies', COOKIES_PATH,
      '--no-check-certificates',
      '--no-playlist'
    ]);

    process.on('close', (code) => {
      if (code !== 0) {
        console.error('Audio download failed with code:', code);
        if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
        if (!res.headersSent) return res.status(500).json({ error: 'Audio download failed.' });
        return;
      }
      
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
    console.error('TikTok Audio Error:', error);
    if (tempFilePath && fs.existsSync(tempFilePath)) try { fs.unlinkSync(tempFilePath); } catch (e) {}
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
};
