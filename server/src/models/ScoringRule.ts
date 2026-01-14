import mongoose, { Document, Schema } from 'mongoose';

export interface IScoringRule extends Document {
    event_type: string; // e.g. "email_open"
    points: number;
    active: boolean;
}

const ScoringRuleSchema: Schema = new Schema(
    {
        event_type: { type: String, required: true, unique: true },
        points: { type: Number, required: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IScoringRule>('ScoringRule', ScoringRuleSchema, 'scoring_rules');
