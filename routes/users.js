// ================================================================
// CYBER SECURITY LEARNING PORTAL
// USER ROUTES
// MongoDB + Express
// ================================================================

const express = require("express");
const router = express.Router();

const User = require("../models/User");

const authenticate = require("../middleware/authenticate");

const {
  authorizeStudent,
  authorizeTeacher
} = require("../middleware/authorize");

const {
  cleanStudentId
} = require("../middleware/validate");

// ================================================================
// HELPER: SAFE USER DATA
// ================================================================

function safeUser(user) {
  return {
    id: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
    studentId: user.studentId || null,
    performance: user.performance || "",
    learningProgress: user.learningProgress || "",
    progress: user.progress || "",
    status: user.status || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

// ================================================================
// GET LOGGED-IN USER
// Student + Teacher
// ================================================================

router.get(
  "/me",
  authenticate,
  async (req, res, next) => {
    try {
      const user = await User
        .findById(req.user.userId)
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: safeUser(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

// ================================================================
// GET ALL USERS
// Teacher only
// ================================================================

router.get(
  "/",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {
      const users = await User
        .find({})
        .sort({
          role: 1,
          name: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: users.length,
        data: users.map(safeUser)
      });
    } catch (error) {
      next(error);
    }
  }
);

// ================================================================
// GET ALL STUDENTS
// Teacher only
// ================================================================

router.get(
  "/students",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {
      const students = await User
        .find({
          role: "student"
        })
        .sort({
          name: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: students.length,
        data: students.map(safeUser)
      });
    } catch (error) {
      next(error);
    }
  }
);

// ================================================================
// GET USER BY STUDENT ID
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

      const user = await User
        .findOne({
          role: "student",
          studentId
        })
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Student not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: safeUser(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

// ================================================================
// GET USER BY EMAIL
// Teacher only
// ================================================================

router.get(
  "/email/:email",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {
      const email = String(req.params.email)
        .trim()
        .toLowerCase();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address."
        });
      }

      const user = await User
        .findOne({
          email
        })
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: safeUser(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

// ================================================================
// GET USERS BY ROLE
// Teacher only
// ================================================================

router.get(
  "/role/:role",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {
      const role = String(req.params.role)
        .trim()
        .toLowerCase();

      if (
        role !== "student" &&
        role !== "teacher"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role."
        });
      }

      const users = await User
        .find({
          role
        })
        .sort({
          name: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: users.length,
        data: users.map(safeUser)
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