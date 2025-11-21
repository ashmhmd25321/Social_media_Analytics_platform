import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import socialRoutes from './routes/socialRoutes';
import dataCollectionRoutes from './routes/dataCollectionRoutes';
import { testConnection } from './config/database';
import { connectRedis } from './config/redis';
import { rateLimiter } from './middleware/rateLimiter';
import { schedulerService } from './services/SchedulerService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (applied to all routes)
app.use(rateLimiter(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Social Media Analytics Platform API',
    version: '1.0.0',
    status: 'running'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/data', dataCollectionRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  
  // Test database connection
  await testConnection();
  
  // Connect to Redis (optional)
  if (process.env.REDIS_HOST) {
    await connectRedis();
  }

  // Start scheduler service (only in production or if enabled)
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    schedulerService.start();
  }
});

