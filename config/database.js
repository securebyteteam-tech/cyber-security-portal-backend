// ================================================================
// CYBER SECURITY LEARNING PORTAL
// MONGODB DATABASE CONNECTION
// Node.js + Express + MongoDB Atlas
// ================================================================

const mongoose = require("mongoose");

// ================================================================
// DATABASE CONFIGURATION
// ================================================================

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is not defined in environment variables."
      );
    }

    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,

      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,

      family: 4
    });

    console.log(
      `MongoDB connected successfully: ${connection.connection.host}`
    );

    console.log(
      `Database: ${connection.connection.name}`
    );

    return connection;
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
};

// ================================================================
// DATABASE CONNECTION EVENTS
// ================================================================

mongoose.connection.on("connected", () => {
  console.log("MongoDB connection established.");
});

mongoose.connection.on("error", (error) => {
  console.error(
    "MongoDB connection error:",
    error.message
  );
});

mongoose.connection.on("disconnected", () => {
  console.warn(
    "MongoDB connection disconnected."
  );
});

// ================================================================
// GRACEFUL SHUTDOWN
// ================================================================

const closeDatabase = async () => {
  try {
    await mongoose.connection.close();

    console.log(
      "MongoDB connection closed."
    );
  } catch (error) {
    console.error(
      "Error while closing MongoDB connection:",
      error.message
    );
  }
};

process.on("SIGINT", async () => {
  await closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabase();
  process.exit(0);
});

// ================================================================
// EXPORT
// ================================================================

module.exports = {
  connectDatabase,
  closeDatabase
};