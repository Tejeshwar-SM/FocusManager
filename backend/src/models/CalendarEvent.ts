import mongoose, {Document, Schema} from "mongoose";

//define event type
export enum EventType {
    POMODORO = "pomodoro",
    MEETING = "meeting",
    REMINDER = "reminder",
}

//calendar event interface
export interface ICalendarEvent extends Document {
    user: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    eventType: EventType;
    createdAt: Date;
    updatedAt: Date;
}

//calendar event schema
const CalendarEventSchema = new Schema<ICalendarEvent>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Please provide event title"],
        },
        description: {
            type: String,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        eventType: {
            type: String,
            enum: Object.values(EventType),
            required: true,
        }
    },
    {timestamps: true}
);

CalendarEventSchema.index({user: 1, startTime: 1});

export default mongoose.model<ICalendarEvent>("Calendar Event", CalendarEventSchema);