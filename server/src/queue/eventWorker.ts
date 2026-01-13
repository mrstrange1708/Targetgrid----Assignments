import { Worker, Job } from 'bullmq';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import Event from '../models/Event';
import Lead from '../models/Lead';
import ScoringRule from '../models/ScoringRule';
import ScoreHistory from '../models/ScoreHistory';
import { eventEmitter } from './eventQueue';

dotenv.config();

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

const processEventLogic = async (data: any, io: Server) => {
    const { eventId, type, source, timestamp, metadata } = data;
    console.log(`Processing Event: ${type}`);

    try {
        // 1. Idempotency Check
        const existingEvent = await Event.findOne({ eventId });
        if (existingEvent) {
            console.log(`Event ${eventId} already processed. Skipping.`);
            return;
        }

        // 2. Identify Lead
        let lead = null;
        if (metadata.email) {
            lead = await Lead.findOne({ email: metadata.email });
            if (!lead) {
                // Create new lead
                lead = await Lead.create({
                    email: metadata.email,
                    name: metadata.name || 'Unknown',
                    company: metadata.company || 'Unknown',
                    status: 'new'
                });
                console.log(`Created new lead: ${lead.email}`);
            }
        } else if (metadata.leadId) {
            lead = await Lead.findById(metadata.leadId);
        }

        if (!lead) {
            console.log(`No lead identified for event ${eventId}. Storing event as orphan.`);
            await Event.create({
                eventId,
                type,
                source,
                timestamp,
                metadata,
                processed: false
            });
            return;
        }

        // 3. Scoring
        const rule = await ScoringRule.findOne({ eventType: type, active: true });
        let points = 0;
        if (rule) {
            points = rule.points;
        } else {
            console.log(`No active scoring rule for event type ${type}`);
        }

        // 4. Update Lead
        const previousScore = lead.score;
        let newScore = lead.score + points;

        // Cap score at 1000
        if (newScore > 1000) newScore = 1000;

        lead.score = newScore;
        await lead.save();

        // Store Event
        const eventDoc = await Event.create({
            eventId,
            type,
            source,
            timestamp,
            metadata,
            leadId: lead._id,
            processed: true
        });

        // 5. History
        if (points !== 0) {
            await ScoreHistory.create({
                leadId: lead._id,
                scoreChange: points,
                newScore: lead.score,
                reason: `Event: ${type}`,
                eventId: eventDoc._id
            });
        }

        // 6. Real-time Update
        io.emit('score-update', {
            leadId: lead._id,
            score: lead.score,
            name: lead.name,
            email: lead.email,
            timestamp: new Date()
        });
        console.log(`Processed ${type} for ${lead.email}. Score: ${previousScore} -> ${lead.score}`);

    } catch (err) {
        console.error(`Error processing event ${eventId}:`, err);
        throw err;
    }
};

export const initWorker = (io: Server) => {
    // Listen to In-Memory Events
    eventEmitter.on('job', async (job) => {
        console.log(`[Memory] Received job ${job.id}`);
        try {
            await processEventLogic(job.data, io);
        } catch (e) {
            console.error('[Memory] Job failed', e);
        }
    });

    // Listen to Redis Events
    try {
        const worker = new Worker('event-processing-queue', async (job: Job) => {
            await processEventLogic(job.data, io);
        }, { connection });

        worker.on('completed', (job: Job) => {
            // console.log(`Job ${job.id} has completed!`);
        });

        worker.on('failed', (job: Job | undefined, err: Error) => {
            console.error(`Job ${job?.id} has failed with ${err.message}`);
        });

        // Handle connection errors specifically to avoid crash
        worker.on('error', (err) => {
            console.warn('redis worker connection error:', (err as any).code);
        });

        console.log('Event Worker initialized (Redis + Memory)');
    } catch (err) {
        console.warn('Could not initialize Redis Worker. Running in Memory-Only mode.');
    }
};
