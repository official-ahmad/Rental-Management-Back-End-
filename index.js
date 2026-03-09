const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./connect");
const errorHandler = require("./middleware/errorHandler");
const { verifyToken, authorizeRoles } = require("./middleware/auth");

// Route imports
const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const managerRoutes = require("./routes/manager");

dotenv.config();
const app = express();

// Enable GZIP compression for faster responses
app.use(compression());

// Parse JSON with limit for security
app.use(express.json({ limit: "10mb" }));

// CORS Configuration - Supports both Local and Live
const allowedOrigins = [
  "https://rental-management-front-end.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
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

// Public Routes
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);

// Protected Routes — require valid JWT
app.use("/api/bookings", verifyToken, bookingRoutes);
app.use(
  "/api/manager",
  verifyToken,
  authorizeRoles("Manager", "Admin"),
  managerRoutes,
);

// Health Check
app.get("/", (req, res) => {
  res.send("Rental Management System API is running!");
});

// Global Error Handler (must be after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
