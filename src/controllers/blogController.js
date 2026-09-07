const Blog = require("../models/Blog");
const { toPublicPath, deleteFileByPublicPath } = require("../middleware/upload");

// ================================================================
// Helpers
// ================================================================

/**
 * req.body.data is a JSON string (the BlogFormValues object, minus real
 * File objects — cover/content images are sent separately via multer).
 * req.files (from upload.any()) contains:
 *   - fieldname "coverImage"        -> the new cover image file (optional)
 *   - fieldname "image_<blockImgId>" -> a new file for a specific image
 *                                       inside a content block (optional, many)
 */
const parsePayload = (req) => {
  if (!req.body.data) {
    throw new Error("Missing 'data' field (JSON payload) in form-data");
  }
  let payload;
  try {
    payload = JSON.parse(req.body.data);
  } catch (e) {
    throw new Error("'data' field must be valid JSON");
  }
  return payload;
};

const getFilesMap = (req) => {
  const files = req.files || [];
  const coverFile = files.find((f) => f.fieldname === "coverImage");
  const imageFilesById = {};
  files.forEach((f) => {
    if (f.fieldname.startsWith("image_")) {
      const imgId = f.fieldname.replace("image_", "");
      imageFilesById[imgId] = f;
    }
  });
  return { coverFile, imageFilesById };
};

/**
 * Walks payload.content blocks and swaps in the uploaded file's public path
 * for any image whose id matches an uploaded file (image_<id> fieldname).
 */
const applyContentImageFiles = (content = [], imageFilesById) => {
  return content.map((block) => {
    if (block.type !== "images" || !Array.isArray(block.images)) return block;
    const images = block.images.map((img) => {
      const file = imageFilesById[img.id];
      if (file) {
        return { ...img, src: toPublicPath(file.filename), tempUrlInput: undefined };
      }
      return { ...img, tempUrlInput: undefined };
    });
    return { ...block, images };
  });
};

// Collect every public /uploads/blogs/... path currently referenced by a blog doc
const collectImagePaths = (blogDoc) => {
  const paths = [];
  if (blogDoc.coverImage) paths.push(blogDoc.coverImage);
  (blogDoc.content || []).forEach((block) => {
    (block.images || []).forEach((img) => {
      if (img.src) paths.push(img.src);
    });
  });
  return paths;
};

// ================================================================
// POST /api/blog  — create
// ================================================================
exports.createBlog = async (req, res) => {
  try {
    const payload = parsePayload(req);
    const { coverFile, imageFilesById } = getFilesMap(req);

    if (coverFile) {
      payload.coverImage = toPublicPath(coverFile.filename);
    }

    payload.content = applyContentImageFiles(payload.content, imageFilesById);

    const blog = await Blog.create(payload);

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A blog with this slug already exists",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create blog",
    });
  }
};

// ================================================================
// GET /api/blog  — list (with optional filters + pagination)
// ================================================================
exports.getAllBlogs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Blog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch blogs",
    });
  }
};

// ================================================================
// GET /api/blog/:id  — single (by id or slug)
// ================================================================
exports.getSingleBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = id.match(/^[0-9a-fA-F]{24}$/)
      ? await Blog.findById(id)
      : await Blog.findOne({ slug: id });

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch blog",
    });
  }
};

// ================================================================
// PUT /api/blog/:id  — update
// ================================================================
exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Blog.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const payload = parsePayload(req);
    const { coverFile, imageFilesById } = getFilesMap(req);

    const oldPaths = collectImagePaths(existing);

    if (coverFile) {
      payload.coverImage = toPublicPath(coverFile.filename);
    }
    payload.content = applyContentImageFiles(payload.content, imageFilesById);

    const updated = await Blog.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    // Clean up any old image files that are no longer referenced
    const newPaths = new Set(collectImagePaths(updated));
    oldPaths.forEach((p) => {
      if (!newPaths.has(p)) deleteFileByPublicPath(p);
    });

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updated,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A blog with this slug already exists",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to update blog",
    });
  }
};

// ================================================================
// PATCH /api/blog/:id/status  — quick Draft/Published toggle (JSON body)
// ================================================================
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Draft", "Published"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status must be 'Draft' or 'Published'",
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    return res.status(200).json({ success: true, data: blog });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update status",
    });
  }
};

// ================================================================
// DELETE /api/blog/:id
// ================================================================
exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    collectImagePaths(blog).forEach(deleteFileByPublicPath);

    return res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete blog",
    });
  }
};