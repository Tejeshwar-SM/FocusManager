import { Request } from 'express';
import { Document } from 'mongoose';

export interface IUser extends Document {
    _id: string;
    email: string;
    password: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AuthRequest extends Request {
    user?: IUser;
    headers: {
        authorization?: string;
    } & Request['headers'];
}