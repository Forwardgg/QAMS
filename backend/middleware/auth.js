// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Authenticate middleware
 * - Expects Authorization: Bearer <token>
 * - Verifies JWT and fetches user from DB to ensure user exists & is active
 * - Attaches safe `req.user = { user_id, role }`
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Accept "Bearer <token>" case-insensitively and allow extra whitespace
    const parts = String(authHeader).trim().split(/\s+/);
    if (parts.length !== 2) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [schemeRaw, token] = parts;
    if (!schemeRaw || String(schemeRaw).toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // If JWT secret is missing, this is a server configuration error (500).
    if (!process.env.JWT_SECRET) {
      console.error("Auth configuration error: JWT_SECRET is not configured.");
      return res.status(500).json({ error: "Authentication not configured" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (err) {
      // Token invalid or expired
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Coerce user_id to integer before calling model (model validates integer)
    const userId = Number.parseInt(decoded.user_id, 10);
    if (Number.isNaN(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach minimal safe user info
    req.user = { user_id: user.user_id, role: user.role };
    return next();
  } catch (err) {
    console.error("Auth error:", err);
    // If we get here it's unexpected — hide internal details from client
    return res.status(500).json({ error: "Authentication failure" });
  }
};

/**
 * Role-based authorization
 * Usage: authorizeRoles("admin"), authorizeRoles("admin", "moderator")
 */
export const authorizeRoles = (...roles) => {
  // normalize the allowed roles for comparisons
  const allowed = roles.map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const userRole = String(req.user.role).toLowerCase();
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };
};

/**
 * Validate registration payload
 * - Uses User.allowedRoles as source of truth (excludes "admin" from public registration)
 * - Normalizes role into req.body.role (lowercase)
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (typeof password !== "string" || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email))) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const roleNormalized = String(role).toLowerCase();

  // derive allowed roles from User model, exclude admin for public registration
  const registrableRoles = Array.isArray(User.allowedRoles)
    ? User.allowedRoles.map((r) => String(r).toLowerCase()).filter((r) => r !== "admin")
    : ["instructor", "moderator"];

  if (!registrableRoles.includes(roleNormalized)) {
    return res.status(400).json({
      error: `Invalid role. Allowed: ${registrableRoles.join(", ")}`,
    });
  }

  // normalize role in request body so downstream code can rely on it
  req.body.role = roleNormalized;
  return next();
};

/**
 * Validate login payload
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  return next();
};
