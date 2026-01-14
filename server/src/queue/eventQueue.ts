import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

import { redisConnection } from '../config/config';

export const eventEmitter = new EventEmitter();
let useRedis = true;
let eventQueue: Queue | null = null;

const createQueue = () => {
    try {
        const q = new Queue('event-processing-queue', {
            connection: redisConnection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
            }
        });

        q.on('error', (err) => {
            console.warn('Redis connection issue:', (err as any).code);
        });
        return q;
    } catch (err) {
        return null;
    }
};

eventQueue = createQueue();

export const addEventToQueue = async (eventData: any) => {
    if (useRedis && eventQueue) {
        try {
            await eventQueue.add('process-event', eventData);
        } catch (err) {
            console.warn('Redis unreachable. Switching to In-Memory for this event.');
            useRedis = false;
            eventEmitter.emit('job', { data: eventData, id: 'mem-' + Date.now() });
        }
    } else {
        eventEmitter.emit('job', { data: eventData, id: 'mem-' + Date.now() });
    }
};
