const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./connect");
const homeRoutes = require("./routes/homeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const managerRoutes = require("./routes/manager.js");

dotenv.config();
const app = express();

// Enable GZIP compression for faster responses
app.use(compression());

// Parse JSON with limit for security
app.use(express.json({ limit: "10mb" }));

// CORS Configuration - Supports both Local and Live
const allowedOrigins = [
  "https://rental-management-front-end.vercel.app", // Live Frontend
  "http://localhost:5173", // Local Vite Dev Server
  "http://localhost:3000", // Alternative Local
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
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
  res.send("Rental Management System API is running!");
});

// FIXED PORT LOGIC
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
