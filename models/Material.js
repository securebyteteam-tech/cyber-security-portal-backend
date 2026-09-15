// ================================================================
// CYBER SECURITY LEARNING PORTAL
// STUDY MATERIAL MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// MATERIAL SCHEMA
// ================================================================

const materialSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // Serial Number
    // ------------------------------------------------------------

    srNo: {
      type: Number,
      required: true,
      min: 1
    },

    // ------------------------------------------------------------
    // Material Title
    // ------------------------------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300
    },

    // ------------------------------------------------------------
    // Material Type
    // ------------------------------------------------------------

    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    // ------------------------------------------------------------
    // Google Drive / PDF URL
    // ------------------------------------------------------------

    pdfLink: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048
    },

    // ------------------------------------------------------------
    // Optional status
    // ------------------------------------------------------------

    status: {
      type: String,
      trim: true,
      default: "active"
    }
  },

  {
    timestamps: true,

    versionKey: false,

    strict: true
  }
);


// ================================================================
// INDEXES
// ================================================================

materialSchema.index({
  srNo: 1
});

materialSchema.index({
  type: 1
});


// ================================================================
// EXPORT MODEL
// ================================================================

const Material = mongoose.model(
  "Material",
  materialSchema
);

module.exports = Material;