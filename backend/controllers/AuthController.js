// backend/controllers/AuthController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Log } from "../models/Log.js";

const allowedRoles = ["instructor", "moderator"]; // self-registration only

// === REGISTER ===
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if email already exists
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Validate role (no self-admins)
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Allowed: instructor, moderator" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const user = await User.create({ name, email, passwordHash, role });

    // Log registration
    await Log.create({
      userId: user.user_id,
      action: "REGISTER",
      details: `${user.role} ${user.user_id} registered`
    });

    // Auto-login → Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      tokenType: "Bearer",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
};

// === LOGIN ===
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Fetch user (only active ones)
    const user = await User.findByEmail(email);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Log login
    await Log.create({
      userId: user.user_id,
      action: "LOGIN",
      details: `${user.role} ${user.user_id} logged in`
    });

    res.json({
      tokenType: "Bearer",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};
