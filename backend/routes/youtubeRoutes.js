import express from 'express';
import { getVideoInfo, downloadVideo, downloadVideoGet, mergeDownloadGet, downloadAudioGet } from '../controllers/youtubeController.js';
import { validateUrl } from '../middleware/validation.js';

const router = express.Router();

// Get video information and available formats
router.post('/info', validateUrl, getVideoInfo);

// Download progressive video or audio-only stream
router.get('/download', downloadVideoGet);
router.post('/download', validateUrl, downloadVideo);

// Merge video-only + audio-only and stream as MP4
router.get('/merge', mergeDownloadGet);

// Transcode audio to MP3 and stream
router.get('/download-audio', downloadAudioGet);

export default router;