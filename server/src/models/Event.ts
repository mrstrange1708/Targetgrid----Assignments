import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
    eventId: string;
    source: string;
    event_type: string;
    timestamp: Date;
    metadata: any;
    lead_id?: mongoose.Schema.Types.ObjectId;
    processed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema: Schema = new Schema(
    {
        eventId: { type: String, required: true, unique: true },
        source: { type: String, required: true },
        event_type: { type: String, required: true },
        timestamp: { type: Date, required: true },
        metadata: { type: Schema.Types.Mixed },
        lead_id: { type: Schema.Types.ObjectId, ref: 'Lead' },
        processed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
