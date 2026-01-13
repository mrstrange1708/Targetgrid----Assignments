import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
    name: string;
    email: string;
    company: string;
    score: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        company: { type: String },
        score: { type: Number, default: 0 },
        status: { type: String, default: 'new' }, // new, active, qualified, customer
    },
    { timestamps: true }
);

export default mongoose.model<ILead>('Lead', LeadSchema);
