const express = require("express");
const { upload } = require("../middleware/upload");
const {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  updateStatus,
  deleteBlog,
} = require("../controllers/blogController");

const router = express.Router();

// upload.any() -> accepts "coverImage" + any number of "image_<id>" files
// together with the "data" (JSON) field, all in one multipart/form-data request
router.get("/", getAllBlogs);
router.get("/:id", getSingleBlog);
router.post("/", upload.any(), createBlog);
router.put("/:id", upload.any(), updateBlog);
router.patch("/:id/status", updateStatus); // plain JSON body: { status: "Draft" | "Published" }
router.delete("/:id", deleteBlog);

module.exports = router;