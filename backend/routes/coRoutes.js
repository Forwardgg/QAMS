// routes/coRoutes.js
import express from "express";
import {
  createCO,
  getCOsByCourse,
  getAllCoursesWithCOs,
  updateCO,
  deleteCO,
} from "../controllers/coController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/course/:courseId", authenticate, authorizeRoles("admin", "instructor"), createCO); // create CO
router.get("/by-course/:courseId", getCOsByCourse);  // Get COs for one course
router.get("/", getAllCoursesWithCOs);               // Get all courses with COs
router.put("/outcome/:coId", authenticate, authorizeRoles("admin", "instructor"), updateCO); // update CO
router.delete("/outcome/:coId", authenticate, authorizeRoles("admin", "instructor"), deleteCO); // delete CO

export default router;
