import { Request, Response } from 'express';
import Lead from '../models/Lead';
import Event from '../models/Event';
import ScoreHistory from '../models/ScoreHistory';
import { processEventLogic } from '../queue/eventWorker';
import { io } from '../index';

export const replayEvents = async (req: Request, res: Response) => {
    try {
        console.log('Starting Event Replay...');

        // 1. Reset all lead scores
        await Lead.updateMany({}, { current_score: 0 });

        // 2. Clear history
        await ScoreHistory.deleteMany({});

        // 3. Get all processed events in chronological order
        const events = await Event.find({ processed: true }).sort({ timestamp: 1 });

        console.log(`Replaying ${events.length} events...`);

        // 4. Reprocess each event
        // Note: processEventLogic checks for idempotency by eventId.
        // We need to delete processed events and re-process them as if they are new,
        // or modify processEventLogic to force re-processing.
        // For simplicity, we'll clear the 'processed' flag and the event docs,
        // but keep the data to re-insert.

        const eventDataList = events.map(e => ({
            eventId: e.eventId,
            event_type: e.event_type,
            source: e.source,
            timestamp: e.timestamp,
            metadata: e.metadata
        }));

        await Event.deleteMany({}); // Delete to satisfy idempotency check in worker

        for (const data of eventDataList) {
            await processEventLogic(data, io);
        }

        res.json({ message: 'Event replay completed', count: eventDataList.length });
    } catch (error) {
        console.error('Replay Error:', error);
        res.status(500).json({ message: 'Error during event replay' });
    }
};

export const exportLeads = async (req: Request, res: Response) => {
    try {
        const leads = await Lead.find().lean();
        const format = req.query.format || 'json';

        if (format === 'csv') {
            const fields = ['name', 'email', 'company', 'current_score', 'status'];
            const csvData = [
                fields.join(','),
                ...leads.map(l => fields.map(f => `"${(l as any)[f] || ''}"`).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
            return res.send(csvData);
        }

        res.json(leads);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting leads' });
    }
};

export const exportEvents = async (req: Request, res: Response) => {
    try {
        const events = await Event.find().populate('lead_id').lean();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting events' });
    }
};
