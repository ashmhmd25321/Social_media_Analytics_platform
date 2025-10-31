import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const redisClient = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('🔄 Redis Client Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis Client Ready');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
  }
};

export default redisClient;

