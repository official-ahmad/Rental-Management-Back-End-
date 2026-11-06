const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const compression = require("compression");
const connectDB = require("./connect");
const errorHandler = require("./middleware/errorHandler");
const auditMiddleware = require("./middleware/auditLogger");
const { verifyToken, authorizeRoles } = require("./middleware/auth");

const authRoutes = require("./routes/authRoutes");
const homeRoutes = require("./routes/homeRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const managerRoutes = require("./routes/manager");
const feedbackRoutes = require("./routes/feedbackRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const auditRoutes = require("./routes/auditRoutes");

dotenv.config({ override: true });
const app = express();

app.use(compression());

app.use(express.json({ limit: "10mb" }));

const allowedOrigins = [
  "http://localhost:5173",
  "*",
  "https://www.rentify.software/",
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

connectDB();

app.use(auditMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use("/api/bookings", verifyToken, bookingRoutes);
app.use("/api/payments", verifyToken, paymentRoutes);
app.use(
  "/api/manager",
  verifyToken,
  authorizeRoles("Manager", "Admin"),
  managerRoutes,
);
app.use("/api/audit-logs", verifyToken, authorizeRoles("Admin"), auditRoutes);

app.get("/", (req, res) => {
  res.send("Rental Management System API is running!");
});

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
