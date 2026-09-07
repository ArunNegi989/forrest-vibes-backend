const express = require("express");
const {
  signup,
  login,
  getMe,
  getAllUsers,
  updateUserRole,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// =================================
// Public Auth Routes
// =================================
router.post("/signup", signup);
router.post("/login", login);

// =================================
// Private Routes (koi bhi logged-in user)
// =================================
router.get("/me", protect, getMe);

// =================================
// Admin-only Routes (role based)
// =================================
router.get("/admin/users", protect, authorize("admin"), getAllUsers);
router.patch("/admin/users/:id/role", protect, authorize("admin"), updateUserRole);

module.exports = router;