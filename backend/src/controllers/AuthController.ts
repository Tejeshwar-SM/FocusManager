import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils";
// import { accessSync } from "fs";

//register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    //check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }
    //create a new user
    const user = new User({ name, email, password }) as IUser & { _id: any };

    //generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    //set refresh token in http only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    //save refresh token in database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        accessToken,
      },
    });
    console.log("Generated Access TOken", accessToken);
    console.log("Generated Refresh Token", refreshToken);
    console.log("JWT Secret", process.env.JWT_ACCESS_SECRET);
    console.log("JWT Refresh Secret", process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//login a user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = (await User.findOne({ email })) as
      | (IUser & { _id: any })
      | null;
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    if (user && (await user.comparePassword(password))) {
      //update last active
      user.lastActive = new Date();

      //generate tokens
      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      //save refesh token in database
      user.refreshToken = refreshToken;
      await user.save();

      //set refresh token in http only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      });

      res.json({
        success: true,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          accessToken,
        },
      });
    } else {
      res.status(400).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // req.user is set by your auth middleware
    const user = await User.findById(req.user?.id).select("-password");

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//refresh access token
export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    //get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    //verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    //check if user exists and token is valid
    const user = (await User.findById(decoded.id)) as
      | (IUser & { _id: any })
      | null;

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    //generate new access token
    const accessToken = generateAccessToken(user._id.toString());
    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//logout a user
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    //get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      //find user with this refresh token and clear it
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }

    //clear the cookie
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
