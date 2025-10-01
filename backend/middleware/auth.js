// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

// === JWT Middleware ===
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Invalid token format. Use Bearer <token>" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to check status
    const user = await User.findById(decoded.user_id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    req.user = { user_id: user.user_id, role: user.role };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// === Role-based Authorization ===
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

// === Validation Middleware ===
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  // Very basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (!["instructor", "moderator"].includes(role)) {
    return res.status(400).json({ error: "Invalid role. Allowed: instructor, moderator" });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  next();
};
