import express from "express";
import { register, login, getCurrentUser, refreshAccessToken, logout } from "../controllers/AuthController";
import { protect } from "../middleware/Authentication";

const router = express.Router();

//Register a new user POST /api/auth/register
router.post("/register", register);
//login user POST /api/auth/login
router.post("/login", login);

router.get('/me',protect, getCurrentUser);

//POST /api/auth/refreshtoken to refresh accesss token
router.post("/refreshToken", refreshAccessToken);

//POST /api/auth/logout to logout user
router.post("/logout", logout);
 
export default router;
