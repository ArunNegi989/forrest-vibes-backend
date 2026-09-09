const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ================================
// Upload directory — /uploads at project root
// ================================
const uploadDir = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ================================
// Storage config
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

// ================================
// Only allow image files
// ================================
const allowedTypes = /jpeg|jpg|png|webp|gif/;

const fileFilter = (req, file, cb) => {
  const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp, gif) are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ================================
// Helper: build public URL path for a stored file
// ================================
const toPublicPath = (filename) => `/uploads/${filename}`;

// ================================
// Helper: safely delete a file given its public path (e.g. "/uploads/xyz.jpg")
// ================================
const deleteFileByPublicPath = (publicPath) => {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  const filePath = path.join(__dirname, "..", "..", publicPath);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete file:", filePath, err.message);
    }
  });
};

module.exports = { upload, uploadDir, toPublicPath, deleteFileByPublicPath };