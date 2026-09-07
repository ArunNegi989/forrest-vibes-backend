const mongoose = require("mongoose");

// ================================
// Sub-schema: Image (used inside "images" content blocks)
// ================================
const ImageSchema = new mongoose.Schema(
  {
    id: { type: String }, // client-generated block/image id, used to map uploaded files
    src: { type: String, default: "" },
    caption: { type: String, default: "", maxlength: 200 },
    altText: { type: String, default: "", maxlength: 150 },
  },
  { _id: false }
);

// ================================
// Sub-schema: Content Block (heading, paragraph, images, table, etc.)
// ================================
const SectionSchema = new mongoose.Schema(
  {
    id: { type: String },
    type: {
      type: String,
      required: true,
      enum: [
        "heading",
        "subheading",
        "paragraph",
        "images",
        "divider",
        "list",
        "quote",
        "code",
        "video",
        "table",
        "callout",
        "spacer",
        "html",
      ],
    },
    text: { type: String, default: "" },

    // list block
    listType: { type: String, enum: ["ordered", "unordered"] },
    listItems: [{ type: String }],

    // quote block
    quoteAuthor: { type: String, default: "" },

    // code block
    codeLanguage: { type: String, default: "plaintext" },

    // video block
    videoUrl: { type: String, default: "" },
    videoCaption: { type: String, default: "" },

    // table block
    tableHeaders: [{ type: String }],
    tableRows: [[{ type: String }]],

    // callout block
    calloutVariant: {
      type: String,
      enum: ["info", "tip", "success", "warning", "danger"],
    },
    calloutTitle: { type: String, default: "" },

    // spacer block
    spacerHeight: { type: Number, default: 40 },

    // images block
    imageLayout: {
      type: String,
      enum: ["single", "two-col", "three-col", "wide"],
    },
    images: [ImageSchema],
  },
  { _id: false }
);

// ================================
// Main Blog Schema
// ================================
const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    excerpt: { type: String, required: true, maxlength: 300 },
    date: { type: Date, required: true },
    author: { type: String, default: "", trim: true, maxlength: 80 },
    authorRole: { type: String, default: "", trim: true },
    category: { type: String, required: true },

    coverImage: { type: String, required: true }, // stored as relative path e.g. /uploads/blogs/xxx.jpg

    tags: [{ type: String }],
    content: [SectionSchema],

    // SEO
    metaTitle: { type: String, default: "", maxlength: 70 },
    metaDescription: { type: String, default: "", maxlength: 160 },
    metaKeywords: [{ type: String }],
    schemaMarkup: { type: String, default: "" }, // raw JSON-LD string

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);