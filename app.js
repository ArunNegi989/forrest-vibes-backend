const express = require("express");
const cors = require("cors");

// Routes
const routes = require("./src/routes/index");
const path = require("path");
// Initialize App
const app = express();

// ================================
// Middleware
// ================================

// Parse JSON requests
app.use(express.json());

// Enable CORS
app.use(
cors({
origin: "*",
methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
allowedHeaders: ["Content-Type", "Authorization"],
})
);

// ================================
// API Routes
// ================================

app.use("/api", routes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================================
// Health Check Route
// ================================

app.get("/", (req, res) => {
res.status(200).json({
success: true,
message: "🌿 Forest Vibe Backend API is Running",
});
});

// ================================
// 404 Handler
// ================================

app.use((req, res) => {
res.status(404).json({
success: false,
message: `Route not found: ${req.originalUrl}`,
});
});

module.exports = app;
