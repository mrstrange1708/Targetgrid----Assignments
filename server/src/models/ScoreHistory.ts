import mongoose, { Document, Schema } from 'mongoose';

export interface IScoreHistory extends Document {
    lead_id: mongoose.Schema.Types.ObjectId;
    scoreChange: number;
    score: number; // mapped from newScore
    reason: string; // e.g. "Event: email_open"
    eventId?: mongoose.Schema.Types.ObjectId;
    timestamp: Date;
}

const ScoreHistorySchema: Schema = new Schema(
    {
        lead_id: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
        scoreChange: { type: Number, required: true },
        score: { type: Number, required: true },
        reason: { type: String, required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
        timestamp: { type: Date, default: Date.now },
    }
);

export default mongoose.model<IScoreHistory>('ScoreHistory', ScoreHistorySchema);
