import mongoose, { Document, Schema } from 'mongoose';

export interface IScoreHistory extends Document {
    leadId: mongoose.Schema.Types.ObjectId;
    scoreChange: number;
    newScore: number;
    reason: string; // e.g. "Event: email_open"
    eventId?: mongoose.Schema.Types.ObjectId;
    timestamp: Date;
}

const ScoreHistorySchema: Schema = new Schema(
    {
        leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
        scoreChange: { type: Number, required: true },
        newScore: { type: Number, required: true },
        reason: { type: String, required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
        timestamp: { type: Date, default: Date.now },
    }
);

export default mongoose.model<IScoreHistory>('ScoreHistory', ScoreHistorySchema);
