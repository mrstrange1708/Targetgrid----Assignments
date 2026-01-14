import Lead from '../models/Lead';
import ScoringRule from '../models/ScoringRule';
import mongoose from 'mongoose';
import { processEventLogic } from '../queue/eventWorker';

// Mock Socket.io
const mockIo = {
    emit: jest.fn()
} as any;

describe('Scoring Logic Unit Tests', () => {
    beforeAll(async () => {
        // In a real scenario, we'd use a memory DB, 
        // but here we are testing the logic assuming DB works.
        // We will mock the Mongoose models for pure unit testing.
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should calculate score correctly based on active rules', async () => {
        const mockLead = {
            _id: 'lead123',
            email: 'test@example.com',
            current_score: 50,
            save: jest.fn().mockResolvedValue(true)
        };

        const mockRule = {
            event_type: 'PURCHASE',
            points: 100,
            active: true
        };

        jest.spyOn(Lead, 'findOne').mockResolvedValue(mockLead as any);
        jest.spyOn(ScoringRule, 'findOne').mockResolvedValue(mockRule as any);

        // Mocking Event creation and ScoreHistory creation to avoid DB calls
        const Event = require('../models/Event').default;
        const ScoreHistory = require('../models/ScoreHistory').default;
        jest.spyOn(Event, 'findOne').mockResolvedValue(null);
        jest.spyOn(Event, 'create').mockResolvedValue({ _id: 'event123' } as any);
        jest.spyOn(ScoreHistory, 'create').mockResolvedValue({} as any);

        await processEventLogic({
            eventId: 'evt_unit_1',
            event_type: 'PURCHASE',
            source: 'test',
            timestamp: new Date(),
            metadata: { email: 'test@example.com' }
        }, mockIo);

        expect(mockLead.current_score).toBe(150);
        expect(mockLead.save).toHaveBeenCalled();
    });

    it('should cap the score at 1000', async () => {
        const mockLead = {
            _id: 'lead123',
            email: 'test@example.com',
            current_score: 950,
            save: jest.fn().mockResolvedValue(true)
        };

        const mockRule = {
            event_type: 'PURCHASE',
            points: 100,
            active: true
        };

        jest.spyOn(Lead, 'findOne').mockResolvedValue(mockLead as any);
        jest.spyOn(ScoringRule, 'findOne').mockResolvedValue(mockRule as any);

        const Event = require('../models/Event').default;
        const ScoreHistory = require('../models/ScoreHistory').default;
        jest.spyOn(Event, 'findOne').mockResolvedValue(null);
        jest.spyOn(Event, 'create').mockResolvedValue({ _id: 'event123' } as any);
        jest.spyOn(ScoreHistory, 'create').mockResolvedValue({} as any);

        await processEventLogic({
            eventId: 'evt_unit_2',
            event_type: 'PURCHASE',
            source: 'test',
            timestamp: new Date(),
            metadata: { email: 'test@example.com' }
        }, mockIo);

        expect(mockLead.current_score).toBe(1000);
    });

    it('should handle negative points correctly', async () => {
        const mockLead = {
            _id: 'lead123',
            email: 'test@example.com',
            current_score: 100,
            save: jest.fn().mockResolvedValue(true)
        };

        const mockRule = {
            event_type: 'REFUND',
            points: -50,
            active: true
        };

        jest.spyOn(Lead, 'findOne').mockResolvedValue(mockLead as any);
        jest.spyOn(ScoringRule, 'findOne').mockResolvedValue(mockRule as any);

        const Event = require('../models/Event').default;
        const ScoreHistory = require('../models/ScoreHistory').default;
        jest.spyOn(Event, 'findOne').mockResolvedValue(null);
        jest.spyOn(Event, 'create').mockResolvedValue({ _id: 'event123' } as any);
        jest.spyOn(ScoreHistory, 'create').mockResolvedValue({} as any);

        await processEventLogic({
            eventId: 'evt_unit_3',
            event_type: 'REFUND',
            source: 'test',
            timestamp: new Date(),
            metadata: { email: 'test@example.com' }
        }, mockIo);

        expect(mockLead.current_score).toBe(50);
    });
});
