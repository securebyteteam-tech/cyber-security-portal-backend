// ================================================================
// CYBER SECURITY LEARNING PORTAL
// AUTHENTICATION MIDDLEWARE
// JWT TOKEN VERIFICATION
// ================================================================

const jwt = require("jsonwebtoken");

// ================================================================
// AUTHENTICATE USER
// ================================================================

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ------------------------------------------------------------
    // Authorization header required
    // ------------------------------------------------------------

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required."
      });
    }

    // ------------------------------------------------------------
    // Expected format:
    // Authorization: Bearer <token>
    // ------------------------------------------------------------

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format."
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing."
      });
    }

    // ------------------------------------------------------------
    // JWT secret must exist
    // ------------------------------------------------------------

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured."
      });
    }

    // ------------------------------------------------------------
    // Verify JWT
    // ------------------------------------------------------------

    const decoded = jwt.verify(
      token,
      jwtSecret
    );

    // ------------------------------------------------------------
    // Validate required token information
    // ------------------------------------------------------------

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    // ------------------------------------------------------------
    // Store authenticated user information in request
    // ------------------------------------------------------------

    req.user = {
      userId: decoded.userId,
      email: decoded.email || "",
      name: decoded.name || "",
      role: decoded.role || "",
      studentId: decoded.studentId || ""
    };

    // ------------------------------------------------------------
    // Continue to protected route
    // ------------------------------------------------------------

    next();

  } catch (error) {

    // ------------------------------------------------------------
    // Token expired
    // ------------------------------------------------------------

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired."
      });
    }

    // ------------------------------------------------------------
    // Invalid token
    // ------------------------------------------------------------

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token."
      });
    }

    // ------------------------------------------------------------
    // Unexpected authentication error
    // ------------------------------------------------------------

    console.error(
      "Authentication middleware error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Authentication failed."
    });
  }
};


// ================================================================
// EXPORT
// ================================================================

module.exports = authenticate;