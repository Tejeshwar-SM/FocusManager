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
        .json({ success: false, message: "Not authorized, no token" });
      return;
    }
    console.log("recieved token:::", token);
    try {

      console.log("");
      // console.log("ACCESS SECRET", process.env.JWT_ACCESS_SECRET);

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as JwtPayload;
      console.log("decoded token", decoded);
      // Check if user exists
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        res.status(401).json({ success: false, message: "User not found" });
        return;
      }

      // Add user to request
      req.user = { id: decoded.id };
      next();
    } catch (error) {
      console.error(error);
      res
        .status(401)
        .json({ success: false, message: "Not authorized, token failed" });
      return;
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
