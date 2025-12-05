import express from 'express';
import { 
  getInstagramMediaInfo, 
  downloadInstagramMedia,
  downloadInstagramVideo,
  mergeInstagramVideoAudio,
  downloadInstagramAudio,
  getInstagramThumbnail
} from '../controllers/instagramController.js';
import { validateUrl } from '../middleware/validation.js';

const router = express.Router();

// Get Instagram media information and available formats
router.post('/info', validateUrl, getInstagramMediaInfo);

// Download Instagram media (legacy endpoints)
router.get('/download', downloadInstagramMedia);
router.post('/download', validateUrl, downloadInstagramMedia);

// New download endpoints with yt-dlp
router.get('/download-video', downloadInstagramVideo);
router.post('/download-video', validateUrl, downloadInstagramVideo);
router.get('/merge', mergeInstagramVideoAudio);
router.get('/download-audio', downloadInstagramAudio);

// Thumbnail proxy endpoint
router.get('/thumbnail', getInstagramThumbnail);

export default router;
