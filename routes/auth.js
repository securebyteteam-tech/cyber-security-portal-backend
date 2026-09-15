require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// ================================================================
// CONFIG
// ================================================================

const { connectDatabase } = require("../config/database");

// ================================================================
// MIDDLEWARE
// ================================================================

const { apiLimiter } = require("./middleware/rateLimiter");
const {
  notFound,
  errorHandler
} = require("./middleware/errorHandler");

// ================================================================
// ROUTES
// ================================================================

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const attendanceRoutes = require("./routes/attendance");
const scoreRoutes = require("./routes/scores");
const materialRoutes = require("./routes/materials");
const chatRoutes = require("./routes/chat");

// ================================================================
// APP
// ================================================================

const app = express();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ================================================================
// SECURITY MIDDLEWARE
// ================================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

// ================================================================
// CORS - FIREBASE OPTIMIZED
// ================================================================

const allowedOrigins = [
  // Firebase Hosting (Production)
  "https://cyber-security-student-portal.web.app",
  "https://cyber-security-student-portal.firebaseapp.com",
  
  // Local development (agar test karna ho)
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin (Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("========================================");
      console.warn("CORS BLOCKED");
      console.warn("Origin:", origin);
      console.warn("========================================");

      return callback(
        new Error("CORS origin not allowed")
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ],

    optionsSuccessStatus: 204
  })
);

// ================================================================
// BODY PARSING
// ================================================================

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "1mb"
  })
);

// ================================================================
// GENERAL API RATE LIMITER
// ================================================================

app.use("/api", apiLimiter);

// ================================================================
// HEALTH CHECK
// ================================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cyber Security Portal Backend is running",
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cyber Security Portal backend is running.",
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ================================================================
// API ROUTES
// ================================================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/chat", chatRoutes);

// ================================================================
// API INFORMATION
// ================================================================

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cyber Security Learning Portal API",
    version: "1.0.0"
  });
});

// ================================================================
// 404 HANDLER
// ================================================================

app.use(notFound);

// ================================================================
// GLOBAL ERROR HANDLER
// ================================================================

app.use(errorHandler);

// ================================================================
// DATABASE CONNECTION (FIREBASE COMPATIBLE)
// ================================================================

let dbConnected = false;

const initializeDatabase = async () => {
  if (dbConnected) return;
  
  try {
    await connectDatabase();
    dbConnected = true;
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
  }
};

// Initialize DB on first request (lazy loading for Firebase)
app.use((req, res, next) => {
  if (!dbConnected) {
    initializeDatabase().then(() => {
      next();
    }).catch((err) => {
      console.error("DB init error:", err);
      next(err);
    });
  } else {
    next();
  }
});

// ================================================================
// FIREBASE FUNCTIONS EXPORT
// ================================================================

// For Firebase Cloud Functions
if (process.env.FIREBASE_RUNTIME) {
  const functions = require("firebase-functions");
  
  // Export as HTTPS function
  module.exports = {
    app: functions.https.onRequest((req, res) => {
      // Handle CORS preflight
      if (req.method === "OPTIONS") {
        return res.status(204).send();
      }
      
      // Pass request to Express
      app(req, res);
    })
  };
}

// ================================================================
// STANDALONE SERVER (For testing if needed)
// ================================================================

const startServer = async () => {
  try {
    await connectDatabase();
    
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log("");
      console.log("==============================================");
      console.log(" Cyber Security Portal Backend");
      console.log("==============================================");
      console.log(` Environment : ${NODE_ENV}`);
      console.log(` Port        : ${PORT}`);
      console.log(` API         : http://localhost:${PORT}/api`);
      console.log(` Health      : http://localhost:${PORT}/health`);
      console.log("==============================================");
      console.log("");
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down...`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });
      
      setTimeout(() => {
        console.error("Forced shutdown after timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

// Only start server if NOT in Firebase environment
if (!process.env.FIREBASE_RUNTIME) {
  startServer();
}

// ================================================================
// EXPORT APP
// ================================================================

module.exports.app = app;