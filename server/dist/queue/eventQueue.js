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
exports.addEventToQueue = exports.eventEmitter = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
const events_1 = require("events");
dotenv_1.default.config();
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
exports.eventEmitter = new events_1.EventEmitter();
let useRedis = true;
let eventQueue = null;
const createQueue = () => {
    try {
        const q = new bullmq_1.Queue('event-processing-queue', {
            connection,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
            }
        });
        q.on('error', (err) => {
            console.warn('Redis connection issue:', err.code);
        });
        return q;
    }
    catch (err) {
        return null;
    }
};
eventQueue = createQueue();
const addEventToQueue = (eventData) => __awaiter(void 0, void 0, void 0, function* () {
    if (useRedis && eventQueue) {
        try {
            yield eventQueue.add('process-event', eventData);
        }
        catch (err) {
            console.warn('Redis unreachable. Switching to In-Memory for this event.');
            useRedis = false;
            exports.eventEmitter.emit('job', { data: eventData, id: 'mem-' + Date.now() });
        }
    }
    else {
        exports.eventEmitter.emit('job', { data: eventData, id: 'mem-' + Date.now() });
    }
});
exports.addEventToQueue = addEventToQueue;
