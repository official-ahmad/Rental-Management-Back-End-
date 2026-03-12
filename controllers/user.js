const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// --- REGISTER LOGIC ---
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    const userExist = await User.findOne({ email, role });
    if (userExist)
      return res
        .status(400)
        .json({ message: "Email already registered for this role" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- LOGIN LOGIC ---
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!role) return res.status(400).json({ message: "Role is required" });

    const user = await User.findOne({ email, role });
    if (!user)
      return res.status(404).json({ message: "User not found for this role" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- VERIFY ACCESS KEY (shared for admin & page access) ---
const verifyAccessKey = (envKey) => async (req, res) => {
  try {
    const { accessKey } = req.body;

    if (!accessKey) {
      return res
        .status(400)
        .json({ success: false, message: "Access key is required" });
    }

    if (accessKey === process.env[envKey]) {
      return res.status(200).json({ success: true, message: "Access granted" });
    }

    return res
      .status(401)
      .json({ success: false, message: "Invalid access key" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyAdminAccess = verifyAccessKey("ADMIN_ACCESS_KEY");
exports.verifyPageAccess = verifyAccessKey("PAGE_ACCESS_KEY");

// --- ADMIN LOGIN (Static Credentials) ---
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email !== adminEmail) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (password !== adminPassword) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: "admin_static_id", role: "Admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      success: true,
      token,
      adminId: "admin_static_id",
      adminName: "System Admin",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    // Block admin password reset
    if (role === "Admin") {
      return res.status(403).json({
        message: "Password cannot be reset. Contact Developer to access it.",
      });
    }

    const user = await User.findOne({ email, role });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email for this role" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Build reset URL
    const frontendURL =
      process.env.FRONTEND_URL ||
      "https://rental-management-front-end.vercel.app";
    const resetURL = `${frontendURL}/reset-password/${resetToken}?role=${role}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"RentManager" <${process.env.ADMIN_EMAIL}>`,
      to: email,
      subject: "Password Reset - RentManager",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Password Reset</h2>
          <p style="color: #64748b;">You requested a password reset for your <strong>${role}</strong> account.</p>
          <a href="${resetURL}" style="display: inline-block; margin: 20px 0; padding: 14px 28px; background: #059669; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">Reset Password</a>
          <p style="color: #94a3b8; font-size: 13px;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

// --- RESET PASSWORD ---
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, role } = req.body;

    if (!password || !role) {
      return res
        .status(400)
        .json({ message: "Password and role are required" });
    }

    if (role === "Admin") {
      return res.status(403).json({
        message: "Password cannot be reset. Contact Developer to access it.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiry: { $gt: Date.now() },
      role,
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
