// ================================================================
// CYBER SECURITY LEARNING PORTAL
// MESSAGE MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// MESSAGE SCHEMA
// ================================================================

const messageSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------
    // Sender email
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
    // Student -> Teacher:
    // "teacher"
    //
    // Teacher -> Student:
    // student's email
    //
    // Broadcast:
    // "broadcast"
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
    // Message text
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
    },

    // ------------------------------------------------------------
    // Original message timestamp
    // ------------------------------------------------------------

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
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

// Conversation lookup
messageSchema.index({
  from: 1,
  to: 1,
  timestamp: -1
});

// Receiver unread messages
messageSchema.index({
  to: 1,
  read: 1,
  timestamp: -1
});

// Latest messages
messageSchema.index({
  timestamp: -1
});


// ================================================================
// EXPORT MODEL
// ================================================================

const Message = mongoose.model(
  "Message",
  messageSchema
);

module.exports = Message;