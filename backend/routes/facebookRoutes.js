import express from 'express';
import { getFacebookVideoInfo, downloadFacebookVideo, downloadFacebookAudio, mergeFacebookVideoAudio } from '../controllers/facebookController.js';
import { validateUrl } from '../middleware/validation.js';

const router = express.Router();

// Get Facebook video information and available formats
router.post('/info', validateUrl, getFacebookVideoInfo);

// Download Facebook video
router.get('/download', downloadFacebookVideo);
router.post('/download', validateUrl, downloadFacebookVideo);

// Download Facebook audio as MP3
router.get('/download-audio', downloadFacebookVideo);

// Merge Facebook video and audio streams
router.get('/merge', mergeFacebookVideoAudio);

export default router;
