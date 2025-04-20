import jwt from "jsonwebtoken";

// Ensure environment variables are loaded
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  console.error("JWT secrets not found in environment variables!");
}

//access token- short lived
export const generateAccessToken = (userId: string): string => {
  if (!ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not defined in environment variables");
  }
  
  return jwt.sign({ id: userId }, ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

//refresh token- long lived
export const generateRefreshToken = (userId: string): string => {
  if (!REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
  }
  
  return jwt.sign({ id: userId }, REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    if (!REFRESH_SECRET) {
      console.error("JWT_REFRESH_SECRET is not defined in environment variables");
      return null;
    }
    
    const decoded = jwt.verify(
      token,
      REFRESH_SECRET
    ) as { id: string };
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
};

// Verify access token (useful for utility functions)
export const verifyAccessToken = (token: string): { id: string } | null => {
  try {
    if (!ACCESS_SECRET) {
      console.error("JWT_ACCESS_SECRET is not defined in environment variables");
      return null;
    }
    
    const decoded = jwt.verify(
      token,
      ACCESS_SECRET
    ) as { id: string };
    return decoded;
  } catch (error) {
    return null;
  }
};