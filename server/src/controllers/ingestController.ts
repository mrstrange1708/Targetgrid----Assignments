import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import csv from 'csv-parser';
import { addEventToQueue, addEventsToQueueBulk } from '../queue/eventQueue';
import { eventSchema, webhookSchema, verifyWebhookSignature } from '../utils/validation';

export const ingestEvent = async (req: Request, res: Response) => {
    try {
        const { error, value } = eventSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const { eventId, event_type, source, timestamp, metadata } = value;

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
        // Webhook signature verification (if secret is configured)
        const signature = req.headers['x-webhook-signature'] as string;
        const secret = process.env.WEBHOOK_SECRET;

        if (secret && signature) {
            const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature, secret);
            if (!isValid) {
                return res.status(401).json({ message: 'Invalid webhook signature' });
            }
        }

        const { error, value: body } = webhookSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: 'Invalid webhook payload' });
        }

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
                const eventsToQueue = [];
                for (const item of results) {
                    // Map headers
                    const eventData = {
                        eventId: item.event_id || item.eventId || uuidv4(),
                        event_type: item.event_type || item.type || 'unknown_batch',
                        source: item.source || 'batch_upload',
                        timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
                        metadata: item
                    };

                    // Try parsing metadata
                    if (typeof item.metadata === 'string') {
                        try {
                            eventData.metadata = JSON.parse(item.metadata);
                            if (item.lead_id) eventData.metadata.lead_id = item.lead_id;
                        } catch (e) {
                            // Keep as string
                        }
                    } else if (item.lead_id && !eventData.metadata.lead_id) {
                        eventData.metadata.lead_id = item.lead_id;
                    }

                    eventsToQueue.push(eventData);
                }

                if (eventsToQueue.length > 0) {
                    await addEventsToQueueBulk(eventsToQueue);
                }

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                res.status(202).json({ message: 'Batch accepted', count: eventsToQueue.length });
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
