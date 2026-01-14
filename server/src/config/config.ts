import dotenv from 'dotenv';
dotenv.config();

export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const redisUrl = process.env.REDIS_URL;

export const redisConnection = redisUrl
    ? {
        url: redisUrl,
        tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null // Required by BullMQ
    }
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null
    };
