import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, IUser } from '../types/auth.types';

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        
        if (authHeader?.startsWith('Bearer')) {
            token = authHeader.split(' ')[1];
        }
        
        if (!token) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password') as IUser;

        if (!user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized' });
    }
};