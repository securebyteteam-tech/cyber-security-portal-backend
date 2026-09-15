
// ================================================================
// CYBER SECURITY LEARNING PORTAL
// MATERIALS ROUTES
// MongoDB + Express
// ================================================================

const express = require("express");

const router = express.Router();

const Material = require("../models/Material");

const authenticate = require("../middleware/authenticate");

const {
  authorizeTeacher
} = require("../middleware/authorize");


// ================================================================
// GET ALL MATERIALS
// Student + Teacher
// ================================================================

router.get(
  "/",
  authenticate,
  async (req, res, next) => {
    try {

      const materials = await Material
        .find({
          status: {
            $ne: "inactive"
          }
        })
        .sort({
          srNo: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: materials.length,
        data: materials
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET MATERIALS BY TYPE
// Student + Teacher
// ================================================================

router.get(
  "/type/:type",
  authenticate,
  async (req, res, next) => {
    try {

      const type =
        String(req.params.type)
          .trim();

      if (!type || type.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Invalid material type."
        });
      }

      const materials = await Material
        .find({
          type: type,
          status: {
            $ne: "inactive"
          }
        })
        .sort({
          srNo: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: materials.length,
        data: materials
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// TEACHER: GET ALL MATERIALS INCLUDING INACTIVE
// IMPORTANT: This route must come BEFORE /:id
// ================================================================

router.get(
  "/teacher/all",
  authenticate,
  authorizeTeacher,
  async (req, res, next) => {
    try {

      const materials = await Material
        .find({})
        .sort({
          srNo: 1
        })
        .lean();

      return res.status(200).json({
        success: true,
        count: materials.length,
        data: materials
      });

    } catch (error) {
      next(error);
    }
  }
);


// ================================================================
// GET SINGLE MATERIAL
// Student + Teacher
// ================================================================

router.get(
  "/:id",
  authenticate,
  async (req, res, next) => {
    try {

      const material =
        await Material.findById(
          req.params.id
        ).lean();

      if (!material) {
        return res.status(404).json({
          success: false,
          message: "Material not found."
        });
      }

      if (material.status === "inactive") {
        return res.status(404).json({
          success: false,
          message: "Material is not available."
        });
      }

      return res.status(200).json({
        success: true,
        data: material
      });

    } catch (error) {

      if (error.name === "CastError") {
        return res.status(400).json({
          success: false,
          message: "Invalid material ID."
        });
      }

      next(error);
    }
  }
);


// ================================================================
// EXPORT ROUTER
// ================================================================

module.exports = router;