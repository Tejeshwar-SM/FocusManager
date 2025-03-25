import mongoose, { Document, mongo, Schema } from "mongoose";
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    joinDate: Date;
    lastActive: Date;
    refreshToken?: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

//uesr schema
const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email : {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    },
    refreshToken: {
        type: String
    }
});

//hashing password before saving
UserSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error:any) {
        next(error);
    }
});

//comparing passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);