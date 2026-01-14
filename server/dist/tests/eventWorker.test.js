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
const Lead_1 = __importDefault(require("../models/Lead"));
const Event_1 = __importDefault(require("../models/Event"));
const ScoringRule_1 = __importDefault(require("../models/ScoringRule"));
const ScoreHistory_1 = __importDefault(require("../models/ScoreHistory"));
const eventWorker_1 = require("../queue/eventWorker");
// Mock dependencies
jest.mock('../models/Lead');
jest.mock('../models/Event');
jest.mock('../models/ScoringRule');
jest.mock('../models/ScoreHistory');
describe('Event Worker - processEventLogic', () => {
    let mockIo;
    beforeEach(() => {
        jest.clearAllMocks();
        mockIo = {
            emit: jest.fn(),
        };
    });
    test('should process a new event and create a lead via email', () => __awaiter(void 0, void 0, void 0, function* () {
        const eventData = {
            eventId: 'evt_1',
            event_type: 'EMAIL_OPEN',
            source: 'test',
            timestamp: new Date(),
            metadata: { email: 'test@example.com', name: 'Test User' }
        };
        Event_1.default.findOne.mockResolvedValue(null);
        Lead_1.default.findOne.mockResolvedValue(null);
        const mockLead = {
            _id: 'lead_id_1',
            email: 'test@example.com',
            name: 'Test User',
            current_score: 0,
            save: jest.fn().mockResolvedValue(true),
        };
        Lead_1.default.create.mockResolvedValue(mockLead);
        ScoringRule_1.default.findOne.mockResolvedValue({ points: 10 });
        Event_1.default.create.mockResolvedValue({ _id: 'event_doc_1' });
        yield (0, eventWorker_1.processEventLogic)(eventData, mockIo);
        expect(Lead_1.default.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
        expect(mockLead.current_score).toBe(10);
        expect(mockLead.save).toHaveBeenCalled();
        expect(mockIo.emit).toHaveBeenCalledWith('score-update', expect.objectContaining({ score: 10 }));
        expect(ScoreHistory_1.default.create).toHaveBeenCalledWith(expect.objectContaining({ score: 10, scoreChange: 10 }));
    }));
    test('should identify lead by externalId (lead_id from CSV)', () => __awaiter(void 0, void 0, void 0, function* () {
        const eventData = {
            eventId: 'evt_2',
            event_type: 'PAGE_VIEW',
            source: 'batch',
            timestamp: new Date(),
            metadata: { lead_id: 'lead_1001' }
        };
        Event_1.default.findOne.mockResolvedValue(null);
        Lead_1.default.findOne.mockResolvedValue({
            _id: 'lead_db_id',
            externalId: 'lead_1001',
            current_score: 50,
            save: jest.fn().mockResolvedValue(true),
        });
        ScoringRule_1.default.findOne.mockResolvedValue({ points: 5 });
        Event_1.default.create.mockResolvedValue({ _id: 'event_doc_2' });
        yield (0, eventWorker_1.processEventLogic)(eventData, mockIo);
        expect(Lead_1.default.findOne).toHaveBeenCalledWith({ externalId: 'lead_1001' });
        expect(ScoreHistory_1.default.create).toHaveBeenCalledWith(expect.objectContaining({ score: 55 }));
    }));
    test('should mark as orphan if no lead identified', () => __awaiter(void 0, void 0, void 0, function* () {
        const eventData = {
            eventId: 'evt_orphan',
            event_type: 'UNKNOWN_TYPE',
            source: 'test',
            timestamp: new Date(),
            metadata: { some: 'data' }
        };
        Event_1.default.findOne.mockResolvedValue(null);
        Lead_1.default.findOne.mockResolvedValue(null);
        yield (0, eventWorker_1.processEventLogic)(eventData, mockIo);
        expect(Event_1.default.create).toHaveBeenCalledWith(expect.objectContaining({ processed: false }));
        expect(mockIo.emit).not.toHaveBeenCalled();
    }));
    test('should handle idiosyncratic metadata (nested metadata)', () => __awaiter(void 0, void 0, void 0, function* () {
        const eventData = {
            eventId: 'evt_nested',
            event_type: 'PURCHASE',
            source: 'test',
            timestamp: new Date(),
            metadata: {
                metadata: { email: 'nested@example.com', amount: 999 }
            }
        };
        Event_1.default.findOne.mockResolvedValue(null);
        Lead_1.default.findOne.mockResolvedValue(null);
        const mockLead = {
            _id: 'lead_nested',
            email: 'nested@example.com',
            current_score: 0,
            save: jest.fn().mockResolvedValue(true),
        };
        Lead_1.default.create.mockResolvedValue(mockLead);
        ScoringRule_1.default.findOne.mockResolvedValue({ points: 100 });
        yield (0, eventWorker_1.processEventLogic)(eventData, mockIo);
        expect(Lead_1.default.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'nested@example.com' }));
        expect(mockLead.current_score).toBe(100);
    }));
});
