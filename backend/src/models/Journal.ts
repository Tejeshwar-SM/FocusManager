import mongoose, {Document, mongo, Schema} from "mongoose";

//journal interface
export interface IJournalEntry extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

//journal entry schema
const JournalSchema = new Schema<IJournalEntry>(
    {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,  
        },
        title: {
            type: String,
            required: [true, "Please provide a journal title"],
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Please enter some text"],
        },
    },
    {timestamps:true}
);

JournalSchema.index({user:1, createdAt: -1});

export default mongoose.model<IJournalEntry>("Journal Entry", JournalSchema);