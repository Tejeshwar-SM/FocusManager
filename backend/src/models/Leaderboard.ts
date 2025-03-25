import mongoose, {Document, Schema} from "mongoose";

//leaderboard interface
export interface ILeaderBoard extends Document {
    user: mongoose.Types.ObjectId;
    rank: number;
    completedPomodoroSessions: number;
    totalTasksCompleted: number;
    updatedAt: Date;
}

//leaderboard schema
const LeaderboardSchema = new Schema<ILeaderBoard>(
    {
        user:{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rank:{
            type: Number,
            required: true,
            default: 0,
        },
        completedPomodoroSessions:{
            type: Number,
            default: 0,
        },
        totalTasksCompleted:{
            type: Number,
            default: 0,
        },
    },
    {timestamps: true}
);

LeaderboardSchema.index({ completedPomodoroSessions: -1,totalTasksCompleted:-1 });

export default mongoose.model<ILeaderBoard>("LeaderBoard", LeaderboardSchema);
