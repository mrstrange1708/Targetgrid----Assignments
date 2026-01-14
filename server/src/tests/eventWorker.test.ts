import { Server } from 'socket.io';
import Lead from '../models/Lead';
import Event from '../models/Event';
import ScoringRule from '../models/ScoringRule';
import ScoreHistory from '../models/ScoreHistory';
import { processEventLogic } from '../queue/eventWorker';

// Mock dependencies
jest.mock('../models/Lead');
jest.mock('../models/Event');
jest.mock('../models/ScoringRule');
jest.mock('../models/ScoreHistory');

describe('Event Worker - processEventLogic', () => {
    let mockIo: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockIo = {
            emit: jest.fn(),
        };
    });

    test('should process a new event and create a lead via email', async () => {
        const eventData = {
            eventId: 'evt_1',
            event_type: 'EMAIL_OPEN',
            source: 'test',
            timestamp: new Date(),
            metadata: { email: 'test@example.com', name: 'Test User' }
        };

        (Event.findOne as jest.Mock).mockResolvedValue(null);
        (Lead.findOne as jest.Mock).mockResolvedValue(null);

        const mockLead = {
            _id: 'lead_id_1',
            email: 'test@example.com',
            name: 'Test User',
            current_score: 0,
            save: jest.fn().mockResolvedValue(true),
        };
        (Lead.create as jest.Mock).mockResolvedValue(mockLead);
        (ScoringRule.findOne as jest.Mock).mockResolvedValue({ points: 10 });
        (Event.create as jest.Mock).mockResolvedValue({ _id: 'event_doc_1' });

        await processEventLogic(eventData, mockIo as unknown as Server);

        expect(Lead.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
        expect(mockLead.current_score).toBe(10);
        expect(mockLead.save).toHaveBeenCalled();
        expect(mockIo.emit).toHaveBeenCalledWith('score-update', expect.objectContaining({ score: 10 }));
        expect(ScoreHistory.create).toHaveBeenCalledWith(expect.objectContaining({ score: 10, scoreChange: 10 }));
    });

    test('should identify lead by externalId (lead_id from CSV)', async () => {
        const eventData = {
            eventId: 'evt_2',
            event_type: 'PAGE_VIEW',
            source: 'batch',
            timestamp: new Date(),
            metadata: { lead_id: 'lead_1001' }
        };

        (Event.findOne as jest.Mock).mockResolvedValue(null);
        (Lead.findOne as jest.Mock).mockResolvedValue({
            _id: 'lead_db_id',
            externalId: 'lead_1001',
            current_score: 50,
            save: jest.fn().mockResolvedValue(true),
        });
        (ScoringRule.findOne as jest.Mock).mockResolvedValue({ points: 5 });
        (Event.create as jest.Mock).mockResolvedValue({ _id: 'event_doc_2' });

        await processEventLogic(eventData, mockIo as unknown as Server);

        expect(Lead.findOne).toHaveBeenCalledWith({ externalId: 'lead_1001' });
        expect(ScoreHistory.create).toHaveBeenCalledWith(expect.objectContaining({ score: 55 }));
    });

    test('should mark as orphan if no lead identified', async () => {
        const eventData = {
            eventId: 'evt_orphan',
            event_type: 'UNKNOWN_TYPE',
            source: 'test',
            timestamp: new Date(),
            metadata: { some: 'data' }
        };

        (Event.findOne as jest.Mock).mockResolvedValue(null);
        (Lead.findOne as jest.Mock).mockResolvedValue(null);

        await processEventLogic(eventData, mockIo as unknown as Server);

        expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({ processed: false }));
        expect(mockIo.emit).not.toHaveBeenCalled();
    });

    test('should handle idiosyncratic metadata (nested metadata)', async () => {
        const eventData = {
            eventId: 'evt_nested',
            event_type: 'PURCHASE',
            source: 'test',
            timestamp: new Date(),
            metadata: {
                metadata: { email: 'nested@example.com', amount: 999 }
            }
        };

        (Event.findOne as jest.Mock).mockResolvedValue(null);
        (Lead.findOne as jest.Mock).mockResolvedValue(null);
        const mockLead = {
            _id: 'lead_nested',
            email: 'nested@example.com',
            current_score: 0,
            save: jest.fn().mockResolvedValue(true),
        };
        (Lead.create as jest.Mock).mockResolvedValue(mockLead);
        (ScoringRule.findOne as jest.Mock).mockResolvedValue({ points: 100 });

        await processEventLogic(eventData, mockIo as unknown as Server);

        expect(Lead.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'nested@example.com' }));
        expect(mockLead.current_score).toBe(100);
    });
});
