// ================================================================
// CYBER SECURITY LEARNING PORTAL
// CHAT MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// CHAT SCHEMA
// ================================================================

const chatSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // Message timestamp
    // ------------------------------------------------------------

    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },

    // ------------------------------------------------------------
    // Sender
    // ------------------------------------------------------------

    from: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true
    },

    // ------------------------------------------------------------
    // Receiver
    // ------------------------------------------------------------
    // For student -> teacher:
    // to = "teacher"
    //
    // For teacher -> student:
    // to = student's email
    //
    // For broadcast:
    // to = "broadcast"
    // ------------------------------------------------------------

    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true
    },

    // ------------------------------------------------------------
    // Message content
    // ------------------------------------------------------------

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    // ------------------------------------------------------------
    // Message type
    // ------------------------------------------------------------

    type: {
      type: String,
      required: true,
      enum: [
        "query",
        "reply",
        "broadcast"
      ],
      lowercase: true,
      trim: true,
      index: true
    },

    // ------------------------------------------------------------
    // Read status
    // ------------------------------------------------------------

    read: {
      type: Boolean,
      default: false,
      index: true
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

// Student ↔ teacher conversations
chatSchema.index({
  from: 1,
  to: 1,
  timestamp: -1
});

// Unread message lookup
chatSchema.index({
  to: 1,
  read: 1,
  timestamp: -1
});

// General chat retrieval
chatSchema.index({
  timestamp: -1
});


// ================================================================
// EXPORT MODEL
// ================================================================

const Chat = mongoose.model(
  "Chat",
  chatSchema
);

module.exports = Chat;