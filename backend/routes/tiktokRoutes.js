import express from 'express';
import { 
  getTikTokVideoInfo, 
  downloadTikTokVideo,
  mergeTikTokVideoAudio,
  downloadTikTokAudio
} from '../controllers/tiktokController.js';
import { validateUrl } from '../middleware/validation.js';

const router = express.Router();

// Get TikTok video information and available formats
router.post('/info', validateUrl, getTikTokVideoInfo);

// Download TikTok video
router.get('/download', downloadTikTokVideo);
router.post('/download', validateUrl, downloadTikTokVideo);
router.get('/merge', mergeTikTokVideoAudio);
router.get('/download-audio', downloadTikTokAudio);

export default router;
