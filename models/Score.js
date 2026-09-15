// ================================================================
// CYBER SECURITY LEARNING PORTAL
// SCORE MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// SCORE SCHEMA
// ================================================================

const scoreSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // Student identification
    // ------------------------------------------------------------

    uniqueId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      index: true
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true
    },

    // ------------------------------------------------------------
    // Dynamic scores
    // ------------------------------------------------------------
    // Example:
    //
    // {
    //   "05-09-26 Test Score": "10/10",
    //   "10/09/26 Score": "10/10",
    //   "Assignment Score": "10"
    // }
    //
    // New tests/assignments can be added without changing
    // the MongoDB schema.
    // ------------------------------------------------------------

    scores: {
      type: Map,
      of: {
        type: String,
        trim: true,
        maxlength: 100
      },
      default: {}
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

scoreSchema.index({
  uniqueId: 1
});

scoreSchema.index({
  studentEmail: 1
});


// ================================================================
// EXPORT MODEL
// ================================================================

const Score = mongoose.model(
  "Score",
  scoreSchema
);

module.exports = Score;