const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./connect"); // Path check kar lena agar file folder mein hai to
const propertyRoutes = require("./routes/propertyRoutes");

// Config
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database Connect
connectDB();
app.use("/api/auth", require("./routes/authRoutes"));

// Basic Route (Checking ke liye)
app.get("/", (req, res) => {
  res.send("Rental Management System API is running...");
});
app.use("/api/properties", propertyRoutes);
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
