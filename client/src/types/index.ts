export interface Lead {
    _id: string;
    name: string;
    email: string;
    company: string;
    current_score: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface ScoringRule {
    _id: string;
    event_type: string;
    points: number;
    active: boolean;
}

export interface ScoreHistory {
    _id: string;
    lead_id: string;
    scoreChange: number;
    score: number;
    reason: string;
    eventId?: any;
    timestamp: string;
}
