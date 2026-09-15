// ================================================================
// CYBER SECURITY LEARNING PORTAL
// CENTRAL ERROR HANDLER
// Express.js
// ================================================================

// ================================================================
// 404 - ROUTE NOT FOUND
// ================================================================

const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
};


// ================================================================
// GLOBAL ERROR HANDLER
// ================================================================

const errorHandler = (err, req, res, next) => {
  // --------------------------------------------------------------
  // Log complete error on server
  // --------------------------------------------------------------

  console.error("========================================");
  console.error("SERVER ERROR");
  console.error("Method:", req.method);
  console.error("Path:", req.originalUrl);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);
  console.error("========================================");

  // --------------------------------------------------------------
  // Default values
  // --------------------------------------------------------------

  let statusCode = err.statusCode || err.status || 500;

  let message =
    err.message || "An unexpected server error occurred.";

  // --------------------------------------------------------------
  // Keep status code valid
  // --------------------------------------------------------------

  if (
    typeof statusCode !== "number" ||
    statusCode < 400 ||
    statusCode > 599
  ) {
    statusCode = 500;
  }

  // --------------------------------------------------------------
  // Mongoose validation error
  // --------------------------------------------------------------

  if (err.name === "ValidationError") {
    statusCode = 400;

    message = "Invalid data provided.";
  }

  // --------------------------------------------------------------
  // Mongoose CastError
  // --------------------------------------------------------------

  if (err.name === "CastError") {
    statusCode = 400;

    message = "Invalid data format.";
  }

  // --------------------------------------------------------------
  // MongoDB duplicate key error
  // --------------------------------------------------------------

  if (err.code === 11000) {
    statusCode = 409;

    message = "A record with the provided information already exists.";
  }

  // --------------------------------------------------------------
  // JWT errors
  // --------------------------------------------------------------

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;

    message = "Invalid authentication token.";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;

    message = "Authentication token has expired.";
  }

  // --------------------------------------------------------------
  // Production response
  // --------------------------------------------------------------

  const response = {
    success: false,
    message
  };

  // --------------------------------------------------------------
  // Development-only debugging information
  // --------------------------------------------------------------

  if (process.env.NODE_ENV !== "production") {
    response.error = {
      name: err.name,
      stack: err.stack
    };
  }

  return res.status(statusCode).json(response);
};


// ================================================================
// EXPORT
// ================================================================

module.exports = {
  notFound,
  errorHandler
};