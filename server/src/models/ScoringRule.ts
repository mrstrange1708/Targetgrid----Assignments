import mongoose, { Document, Schema } from 'mongoose';

export interface IScoringRule extends Document {
    eventType: string; // e.g. "email_open"
    points: number;
    active: boolean;
}

const ScoringRuleSchema: Schema = new Schema(
    {
        eventType: { type: String, required: true, unique: true },
        points: { type: Number, required: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IScoringRule>('ScoringRule', ScoringRuleSchema);
