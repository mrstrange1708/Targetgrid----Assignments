import { Queue, Worker, Job } from 'bullmq';
import { Server } from 'socket.io';
import Lead from '../models/Lead';
import ScoreHistory from '../models/ScoreHistory';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

const DECAY_POINTS = 5;
const INACTIVITY_DAYS = 30;

export const initDecayWorker = async (io: Server) => {
    const decayQueue = new Queue('score-decay-queue', { connection });

    // Add repeatable job to run every 24 hours
    // For demo/dev, we could run it more often, but let's stick to 24h
    await decayQueue.add('daily-decay', {}, {
        repeat: {
            pattern: '0 0 * * *' // Every day at midnight
        }
    });

    try {
        const worker = new Worker('score-decay-queue', async (job: Job) => {
            console.log('Running daily score decay job...');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);

            // Find leads who haven't been updated in 30 days and have score > 0
            const leadsToDecay = await Lead.find({
                updatedAt: { $lt: cutoffDate },
                current_score: { $gt: 0 }
            });

            console.log(`Found ${leadsToDecay.length} leads to decay.`);

            for (const lead of leadsToDecay) {
                const previousScore = lead.current_score;
                lead.current_score = Math.max(0, lead.current_score - DECAY_POINTS);
                await lead.save();

                await ScoreHistory.create({
                    lead_id: lead._id,
                    scoreChange: -DECAY_POINTS,
                    score: lead.current_score,
                    reason: `Inactivity Decay (${INACTIVITY_DAYS} days)`,
                    timestamp: new Date()
                });

                io.emit('score-update', {
                    leadId: lead._id,
                    score: lead.current_score,
                    name: lead.name,
                    email: lead.email,
                    timestamp: new Date()
                });
            }
        }, { connection });

        worker.on('failed', (job, err) => {
            console.error('Decay Job failed:', err);
        });

        console.log('Score Decay Worker initialized');
    } catch (err) {
        console.warn('Could not initialize Score Decay Worker. Redis might be unavailable.');
    }
};
