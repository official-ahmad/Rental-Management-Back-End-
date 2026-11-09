const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const https = require("https");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const {
  MAX_FAILURES,
  getStatus,
  recordFailure,
  clearFailures,
} = require("../middleware/adminLoginLimiter");

const sendResetEmailWithResend = ({ to, subject, html }) =>
  new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim() || process.env.ADMIN_EMAIL?.trim();

    if (!apiKey || !from) {
      reject(new Error("Resend email service is not configured"));
      return;
    }

    const request = https.request(
      {
        hostname: "api.resend.com",
        path: "/emails",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
      (response) => {
        let responseBody = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve();
            return;
          }

          const error = new Error(`Resend request failed with status ${response.statusCode}`);
          error.code = response.statusCode === 401 ? "EAUTH" : "ERESEND";
          error.responseBody = responseBody;
          reject(error);
        });
      },
    );

    request.on("timeout", () => request.destroy(new Error("Resend request timed out")));
    request.on("error", reject);
    request.end(JSON.stringify({ from, to, subject, html }));
  });

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

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!role) return res.status(400).json({ message: "Role is required" });

    const user = await User.findOne({ email, role });
    if (!user)
      return res.status(404).json({ message: "User not found for this role" });

    if (user.isSuspended) {
      return res.status(403).json({
        message: "You cannot login, Access is restricted by Admin.",
      });
    }

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

const verifyAccessKey = (envKey) => async (req, res) => {
  try {
    const { accessKey } = req.body;

    if (!accessKey) {
      return res.status(400).json({
        success: false,
        message: "Access key is required",
      });
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

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const status = getStatus(req);

    if (status.locked) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Try again in 15 minutes.",
        retryAfterSeconds: status.retryAfterSeconds,
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    let admin = await User.findOne({
      role: "Admin",
      email: adminEmail,
    });

    if (!admin) {
      if (email?.trim().toLowerCase() !== adminEmail) {
        const failed = recordFailure(req);
        if (failed.locked) {
          return res.status(429).json({
            success: false,
            message: "Too many failed attempts. Try again in 15 minutes.",
            retryAfterSeconds: failed.retryAfterSeconds,
          });
        }
        return res.status(404).json({
          success: false,
          message: "Admin not found",
          attemptsRemaining: Math.max(0, MAX_FAILURES - failed.failures),
        });
      }

      admin = await User.create({
        firstName: "System",
        lastName: "Admin",
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, 12),
        role: "Admin",
      });
    }

    if (email?.trim().toLowerCase() !== admin.email.toLowerCase()) {
      const failed = recordFailure(req);
      if (failed.locked) {
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Try again in 15 minutes.",
          retryAfterSeconds: failed.retryAfterSeconds,
        });
      }
      return res.status(404).json({
        success: false,
        message: "Admin not found",
        attemptsRemaining: Math.max(0, MAX_FAILURES - failed.failures),
      });
    }

    const passwordMatches = await bcrypt.compare(password || "", admin.password);
    if (!passwordMatches) {
      const failed = recordFailure(req);
      if (failed.locked) {
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Try again in 15 minutes.",
          retryAfterSeconds: failed.retryAfterSeconds,
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
        attemptsRemaining: Math.max(0, MAX_FAILURES - failed.failures),
      });
    }

    clearFailures(req);
    const token = jwt.sign(
      { id: admin._id.toString(), role: "Admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      success: true,
      token,
      adminId: admin._id,
      adminName: `${admin.firstName} ${admin.lastName}`.trim(),
      adminEmail: admin.email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
    const admin = await User.findOne({ _id: req.user.id, role: "Admin" }).select(
      "firstName lastName email phone role createdAt updatedAt",
    );
    if (!admin) return res.status(404).json({ message: "Admin profile not found" });
    res.json({ profile: admin });
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin profile" });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }
    const { firstName, lastName, email, phone, currentPassword, newPassword } =
      req.body;
    const admin = await User.findOne({ _id: req.user.id, role: "Admin" });
    if (!admin) return res.status(404).json({ message: "Admin profile not found" });

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "First name, last name and email are required",
      });
    }

    const emailExists = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "Admin",
      _id: { $ne: admin._id },
    });
    if (emailExists) {
      return res.status(409).json({ message: "Admin email is already in use" });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required" });
      }
      const currentMatches = await bcrypt.compare(currentPassword, admin.password);
      if (!currentMatches) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }
      admin.password = await bcrypt.hash(newPassword, 12);
    }

    admin.firstName = firstName.trim();
    admin.lastName = lastName.trim();
    admin.email = email.trim().toLowerCase();
    admin.phone = phone?.trim() || "";
    await admin.save();

    res.json({
      message: "Admin profile updated successfully",
      profile: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((validationError) => validationError.message)
          .join(". "),
      });
    }
    if (error.code === 11000) {
      return res.status(409).json({ message: "Admin email is already in use" });
    }
    console.error("Admin profile update error:", error);
    res.status(500).json({ message: "Failed to update admin profile" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Email and role are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, role });
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email for this role" });
    }
    const useResend = Boolean(process.env.RESEND_API_KEY?.trim());
    if (
      !useResend &&
      (!process.env.ADMIN_EMAIL ||
        !process.env.EMAIL_APP_PASSWORD ||
        process.env.EMAIL_APP_PASSWORD.includes("paste_your"))
    ) {
      return res.status(503).json({
        message: "Email service is not configured. Add RESEND_API_KEY or a Gmail App Password.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const subject = "Your Rentify password reset OTP";
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f8fafc; border-radius: 16px;">
          <h2 style="color: #0f172a; margin-bottom: 8px;">Password reset OTP</h2>
          <p style="color: #64748b;">Use this one-time code to reset your <strong>${role}</strong> account password.</p>
          <div style="margin: 24px 0; padding: 18px; text-align: center; background: #0f172a; color: #fff; border-radius: 12px; font-size: 32px; letter-spacing: 10px; font-weight: bold;">${otp}</div>
          <p style="color: #94a3b8; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `;

    if (useResend) {
      await sendResetEmailWithResend({
        from: process.env.EMAIL_FROM?.trim() || process.env.ADMIN_EMAIL?.trim(),
        to: normalizedEmail,
        subject,
        html,
      });
    } else {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: process.env.ADMIN_EMAIL?.trim(),
          pass: process.env.EMAIL_APP_PASSWORD?.replace(/\s/g, ""),
        },
      });

      await transporter.sendMail({
        from: `"RentManager" <${process.env.ADMIN_EMAIL}>`,
        to: normalizedEmail,
        subject,
        html,
      });
    }

    user.resetOtpHash = otpHash;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000;
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    if (
      ["EAUTH", "ECONNECTION", "ETIMEDOUT", "EDNS", "ESOCKET", "ERESEND"].includes(
        error.code,
      )
    ) {
      return res.status(503).json({
        message: "Unable to send the reset email. Please verify the configured email service.",
      });
    }
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, role, otp } = req.body;
    if (!email || !role || !/^\d{6}$/.test(String(otp || ""))) {
      return res.status(400).json({ message: "Email, role and a valid 6-digit OTP are required" });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role,
      resetOtpHash: crypto.createHash("sha256").update(String(otp)).digest("hex"),
      resetOtpExpiry: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordTokenExpiry = Date.now() + 10 * 60 * 1000;
    user.resetOtpHash = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.status(200).json({ message: "OTP verified", resetToken });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, role } = req.body;

    if (!password || !role) {
      return res
        .status(400)
        .json({ message: "Password and role are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
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
    user.resetOtpHash = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
