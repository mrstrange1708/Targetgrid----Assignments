import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import csv from 'csv-parser';
import { addEventToQueue } from '../queue/eventQueue';

export const ingestEvent = async (req: Request, res: Response) => {
    try {
        const { eventId, event_type, source, timestamp, metadata } = req.body;

        if (!event_type || !source) {
            return res.status(400).json({ message: 'Missing required fields: event_type, source' });
        }

        const eventData = {
            eventId: eventId || uuidv4(),
            event_type,
            source,
            timestamp: timestamp || new Date(),
            metadata: metadata || {},
        };

        await addEventToQueue(eventData);

        res.status(202).json({ message: 'Event accepted', eventId: eventData.eventId });
    } catch (error) {
        console.error('Ingest Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const ingestWebhook = async (req: Request, res: Response) => {
    try {
        const body = req.body;

        if (Array.isArray(body)) {
            for (const item of body) {
                await addEventToQueue({
                    eventId: item.messageId || item.eventId || uuidv4(),
                    event_type: item.type || item.event_type || 'unknown',
                    source: 'webhook',
                    timestamp: item.timestamp || new Date(),
                    metadata: item
                });
            }
        } else {
            await addEventToQueue({
                eventId: body.messageId || body.eventId || uuidv4(),
                event_type: body.type || body.event_type || 'unknown',
                source: 'webhook',
                timestamp: body.timestamp || new Date(),
                metadata: body
            });
        }

        res.status(200).json({ message: 'Webhook received' });
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const ingestBatch = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const filePath = req.file.path;

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
            try {
                let count = 0;
                for (const item of results) {
                    // Map user headers (event_id, lead_id, event_type, metadata)
                    const eventData = {
                        eventId: item.event_id || item.eventId || uuidv4(),
                        event_type: item.event_type || item.type || 'unknown_batch',
                        source: item.source || 'batch_upload',
                        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                        metadata: item
                    };

                    // Try parsing metadata if it's a string JSON
                    if (typeof item.metadata === 'string') {
                        try {
                            eventData.metadata = JSON.parse(item.metadata);
                            // Preserve lead_id if it was top level in item
                            if (item.lead_id) eventData.metadata.lead_id = item.lead_id;
                        } catch (e) {
                            // Keep as string if not JSON
                        }
                    }

                    await addEventToQueue(eventData);
                    count++;
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                res.status(202).json({ message: 'Batch accepted', count });
            } catch (err) {
                console.error('Batch Process Error:', err);
                res.status(500).json({ message: 'Error processing batch' });
            }
        })
        .on('error', (err: any) => {
            console.error('CSV Read Error:', err);
            res.status(500).json({ message: 'Error reading file' });
        });
};
