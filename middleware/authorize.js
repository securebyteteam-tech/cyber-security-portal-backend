// ================================================================
// CYBER SECURITY LEARNING PORTAL
// AUTHORIZATION / ROLE-BASED ACCESS CONTROL
// ================================================================

// ================================================================
// AUTHORIZE SPECIFIC ROLES
// ================================================================

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // ------------------------------------------------------------
      // User must already be authenticated
      // ------------------------------------------------------------

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required."
        });
      }

      // ------------------------------------------------------------
      // Role must exist
      // ------------------------------------------------------------

      if (!req.user.role) {
        return res.status(403).json({
          success: false,
          message: "User role is not available."
        });
      }

      // ------------------------------------------------------------
      // Normalize role
      // ------------------------------------------------------------

      const userRole = String(req.user.role)
        .trim()
        .toLowerCase();

      // ------------------------------------------------------------
      // Normalize allowed roles
      // ------------------------------------------------------------

      const roles = allowedRoles.map((role) =>
        String(role).trim().toLowerCase()
      );

      // ------------------------------------------------------------
      // Check whether user's role is authorized
      // ------------------------------------------------------------

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource."
        });
      }

      // ------------------------------------------------------------
      // Authorization successful
      // ------------------------------------------------------------

      next();

    } catch (error) {
      console.error(
        "Authorization middleware error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Authorization failed."
      });
    }
  };
};


// ================================================================
// CONVENIENCE MIDDLEWARES
// ================================================================

const authorizeStudent = authorize("student");

const authorizeTeacher = authorize("teacher");


// ================================================================
// EXPORT
// ================================================================

module.exports = {
  authorize,
  authorizeStudent,
  authorizeTeacher
};