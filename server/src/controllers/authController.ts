import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../types/auth.types';

export const register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password, name } = req.body;
      const userExists = await User.findOne({ email });
      if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }
      const user = await User.create({ email, password, name });
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '30d' }
      );
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      });
      return;
    } catch (error) {
      next(error);
    }
  };
  

  export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '30d' }
      );
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      });
      return;
    } catch (error) {
      next(error);
    }
  };
  
  export const getCurrentUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.findById(req.user?._id).select('-password');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(user);
      return;
    } catch (error) {
      next(error);
    }
  };
  