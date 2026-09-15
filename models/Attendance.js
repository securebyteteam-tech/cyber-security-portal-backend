// ================================================================
// CYBER SECURITY LEARNING PORTAL
// ATTENDANCE MODEL
// MongoDB + Mongoose
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// ATTENDANCE SCHEMA
// ================================================================

const attendanceSchema = new mongoose.Schema(
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

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    // ------------------------------------------------------------
    // Attendance dates
    // ------------------------------------------------------------
    // Example:
    // {
    //   "24/08/26": "P",
    //   "25/08/26": "P",
    //   "31/08/26": "A"
    // }
    //
    // Dates are dynamic because new attendance columns
    // can be added to the existing Google Sheet.
    // ------------------------------------------------------------

    attendance: {
      type: Map,
      of: {
        type: String,
        enum: ["P", "A", "L", ""],
        default: ""
      },
      default: {}
    },

    // ------------------------------------------------------------
    // Attendance totals
    // ------------------------------------------------------------

    totalPresent: {
      type: Number,
      min: 0,
      default: 0
    },

    totalAbsence: {
      type: Number,
      min: 0,
      default: 0
    },

    // ------------------------------------------------------------
    // Optional calculated percentage
    // ------------------------------------------------------------

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },

  {
    timestamps: true,

    versionKey: false,

    strict: true
  }
);


// ================================================================
// INDEX
// ================================================================

attendanceSchema.index({
  uniqueId: 1
});


// ================================================================
// CALCULATE ATTENDANCE
// ================================================================

attendanceSchema.methods.calculateTotals = function () {

  let present = 0;
  let absence = 0;

  for (const status of this.attendance.values()) {

    if (status === "P") {
      present++;
    }

    if (status === "A") {
      absence++;
    }
  }

  this.totalPresent = present;
  this.totalAbsence = absence;

  const total = present + absence;

  this.percentage =
    total > 0
      ? Number(((present / total) * 100).toFixed(2))
      : 0;

  return this;
};


// ================================================================
// EXPORT MODEL
// ================================================================

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

module.exports = Attendance;