import mongoose from 'mongoose';
import Lead from './models/Lead';
import Event from './models/Event';
import ScoringRule from './models/ScoringRule';
import ScoreHistory from './models/ScoreHistory';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lead-scoring';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data (optional, but good for a fresh start)
        await Lead.deleteMany({});
        await Event.deleteMany({});
        await ScoreHistory.deleteMany({});
        // Don't clear scoring rules as they are seeded on startup

        // 1. Ensure Rules exist
        const rules = await ScoringRule.find();
        if (rules.length === 0) {
            console.log('No rules found. Please start the server first to seed rules.');
            process.exit(1);
        }

        // 2. Create Leads
        const leads = await Lead.create([
            {
                name: 'Alice Johnson',
                email: 'alice@microsoft.com',
                company: 'Microsoft',
                current_score: 150,
                externalId: 'lead_1001',
                status: 'qualified'
            },
            {
                name: 'Bob Smith',
                email: 'bob@google.com',
                company: 'Google',
                current_score: 45,
                externalId: 'lead_1002',
                status: 'new'
            },
            {
                name: 'Charlie Brown',
                email: 'charlie@apple.com',
                company: 'Apple',
                current_score: 90,
                externalId: 'lead_1003',
                status: 'active'
            }
        ]);

        console.log(`Seeded ${leads.length} leads.`);

        // 3. Create some events and history for Alice
        const alice = leads[0];
        const event1 = await Event.create({
            eventId: 'evt_alice_1',
            event_type: 'EMAIL_OPEN',
            source: 'manual',
            timestamp: new Date(Date.now() - 3600000 * 24), // 1 day ago
            metadata: { email: alice.email },
            lead_id: alice._id,
            processed: true
        });

        await ScoreHistory.create({
            lead_id: alice._id,
            scoreChange: 10,
            score: 10,
            reason: 'Event: EMAIL_OPEN',
            eventId: event1._id,
            timestamp: event1.timestamp
        });

        const event2 = await Event.create({
            eventId: 'evt_alice_2',
            event_type: 'PURCHASE',
            source: 'manual',
            timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
            metadata: { email: alice.email },
            lead_id: alice._id,
            processed: true
        });

        await ScoreHistory.create({
            lead_id: alice._id,
            scoreChange: 100,
            score: 110,
            reason: 'Event: PURCHASE',
            eventId: event2._id,
            timestamp: event2.timestamp
        });

        console.log('Seeded events and history.');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();
