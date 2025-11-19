// backend/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  deleteUser,
  forceDeleteUser,
} from "../controllers/AuthController.js";
import { validateRegister, validateLogin, authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validateRegister, registerUser); // register
router.post("/login", validateLogin, loginUser); // login
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.delete("/users/:id", authenticate, authorizeRoles("admin"), deleteUser); // soft delete
router.delete("/users/:id/force", authenticate, authorizeRoles("admin"), forceDeleteUser); // force delete

export default router;
