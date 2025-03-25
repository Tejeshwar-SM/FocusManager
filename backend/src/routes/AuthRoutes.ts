import express from "express";
import { register, login, refreshAccessToken, logout } from "../controllers/AuthController";

const router = express.Router();

//Register a new user POST /api/auth/register
router.post("/register", register);
//login user POST /api/auth/login
router.post("/login", login);

//POST /api/auth/refreshtoken to refresh accesss token
router.post("/refreshtoken", refreshAccessToken);

//POST /api/auth/logout to logout user
router.post("/logout", logout);
 
export default router;
