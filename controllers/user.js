const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- REGISTER LOGIC ---
exports.register = async (req, res) => {
  try {
    // 1. Frontend se firstName aur lastName lein (Jo aapke Model mein hain)
    const { firstName, lastName, email, password, role } = req.body;

    // 2. Email check karein
    const userExist = await User.findOne({ email });
    if (userExist)
      return res.status(400).json({ message: "Email already registered" });

    // 3. Password secure karein
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Model ke mutabiq save karein
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
    // Agar error aaye to console mein dikhaye ke kyun aa raha hai
    console.error("Registration Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- LOGIN LOGIC ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Response mein firstName aur lastName dono bhej dein
    res.status(200).json({
      token,
      user: { name: `${user.firstName} ${user.lastName}`, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
