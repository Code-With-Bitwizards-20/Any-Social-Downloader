import express from 'express';
import { getTwitterMediaInfo, downloadTwitterMedia, downloadTwitterAudio } from '../controllers/twitterController.js';
import { validateUrl } from '../middleware/validation.js';

const router = express.Router();

// Get Twitter media information and available formats
router.post('/info', validateUrl, getTwitterMediaInfo);

// Download Twitter media
router.get('/download', downloadTwitterMedia);
router.post('/download', validateUrl, downloadTwitterMedia);

// Download Twitter audio
router.get('/download-audio', downloadTwitterAudio);

export default router;
