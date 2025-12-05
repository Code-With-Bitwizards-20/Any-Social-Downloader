import { body, validationResult } from 'express-validator';

export const validateUrl = [
  body('url')
    .isURL()
    .withMessage('Please provide a valid URL')
    .custom((value, { req }) => {
      const path = req.path;
      
      // Determine which platform validation to use based on the route
      if (path.includes('youtube')) {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/;
        if (!youtubeRegex.test(value)) {
          throw new Error('Please provide a valid YouTube URL');
        }
      } else if (path.includes('facebook')) {
        const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/i;
        if (!facebookRegex.test(value)) {
          throw new Error('Please provide a valid Facebook URL');
        }
      } else if (path.includes('instagram')) {
        const instagramRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|tv)\/[\w-]+\/?/i;
        if (!instagramRegex.test(value)) {
          throw new Error('Please provide a valid Instagram URL (post, reel, or IGTV)');
        }
      } else if (path.includes('tiktok')) {
        const tiktokRegex = /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com|m\.tiktok\.com)\/.+/i;
        if (!tiktokRegex.test(value)) {
          throw new Error('Please provide a valid TikTok URL');
        }
      } else if (path.includes('twitter')) {
        const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/\w+\/status\/\d+/i;
        if (!twitterRegex.test(value)) {
          throw new Error('Please provide a valid Twitter/X URL');
        }
      }
      
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];