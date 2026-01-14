import { Worker, Job } from 'bullmq';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import Event from '../models/Event';
import Lead, { ILead } from '../models/Lead';
import ScoringRule from '../models/ScoringRule';
import ScoreHistory from '../models/ScoreHistory';
import { redisConnection } from '../config/config';
import { eventEmitter } from './eventQueue';

export const processEventLogic = async (data: any, io: Server) => {
    const { eventId, event_type, source, timestamp, metadata } = data;
    console.log(`Processing Event: ${event_type}`);

    try {
        // 1. Idempotency Check
        const existingEvent = await Event.findOne({ eventId });
        if (existingEvent) {
            console.log(`Event ${eventId} already processed. Skipping.`);
            return;
        }

        // 2. Identify Lead
        let lead: ILead | null = null;
        const email = metadata.email || metadata.metadata?.email;
        const lead_id = metadata.lead_id || metadata.metadata?.lead_id;

        if (email) {
            lead = await Lead.findOne({ email }) as ILead | null;
        } else if (lead_id) {
            lead = await Lead.findOne({ externalId: lead_id }) as ILead | null;
        }

        if (!lead && (email || lead_id)) {
            // Create new lead
            lead = await Lead.create({
                email: email || `${lead_id}@placeholder.com`,
                name: metadata.name || metadata.metadata?.name || 'Unknown',
                company: metadata.company || metadata.metadata?.company || 'Unknown',
                externalId: lead_id,
                status: 'new'
            }) as unknown as ILead;
            console.log(`Created new lead: ${lead.email || lead.externalId}`);
        }

        if (!lead) {
            console.log(`No lead identified for event ${eventId}. Storing event as orphan.`);
            await Event.create({
                eventId,
                event_type,
                source,
                timestamp,
                metadata,
                processed: false
            });
            return;
        }

        // 3. Scoring
        const rule = await ScoringRule.findOne({ event_type: event_type, active: true });
        let points = 0;
        if (rule) {
            points = rule.points;
        } else {
            console.log(`No active scoring rule for event type ${event_type}`);
        }

        // 4. Update Lead
        const previousScore = lead.current_score;
        let newScore = lead.current_score + points;

        // Cap score at 1000
        if (newScore > 1000) newScore = 1000;

        lead.current_score = newScore;
        await lead.save();

        // Store Event
        const eventDoc = await Event.create({
            eventId,
            event_type,
            source,
            timestamp,
            metadata,
            lead_id: lead._id,
            processed: true
        });

        // 5. History
        if (points !== 0) {
            await ScoreHistory.create({
                lead_id: lead._id,
                scoreChange: points,
                score: lead.current_score,
                reason: `Event: ${event_type}`,
                eventId: eventDoc._id
            });
        }

        // 6. Real-time Update
        io.emit('score-update', {
            leadId: lead._id,
            score: lead.current_score,
            name: lead.name,
            email: lead.email,
            timestamp: new Date()
        });

        io.emit('analytics-refresh', {
            type: event_type,
            timestamp: new Date()
        });

        console.log(`Processed ${event_type} for ${lead.email || lead.externalId}. Score: ${previousScore} -> ${lead.current_score}`);

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
        }, { connection: redisConnection });

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
