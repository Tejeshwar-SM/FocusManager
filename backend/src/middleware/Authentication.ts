import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

// Interface for JWT payload
interface JwtPayload {
  id: string;
}

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

// Protect routes - middleware to check if user is authenticated
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Get token from header - format "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      res
        .status(401)
        .json({ 
          success: false, 
          message: "Not authorized, no token",
          expired: true
        });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as JwtPayload;
      
      // Check if user exists
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ 
          success: false, 
          message: "User not found",
          expired: true 
        });
        return;
      }

      // Add user to request
      req.user = { id: decoded.id };
      next();
    } catch (error: any) {
      console.error("Token verification error:", error.message);
      
      // Send clearer error message based on error type
      if (error.name === "TokenExpiredError") {
        res.status(401).json({ 
          success: false, 
          message: "Token expired, please login again", 
          expired: true 
        });
      } else if (error.name === "JsonWebTokenError") {
        res.status(401).json({ 
          success: false, 
          message: "Invalid token format", 
          expired: true 
        });
      } else {
        res.status(401).json({ 
          success: false, 
          message: "Not authorized, token verification failed", 
          expired: true 
        });
      }
      return;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};