// ================================================================
// CYBER SECURITY LEARNING PORTAL
// USER MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// USER SCHEMA
// ================================================================

const userSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // Role
    // ------------------------------------------------------------

    role: {
      type: String,
      required: true,
      enum: ["student", "teacher"],
      lowercase: true,
      trim: true,
      index: true
    },

    // ------------------------------------------------------------
    // User name
    // ------------------------------------------------------------

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150
    },

    // ------------------------------------------------------------
    // Login / identity email
    // ------------------------------------------------------------

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true
    },

    // ------------------------------------------------------------
    // Student ID
    // ------------------------------------------------------------
    // Teachers may not have a StudentID.
    // Students should have one.
    // ------------------------------------------------------------

    studentId: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 100,
      default: null,
      index: true
    },

    // ------------------------------------------------------------
    // Overall performance
    // ------------------------------------------------------------

    performance: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },

    // ------------------------------------------------------------
    // Learning progress
    // ------------------------------------------------------------

    learningProgress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },

    // ------------------------------------------------------------
    // Overall progress
    // ------------------------------------------------------------

    progress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },

    // ------------------------------------------------------------
    // Account status
    // ------------------------------------------------------------

    status: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    }
  },

  {
    // Automatically creates:
    // createdAt
    // updatedAt
    timestamps: true,

    // We don't need MongoDB's __v field for this application.
    versionKey: false,

    // Reject fields that are not defined in this schema.
    strict: true
  }
);


// ================================================================
// INDEXES
// ================================================================

// Email is already unique/indexed above.
// These indexes improve student/teacher queries.

userSchema.index({
  role: 1
});

userSchema.index({
  studentId: 1
});


// ================================================================
// VALIDATION
// ================================================================

// A student should have a Student ID.
// A teacher can have studentId = null.

userSchema.pre("validate", function (next) {
  if (this.role === "student" && !this.studentId) {
    return next(
      new Error("Student ID is required for student users.")
    );
  }

  next();
});


// ================================================================
// EXPORT MODEL
// ================================================================

const User = mongoose.model(
  "User",
  userSchema
);

module.exports = User;