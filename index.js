const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./connect");
const homeRoutes = require("./routes/homeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const managerRoutes = require("./routes/manager.js");

dotenv.config();
const app = express();

app.use(express.json());

// --- CHANGE 1: CORS Settings for Production ---
// Yahan "*" ki jagah apna Vercel link dalna security ke liye behtar hai
app.use(
  cors({
    origin: "https://rental-management-front-end.vercel.app/",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Database Connect
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", require("./routes/authRoutes"));
app.use("/api/properties", managerRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/manager", managerRoutes);
app.use("/api/admin", managerRoutes);

// Basic Route
app.get("/", (req, res) => {
  res.send("Rental Management System API is running on Railway!");
});

// --- CHANGE 2: Port Configuration for Railway ---
// Railway hamesha PORT variable provide karta hai, agar wo na mile toh 8000 use karein
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
