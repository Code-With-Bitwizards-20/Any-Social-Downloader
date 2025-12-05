# Any Social Downloader - Backend

This is the backend API for Any Social Downloader, built with Node.js and Express.js.

## 🛠 Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **ytdl-core** - YouTube video downloading library
- **CORS** - Cross-Origin Resource Sharing middleware
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **Express Rate Limit** - Rate limiting middleware
- **Express Validator** - Input validation and sanitization
- **dotenv** - Environment variable management

## 📁 Project Structure

```
backend/
├── controllers/         # Route handlers and business logic
├── routes/             # API route definitions
├── middleware/         # Custom middleware functions
├── utils/              # Utility functions and helpers
├── config/             # Configuration files
├── .env.example        # Environment variables template
├── server.js           # Main server file
└── package.json        # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   ```

### Development
```bash
npm run dev
```
Starts the server in development mode with nodemon for auto-restart on file changes.

### Production
```bash
npm start
```
Starts the server in production mode.

## 🔧 API Endpoints

### Health Check
- **GET** `/api/health` - Check API status
  - Response: `{ status: 'OK', message: 'Any Social Downloader API is running', timestamp: '...' }`

### YouTube API
- **POST** `/api/youtube/info` - Get video information and available formats
  - Body: `{ url: 'https://youtube.com/watch?v=...' }`
  - Response: Video info with available audio and video formats
  
- **POST** `/api/youtube/download` - Download video (placeholder)
  - Body: `{ url: 'https://youtube.com/watch?v=...', format: 'mp4' }`
  - Response: Download information (implementation pending)

## 🔒 Security Features

- **Helmet** - Sets various HTTP headers for security
- **CORS** - Configures cross-origin resource sharing
- **Rate Limiting** - Limits requests per IP (100 requests per 15 minutes)
- **Input Validation** - Validates and sanitizes all inputs
- **Error Handling** - Comprehensive error handling with appropriate HTTP status codes

## 📝 Validation

The API uses Express Validator for input validation:

### URL Validation
- Validates that the input is a valid URL
- Specifically checks for YouTube URL patterns
- Returns detailed error messages for invalid inputs

## 🎯 Features

- **YouTube Integration**: Full YouTube video information retrieval
- **Format Separation**: Separates audio and video formats for easy frontend consumption
- **Quality Sorting**: Automatically sorts formats by quality (highest first)
- **Error Handling**: Comprehensive error handling for various scenarios
- **Rate Limiting**: Prevents abuse with configurable rate limiting
- **Logging**: HTTP request logging with Morgan
- **CORS Support**: Configurable CORS for frontend integration

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "videoInfo": {
    "title": "Video Title",
    "author": "Channel Name",
    "lengthSeconds": "180",
    "viewCount": "1000000",
    "publishDate": "2023-01-01",
    "description": "Video description...",
    "thumbnail": "https://..."
  },
  "formats": {
    "audio": [
      {
        "itag": 140,
        "mimeType": "audio/mp4",
        "bitrate": 128,
        "audioCodec": "mp4a.40.2",
        "url": "https://...",
        "contentLength": "1234567",
        "quality": "medium"
      }
    ],
    "video": [
      {
        "itag": 22,
        "mimeType": "video/mp4",
        "qualityLabel": "720p",
        "quality": "hd720",
        "fps": 30,
        "videoCodec": "avc1.64001F",
        "audioCodec": "mp4a.40.2",
        "url": "https://...",
        "contentLength": "12345678",
        "hasAudio": true,
        "hasVideo": true
      }
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

## 🛡️ Error Handling

The API handles various types of errors:

- **Validation Errors** (400) - Invalid input data
- **Not Found** (404) - Video not found or private
- **Forbidden** (403) - Video not available in region
- **Rate Limit** (429) - Too many requests
- **Server Errors** (500) - Internal server errors

## 📄 License

This project is part of the Any Social Downloader application and follows the same license terms.

## 🤝 Contributing

When contributing to the backend:

1. Follow the existing code structure
2. Add appropriate error handling
3. Validate all inputs
4. Update documentation
5. Test all endpoints
