// ================================================================
// CYBER SECURITY LEARNING PORTAL
// OTP MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// OTP SCHEMA
// ================================================================

const otpSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // User email
    // ------------------------------------------------------------

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true
    },

    // ------------------------------------------------------------
    // Hashed OTP
    // ------------------------------------------------------------
    // Plain OTP is NEVER stored in MongoDB.
    // ------------------------------------------------------------

    otpHash: {
      type: String,
      required: true,
      select: false
    },

    // ------------------------------------------------------------
    // OTP expiry
    // ------------------------------------------------------------

    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    // ------------------------------------------------------------
    // Verification attempts
    // ------------------------------------------------------------

    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },

    // ------------------------------------------------------------
    // OTP usage status
    // ------------------------------------------------------------

    verified: {
      type: Boolean,
      default: false
    },

    // ------------------------------------------------------------
    // Request information
    // ------------------------------------------------------------

    ipAddress: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    },

    userAgent: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
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

// One active OTP record can be maintained per email.
otpSchema.index({
  email: 1
});

// MongoDB automatically removes expired OTP records.
otpSchema.index(
  {
    expiresAt: 1
  },
  {
    expireAfterSeconds: 0
  }
);


// ================================================================
// EXPORT MODEL
// ================================================================

const OTP = mongoose.model(
  "OTP",
  otpSchema
);

module.exports = OTP;