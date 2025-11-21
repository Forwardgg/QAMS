// backend/controllers/AuthController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

function ensureEnv(name, value) {
  if (!value) {
    // Fail fast with a clear runtime error to help during deployment
    throw new Error(`Missing required env var: ${name}`);
  }
}

try {
  // Ensure required secrets exist at module load time (so app fails fast if misconfigured)
  ensureEnv("JWT_SECRET", process.env.JWT_SECRET);
  ensureEnv("JWT_RESET_SECRET", process.env.JWT_RESET_SECRET);
} catch (err) {
  // rethrow so the app will fail to start if env is missing
  // If you want to allow missing values in certain environments, remove/adjust this block.
  throw err;
}

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "name, email, password and role are required" });
  }

  try {
    // check if email already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const roleNormalized = String(role).toLowerCase();

    // derive allowed registration roles from model (exclude admin from public registration)
    const registrableRoles = Array.isArray(User.allowedRoles)
      ? User.allowedRoles.filter((r) => r !== "admin")
      : ["instructor", "moderator"];

    if (!registrableRoles.includes(roleNormalized)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    let user;
    try {
      user = await User.create({ name, email, passwordHash, role: roleNormalized });
    } catch (err) {
      // handle unique constraint race / DB error for email
      if (err && err.message === "EMAIL_ALREADY_IN_USE") {
        return res.status(409).json({ error: "Email already registered" });
      }
      throw err;
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" }
    );

    res.status(201).json({
      tokenType: "Bearer",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err?.message ?? err);
    res.status(500).json({ error: "Server error during registration" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const user = await User.findByEmail(email);

    // If user not found or inactive, do not reveal which — return 401
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" }
    );

    res.json({
      tokenType: "Bearer",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err?.message ?? err);
    res.status(500).json({ error: "Server error during login" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body ?? {};
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      // Do not reveal whether email exists
      return res.status(200).json({ message: "If email exists, reset link sent" });
    }

    const resetToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_RESET_SECRET,
      { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m", algorithm: "HS256" }
    );

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // NOTE: in production replace this with an email send. Avoid logging reset links in prod logs.
    console.info(`Password reset link for ${email}: ${resetLink}`);

    return res.status(200).json({ message: "If email exists, reset link sent" });
  } catch (err) {
    console.error("Forgot password error:", err?.message ?? err);
    res.status(500).json({ error: "Server error during password reset request" });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const userId = Number.parseInt(decoded.user_id, 10);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await User.updatePassword(userId, passwordHash);

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err?.message ?? err);
    res.status(500).json({ error: "Server error during password reset" });
  }
};

// soft delete user
export const deleteUser = async (req, res) => {
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  try {
    const user = await User.softDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // If you want to track which actor performed the deletion, ensure your auth middleware
    // populates req.user and then log/emit that event elsewhere in your app.
    const actor = req.user && req.user.user_id ? { actorId: req.user.user_id } : null;

    return res.json({ message: "User deactivated successfully", user, actor });
  } catch (err) {
    console.error("Soft delete error:", err?.message ?? err);
    res.status(500).json({ error: "Server error during soft delete" });
  }
};

// hard delete with cascade
export const forceDeleteUser = async (req, res) => {
  const idRaw = req.params?.id;
  const id = Number.parseInt(idRaw, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid user id" });

  try {
    const user = await User.forceDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const actor = req.user && req.user.user_id ? { actorId: req.user.user_id } : null;

    return res.json({ message: "User permanently deleted", actor });
  } catch (err) {
    console.error("Force delete error:", err?.message ?? err);
    res.status(500).json({ error: "Server error during force delete" });
  }
};
