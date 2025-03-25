import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { deflate } from 'zlib';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGO_URI as string;

        if(!mongoURI) {
            throw new Error('MongoDB URI not defined in env variables');
        }
        const options = {
            autoIndex: true,
        };

        await mongoose.connect(mongoURI, options);

        console.error('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection err: ', error);
        process.exit(1);
    }
};

export default connectDB;