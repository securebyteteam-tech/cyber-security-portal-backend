// ================================================================
// CYBER SECURITY LEARNING PORTAL
// SCORE ROUTES
// MongoDB + Express
// ================================================================

const express = require("express");

const router = express.Router();

const Score = require("../models/Score");

const authenticate = require("../middleware/authenticate");

const {
  authorizeStudent,
  authorizeTeacher
} = require("../middleware/authorize");

const {
  cleanStudentId
} = require("../middleware/validate");


// ================================================================
// GET ALL STUDENT SCORES
// Teacher only
// ================================================================

router.get(
  "/",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {

      const scores = await Score
        .find({})
        .sort({
          uniqueId: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: scores.length,
        data: scores
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET LOGGED-IN STUDENT SCORES
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

      const scores = await Score
        .findOne({
          uniqueId: req.user.studentId
        })
        .lean();

      if (!scores) {
        return res.status(404).json({
          success: false,
          message: "Score record not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: scores
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET SPECIFIC STUDENT SCORE
// Teacher only
// ================================================================

router.get(
  "/student/:studentId",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {

      const studentId =
        cleanStudentId(
          req.params.studentId
        );

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID."
        });
      }

      const scores = await Score
        .findOne({
          uniqueId: studentId
        })
        .lean();

      if (!scores) {
        return res.status(404).json({
          success: false,
          message: "Score record not found."
        });
      }

      return res.status(200).json({
        success: true,
        data: scores
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET SCORE SUMMARY FOR LOGGED-IN STUDENT
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

      const scoreRecord = await Score
        .findOne({
          uniqueId: req.user.studentId
        })
        .lean();

      if (!scoreRecord) {
        return res.status(404).json({
          success: false,
          message: "Score record not found."
        });
      }

      const scores =
        scoreRecord.scores || {};

      return res.status(200).json({
        success: true,
        data: {
          uniqueId: scoreRecord.uniqueId,
          studentName: scoreRecord.studentName,
          studentEmail: scoreRecord.studentEmail,
          scores
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