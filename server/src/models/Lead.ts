import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
    name: string;
    email: string;
    company: string;
    current_score: number;
    externalId?: string; // To store lead_id from CSVs
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        company: { type: String },
        current_score: { type: Number, default: 0 },
        externalId: { type: String, unique: true, sparse: true },
        status: { type: String, default: 'new' }, // new, active, qualified, customer
    },
    { timestamps: true }
);

export default mongoose.model<ILead>('Lead', LeadSchema);
