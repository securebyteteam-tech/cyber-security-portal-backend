
// ================================================================
// CYBER SECURITY LEARNING PORTAL
// ATTENDANCE ROUTES
// MongoDB + Express
// ================================================================

const express = require("express");

const router = express.Router();

const Attendance = require("../models/Attendance");

const authenticate = require("../middleware/authenticate");

const {
  authorizeStudent,
  authorizeTeacher
} = require("../middleware/authorize");

const {
  cleanStudentId
} = require("../middleware/validate");


// ================================================================
// GET ALL ATTENDANCE
// Teacher only
// ================================================================

router.get(
  "/",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {
      const attendance = await Attendance
        .find({})
        .sort({ uniqueId: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: attendance.length,
        data: attendance
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET LOGGED-IN STUDENT ATTENDANCE
// Student only
// ================================================================

router.get(
  "/me",
  authenticate,
  authorizeStudent,
  async (req, res, next) => {
    try {
      if (!req.user.studentId) {
        return res.status(400).json({
          success: false,
          message: "Student ID is not available for this account."
        });
      }

      const attendance = await Attendance
        .findOne({
          uniqueId: req.user.studentId
        })
        .lean();

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: attendance
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET ATTENDANCE BY STUDENT ID
// Teacher only
// ================================================================

router.get(
  "/student/:studentId",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {
      const studentId = cleanStudentId(
        req.params.studentId
      );

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID."
        });
      }

      const attendance = await Attendance
        .findOne({
          uniqueId: studentId
        })
        .lean();

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: attendance
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET ATTENDANCE SUMMARY FOR LOGGED-IN STUDENT
// Student only
// ================================================================

router.get(
  "/me/summary",
  authenticate,
  authorizeStudent,
  async (req, res, next) => {
    try {
      if (!req.user.studentId) {
        return res.status(400).json({
          success: false,
          message: "Student ID is not available for this account."
        });
      }

      const attendance = await Attendance
        .findOne({
          uniqueId: req.user.studentId
        })
        .lean();

      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          uniqueId: attendance.uniqueId,
          fullName: attendance.fullName,
          totalPresent: attendance.totalPresent,
          totalAbsence: attendance.totalAbsence,
          percentage: attendance.percentage
        }
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// EXPORT ROUTER
// ================================================================

module.exports = router;
