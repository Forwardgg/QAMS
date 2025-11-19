import express from "express";
import {
  createUser,
  getAllUsers,
  getTotalUsers,
  getUserCountsByRole,
  getTotalInstructors,
  deactivateUser,
  activateUser,
  updateUser,
  updateUserPassword,
} from "../controllers/UserController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticate, authorizeRoles("admin"), createUser); // Create user
router.get("/", authenticate, authorizeRoles("admin"), getAllUsers); // Get all users
router.get("/stats/total", authenticate, authorizeRoles("admin"), getTotalUsers); // Get total users count
router.get("/stats/roles", authenticate, authorizeRoles("admin"), getUserCountsByRole); // Get user counts by role
router.get("/stats/instructors", authenticate, authorizeRoles("admin"), getTotalInstructors); // Get total instructors
router.patch("/:userId/deactivate", authenticate, authorizeRoles("admin"), deactivateUser); // Deactivate user
router.patch("/:userId/activate", authenticate, authorizeRoles("admin"), activateUser); // Activate user
router.put("/:userId", authenticate, authorizeRoles("admin"), updateUser); // Update user
router.patch("/:userId/password", authenticate, authorizeRoles("admin"), updateUserPassword); // Update user password
router.patch("/me/password", authenticate, updateUserPassword); // Update own password

export default router;