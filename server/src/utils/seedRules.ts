import ScoringRule from '../models/ScoringRule';

export const seedRules = async () => {
    const rules = [
        { event_type: 'EMAIL_OPEN', points: 10 },
        { event_type: 'PAGE_VIEW', points: 5 },
        { event_type: 'FORM_SUBMISSION', points: 20 },
        { event_type: 'DEMO_REQUEST', points: 50 },
        { event_type: 'PURCHASE', points: 100 },
    ];

    for (const rule of rules) {
        const exists = await ScoringRule.findOne({ event_type: rule.event_type });
        if (!exists) {
            await ScoringRule.create(rule);
            console.log(`Seeded rule: ${rule.event_type}`);
        }
    }
};
