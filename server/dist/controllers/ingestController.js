"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestBatch = exports.ingestWebhook = exports.ingestEvent = void 0;
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const eventQueue_1 = require("../queue/eventQueue");
const ingestEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { eventId, event_type, source, timestamp, metadata } = req.body;
        if (!event_type || !source) {
            return res.status(400).json({ message: 'Missing required fields: event_type, source' });
        }
        const eventData = {
            eventId: eventId || (0, uuid_1.v4)(),
            event_type,
            source,
            timestamp: timestamp || new Date(),
            metadata: metadata || {},
        };
        yield (0, eventQueue_1.addEventToQueue)(eventData);
        res.status(202).json({ message: 'Event accepted', eventId: eventData.eventId });
    }
    catch (error) {
        console.error('Ingest Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.ingestEvent = ingestEvent;
const ingestWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body;
        if (Array.isArray(body)) {
            for (const item of body) {
                yield (0, eventQueue_1.addEventToQueue)({
                    eventId: item.messageId || item.eventId || (0, uuid_1.v4)(),
                    event_type: item.type || item.event_type || 'unknown',
                    source: 'webhook',
                    timestamp: item.timestamp || new Date(),
                    metadata: item
                });
            }
        }
        else {
            yield (0, eventQueue_1.addEventToQueue)({
                eventId: body.messageId || body.eventId || (0, uuid_1.v4)(),
                event_type: body.type || body.event_type || 'unknown',
                source: 'webhook',
                timestamp: body.timestamp || new Date(),
                metadata: body
            });
        }
        res.status(200).json({ message: 'Webhook received' });
    }
    catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.ingestWebhook = ingestWebhook;
const ingestBatch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const results = [];
    const filePath = req.file.path;
    fs_1.default.createReadStream(filePath)
        .pipe((0, csv_parser_1.default)())
        .on('data', (data) => results.push(data))
        .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let count = 0;
            for (const item of results) {
                // Map user headers (event_id, lead_id, event_type, metadata)
                const eventData = {
                    eventId: item.event_id || item.eventId || (0, uuid_1.v4)(),
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
                        if (item.lead_id)
                            eventData.metadata.lead_id = item.lead_id;
                    }
                    catch (e) {
                        // Keep as string if not JSON
                    }
                }
                yield (0, eventQueue_1.addEventToQueue)(eventData);
                count++;
            }
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
            res.status(202).json({ message: 'Batch accepted', count });
        }
        catch (err) {
            console.error('Batch Process Error:', err);
            res.status(500).json({ message: 'Error processing batch' });
        }
    }))
        .on('error', (err) => {
        console.error('CSV Read Error:', err);
        res.status(500).json({ message: 'Error reading file' });
    });
});
exports.ingestBatch = ingestBatch;
