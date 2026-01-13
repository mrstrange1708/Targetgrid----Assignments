export interface Lead {
    _id: string;
    name: string;
    email: string;
    company: string;
    score: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ScoringRule {
    _id: string;
    eventType: string;
    points: number;
    active: boolean;
}

export interface ScoreHistory {
    _id: string;
    leadId: string;
    scoreChange: number;
    newScore: number;
    reason: string;
    eventId?: any;
    timestamp: string;
}
