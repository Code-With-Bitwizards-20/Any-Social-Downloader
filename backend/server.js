import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import youtubeRoutes from './routes/youtubeRoutes.js';
import facebookRoutes from './routes/facebookRoutes.js';
import instagramRoutes from './routes/instagramRoutes.js';
import tiktokRoutes from './routes/tiktokRoutes.js';
import twitterRoutes from './routes/twitterRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    /^http:\/\/localhost:\d+$/,
    'https://anysocialdownloader.cloud',
    'https://www.anysocialdownloader.cloud',
    'https://api.anysocialdownloader.cloud'
  ],
  methods: ['GET', 'POST'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));
app.use(morgan('combined'));
// Apply rate limiter only to metadata/info endpoints, not streaming routes
// We'll mount limiter on specific routes below
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
// Protect only info endpoints with limiter to avoid aborting long streams
app.use('/api/youtube/info', limiter);
app.use('/api/facebook/info', limiter);
app.use('/api/instagram/info', limiter);
app.use('/api/tiktok/info', limiter);
app.use('/api/twitter/info', limiter);

app.use('/api/youtube', youtubeRoutes);
app.use('/api/facebook', facebookRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/twitter', twitterRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Any Social Downloader API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});
// Increase/disable timeouts to support long downloads
server.headersTimeout = 0; // disable header timeout
server.requestTimeout = 0; // disable request timeout
server.keepAliveTimeout = 10 * 60 * 1000; // 10 minutes
