import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//mongodb connection

connectDB();

app.get('/', (req:Request, res: Response) => {
    res.send('FM API is running fine!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;

