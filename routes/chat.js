
// ================================================================
// CYBER SECURITY LEARNING PORTAL
// CHAT ROUTES
// MongoDB + Express
// ================================================================

const express = require("express");

const router = express.Router();

const Chat = require("../models/Chat");

const authenticate = require("../middleware/authenticate");

const {
  authorizeStudent,
  authorizeTeacher
} = require("../middleware/authorize");

const {
  validateChatMessage,
  validateBroadcastMessage
} = require("../middleware/validate");


// ================================================================
// GET STUDENT MESSAGES
// Student can only see their own conversation
// ================================================================

router.get(
  "/student",
  authenticate,
  authorizeStudent,
  async (req, res, next) => {
    try {

      if (!req.user.email) {
        return res.status(400).json({
          success: false,
          message: "User email is not available."
        });
      }

      const studentEmail =
        req.user.email.toLowerCase().trim();

      const messages = await Chat
        .find({
          $or: [
            {
              from: studentEmail
            },
            {
              to: studentEmail
            },
            {
              to: "teacher",
              from: studentEmail
            }
          ]
        })
        .sort({
          timestamp: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET TEACHER MESSAGES
// Teacher can see student queries/replies
// ================================================================

router.get(
  "/teacher",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {

      const messages = await Chat
        .find({})
        .sort({
          timestamp: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET CONVERSATION WITH ONE STUDENT
// Teacher only
// ================================================================

router.get(
  "/teacher/student/:email",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {

      const studentEmail =
        String(req.params.email)
          .toLowerCase()
          .trim();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(studentEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student email."
        });
      }

      const messages = await Chat
        .find({
          $or: [
            {
              from: studentEmail
            },
            {
              to: studentEmail
            }
          ]
        })
        .sort({
          timestamp: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: messages.length,
        data: messages
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// SEND STUDENT QUERY
// Student -> Teacher
// ================================================================

router.post(
  "/message",
  authenticate,
  authorizeStudent,
  validateChatMessage,
  async (req, res, next) => {
    try {

      const {
        message
      } = req.body;

      const studentEmail =
        req.user.email.toLowerCase().trim();

      const chatMessage =
        await Chat.create({
          timestamp: new Date(),
          from: studentEmail,
          to: "teacher",
          message: message.trim(),
          type: "query",
          read: false
        });

      return res.status(201).json({
        success: true,
        message: "Message sent successfully.",
        data: chatMessage
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// TEACHER REPLY TO STUDENT
// ================================================================

router.post(
  "/reply",
  authenticate,
  authorizeTeacher,
  validateChatMessage,
  async (req, res, next) => {
    try {

      const {
        to,
        message
      } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: "Student email is required."
        });
      }

      const studentEmail =
        String(to)
          .toLowerCase()
          .trim();

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(studentEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student email."
        });
      }

      const chatMessage =
        await Chat.create({
          timestamp: new Date(),
          from: req.user.email
            .toLowerCase()
            .trim(),
          to: studentEmail,
          message: message.trim(),
          type: "reply",
          read: false
        });

      return res.status(201).json({
        success: true,
        message: "Reply sent successfully.",
        data: chatMessage
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// TEACHER BROADCAST MESSAGE
// Teacher -> All Students
// ================================================================

router.post(
  "/broadcast",
  authenticate,
  authorizeTeacher,
  validateBroadcastMessage,
  async (req, res, next) => {
    try {

      const {
        message
      } = req.body;

      const chatMessage =
        await Chat.create({
          timestamp: new Date(),
          from: req.user.email
            .toLowerCase()
            .trim(),
          to: "teacher",
          message: message.trim(),
          type: "broadcast",
          read: false
        });

      return res.status(201).json({
        success: true,
        message: "Broadcast message sent successfully.",
        data: chatMessage
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// MARK MESSAGE AS READ
// Student / Teacher
// ================================================================

router.patch(
  "/:messageId/read",
  authenticate,
  async (req, res, next) => {
    try {

      const {
        messageId
      } = req.params;

      const message =
        await Chat.findById(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found."
        });
      }

      // ----------------------------------------------------------
      // Ownership check
      // ----------------------------------------------------------

      const userEmail =
        req.user.email
          .toLowerCase()
          .trim();

      const isTeacher =
        req.user.role === "teacher";

      const isOwner =
        message.from === userEmail ||
        message.to === userEmail;

      const isTeacherConversation =
        message.to === "teacher" ||
        message.type === "broadcast";

      if (
        !isTeacher &&
        !isOwner &&
        !isTeacherConversation
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to modify this message."
        });
      }

      message.read = true;

      await message.save();

      return res.status(200).json({
        success: true,
        message: "Message marked as read.",
        data: message
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET UNREAD MESSAGE COUNT
// ================================================================

router.get(
  "/unread-count",
  authenticate,
  async (req, res, next) => {
    try {

      const userEmail =
        req.user.email
          .toLowerCase()
          .trim();

      let unreadCount = 0;

      // ----------------------------------------------------------
      // Student
      // ----------------------------------------------------------

      if (req.user.role === "student") {

        unreadCount =
          await Chat.countDocuments({
            to: userEmail,
            read: false
          });

        // Broadcast messages are also unread for students.
        unreadCount +=
          await Chat.countDocuments({
            type: "broadcast",
            read: false
          });
      }

      // ----------------------------------------------------------
      // Teacher
      // ----------------------------------------------------------

      if (req.user.role === "teacher") {

        unreadCount =
          await Chat.countDocuments({
            to: "teacher",
            read: false
          });
      }

      return res.status(200).json({
        success: true,
        unreadCount
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