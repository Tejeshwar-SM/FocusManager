import jwt from "jsonwebtoken";

//access token- short lived
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: "15m",
  });
};

//refresh token- long lived
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET as string
    ) as { id: string };
    return decoded;
  } catch (error) {
    return null;
  }
};
