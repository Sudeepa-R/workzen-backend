import { createClient } from 'redis';
import config from './config';

let isRedisErrorLogged = false;

const redisClient = createClient({
    url: config.REDIS_URL,
    password: config.REDIS_PASSWORD,
    username: config.REDIS_USERNAME,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                if (!isRedisErrorLogged) {
                    console.error('Redis connection failed after multiple attempts. Caching disabled.');
                    isRedisErrorLogged = true;
                }
                return false; // Stop retrying
            }
            return Math.min(retries * 50, 500);
        }
    }
});

redisClient.on('error', (err) => {
    if (!isRedisErrorLogged) {
        console.error('Redis Client Error:', err.message);
        isRedisErrorLogged = true;
    }
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
    isRedisErrorLogged = false;
});

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (err) {
        console.error('Failed to connect to Redis. Caching will be disabled.', err);
    }
};

export { redisClient, connectRedis };
