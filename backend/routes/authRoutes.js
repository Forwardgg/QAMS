// routes/authRoutes.js
import express from "express";
import { registerUser, loginUser } from "../controllers/AuthController.js";
import { validateRegister, validateLogin } from "../middleware/auth.js";

const router = express.Router();

// Public auth routes with validation
router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);

export default router;
