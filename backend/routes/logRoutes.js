import express from "express";
import { getAllLogs, getLogsByUser, deleteLog } from "../controllers/logController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin"), getAllLogs);// Admin → get all logs
router.get("/user/:userId", authenticate, authorizeRoles("admin"), getLogsByUser);// Admin → get logs for a user
router.delete("/:logId", authenticate, authorizeRoles("admin"), deleteLog);// Admin → delete a log entry

export default router;
