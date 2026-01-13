import ScoringRule from '../models/ScoringRule';

export const seedRules = async () => {
    const rules = [
        { eventType: 'email_open', points: 10 },
        { eventType: 'page_view', points: 5 },
        { eventType: 'form_submission', points: 20 },
        { eventType: 'demo_request', points: 50 },
        { eventType: 'purchase', points: 100 },
    ];

    for (const rule of rules) {
        const exists = await ScoringRule.findOne({ eventType: rule.eventType });
        if (!exists) {
            await ScoringRule.create(rule);
            console.log(`Seeded rule: ${rule.eventType}`);
        }
    }
};
