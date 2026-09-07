const express = require("express");
const authRoutes = require("./authRoutes");

const router = express.Router();
const blogRoutes = require("./blogRoutes");
// =================================
// API Test Route
// =================================

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Forest Vibe API Routes are working 🌿",
  });
});

// =================================
// Feature Routes
// =================================

router.use("/auth", authRoutes);
router.use("/blog", blogRoutes);

module.exports = router;