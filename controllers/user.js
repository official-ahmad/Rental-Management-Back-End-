const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
