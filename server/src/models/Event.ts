import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
    eventId: string;
    source: string;
    type: string;
    timestamp: Date;
    metadata: any;
    leadId?: mongoose.Schema.Types.ObjectId;
    processed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema: Schema = new Schema(
    {
        eventId: { type: String, required: true, unique: true },
        source: { type: String, required: true },
        type: { type: String, required: true },
        timestamp: { type: Date, required: true },
        metadata: { type: Schema.Types.Mixed },
        leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
        processed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
