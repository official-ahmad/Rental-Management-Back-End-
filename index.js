const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./connect");
const propertyRoutes = require("./routes/propertyRoutes");
// 1. Home routes ko import karein (Rasta banayein)
const homeRoutes = require("./routes/homeRoutes");

// Config
dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Database Connect
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/properties", propertyRoutes);

// 2. Home API Call karwane ke liye rasta (Endpoint) add karein
app.use("/api/home", homeRoutes);

// Basic Route (Checking ke liye)
app.get("/", (req, res) => {
  res.send("Rental Management System API is running...");
});

const PORT = process.env.PORT; 
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
