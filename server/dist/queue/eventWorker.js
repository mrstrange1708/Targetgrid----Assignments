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
exports.initWorker = exports.processEventLogic = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
const Event_1 = __importDefault(require("../models/Event"));
const Lead_1 = __importDefault(require("../models/Lead"));
const ScoringRule_1 = __importDefault(require("../models/ScoringRule"));
const ScoreHistory_1 = __importDefault(require("../models/ScoreHistory"));
const eventQueue_1 = require("./eventQueue");
dotenv_1.default.config();
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
const processEventLogic = (data, io) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { eventId, event_type, source, timestamp, metadata } = data;
    console.log(`Processing Event: ${event_type}`);
    try {
        // 1. Idempotency Check
        const existingEvent = yield Event_1.default.findOne({ eventId });
        if (existingEvent) {
            console.log(`Event ${eventId} already processed. Skipping.`);
            return;
        }
        // 2. Identify Lead
        let lead = null;
        const email = metadata.email || ((_a = metadata.metadata) === null || _a === void 0 ? void 0 : _a.email);
        const lead_id = metadata.lead_id || ((_b = metadata.metadata) === null || _b === void 0 ? void 0 : _b.lead_id);
        if (email) {
            lead = (yield Lead_1.default.findOne({ email }));
        }
        else if (lead_id) {
            lead = (yield Lead_1.default.findOne({ externalId: lead_id }));
        }
        if (!lead && (email || lead_id)) {
            // Create new lead
            lead = (yield Lead_1.default.create({
                email: email || `${lead_id}@placeholder.com`,
                name: metadata.name || ((_c = metadata.metadata) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown',
                company: metadata.company || ((_d = metadata.metadata) === null || _d === void 0 ? void 0 : _d.company) || 'Unknown',
                externalId: lead_id,
                status: 'new'
            }));
            console.log(`Created new lead: ${lead.email || lead.externalId}`);
        }
        if (!lead) {
            console.log(`No lead identified for event ${eventId}. Storing event as orphan.`);
            yield Event_1.default.create({
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
        const rule = yield ScoringRule_1.default.findOne({ event_type: event_type, active: true });
        let points = 0;
        if (rule) {
            points = rule.points;
        }
        else {
            console.log(`No active scoring rule for event type ${event_type}`);
        }
        // 4. Update Lead
        const previousScore = lead.current_score;
        let newScore = lead.current_score + points;
        // Cap score at 1000
        if (newScore > 1000)
            newScore = 1000;
        lead.current_score = newScore;
        yield lead.save();
        // Store Event
        const eventDoc = yield Event_1.default.create({
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
            yield ScoreHistory_1.default.create({
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
        console.log(`Processed ${event_type} for ${lead.email || lead.externalId}. Score: ${previousScore} -> ${lead.current_score}`);
    }
    catch (err) {
        console.error(`Error processing event ${eventId}:`, err);
        throw err;
    }
});
exports.processEventLogic = processEventLogic;
const initWorker = (io) => {
    // Listen to In-Memory Events
    eventQueue_1.eventEmitter.on('job', (job) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`[Memory] Received job ${job.id}`);
        try {
            yield (0, exports.processEventLogic)(job.data, io);
        }
        catch (e) {
            console.error('[Memory] Job failed', e);
        }
    }));
    // Listen to Redis Events
    try {
        const worker = new bullmq_1.Worker('event-processing-queue', (job) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, exports.processEventLogic)(job.data, io);
        }), { connection });
        worker.on('completed', (job) => {
            // console.log(`Job ${job.id} has completed!`);
        });
        worker.on('failed', (job, err) => {
            console.error(`Job ${job === null || job === void 0 ? void 0 : job.id} has failed with ${err.message}`);
        });
        // Handle connection errors specifically to avoid crash
        worker.on('error', (err) => {
            console.warn('redis worker connection error:', err.code);
        });
        console.log('Event Worker initialized (Redis + Memory)');
    }
    catch (err) {
        console.warn('Could not initialize Redis Worker. Running in Memory-Only mode.');
    }
};
exports.initWorker = initWorker;
