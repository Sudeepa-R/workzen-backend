import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description: string;
    status: 'pending' | 'completed';
    dueDate: Date;
    owner: String;
    createdAt: Date;
}

const taskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        dueDate: { type: Date },
        owner: { type: String, ref: 'User', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Indexing for performance as requested
taskSchema.index({ owner: 1 });
taskSchema.index({ status: 1 });

export default mongoose.model<ITask>('Task', taskSchema);
