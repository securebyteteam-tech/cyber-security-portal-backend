// ================================================================
// CYBER SECURITY LEARNING PORTAL
// OTP SERVICE
// OTP Generation + Hashing + Storage + Verification
// ================================================================

const crypto = require("crypto");

const OTP = require("../models/OTP");


// ================================================================
// CONFIGURATION
// ================================================================

const OTP_LENGTH = 6;

const OTP_EXPIRY_MINUTES = 5;

const MAX_OTP_ATTEMPTS = 5;


// ================================================================
// GENERATE OTP
// ================================================================

function generateOTP() {
  const minimum =
    10 ** (OTP_LENGTH - 1);

  const maximum =
    10 ** OTP_LENGTH;

  return crypto
    .randomInt(
      minimum,
      maximum
    )
    .toString();
}


// ================================================================
// HASH OTP
// ================================================================

function hashOTP(otp) {
  return crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");
}


// ================================================================
// SAFE OTP COMPARISON
// ================================================================

function compareOTP(
  enteredOTP,
  storedHash
) {
  if (
    !enteredOTP ||
    !storedHash
  ) {
    return false;
  }

  const enteredHash =
    hashOTP(enteredOTP);

  if (
    enteredHash.length !==
    storedHash.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(enteredHash),
    Buffer.from(storedHash)
  );
}


// ================================================================
// CREATE AND STORE OTP
// ================================================================

async function createOTP({
  email,
  ipAddress = "",
  userAgent = ""
}) {
  if (!email) {
    throw new Error(
      "Email is required to generate OTP."
    );
  }

  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  // --------------------------------------------------------------
  // Generate OTP
  // --------------------------------------------------------------

  const otp =
    generateOTP();

  // --------------------------------------------------------------
  // Hash OTP
  // --------------------------------------------------------------

  const otpHash =
    hashOTP(otp);

  // --------------------------------------------------------------
  // Expiry
  // --------------------------------------------------------------

  const expiresAt =
    new Date(
      Date.now() +
      OTP_EXPIRY_MINUTES *
      60 *
      1000
    );

  // --------------------------------------------------------------
  // Remove previous unverified OTPs
  // --------------------------------------------------------------

  await OTP.deleteMany({
    email: normalizedEmail,
    verified: false
  });

  // --------------------------------------------------------------
  // Store only hashed OTP
  // --------------------------------------------------------------

  await OTP.create({
    email: normalizedEmail,

    otpHash,

    expiresAt,

    attempts: 0,

    maxAttempts:
      MAX_OTP_ATTEMPTS,

    verified: false,

    ipAddress,

    userAgent
  });

  // --------------------------------------------------------------
  // Return OTP to caller
  // --------------------------------------------------------------
  // The caller uses this only to send the OTP by email.
  // Plaintext OTP is NOT stored in MongoDB.
  // --------------------------------------------------------------

  return {
    otp,

    expiresAt,

    expiresIn:
      OTP_EXPIRY_MINUTES * 60
  };
}


// ================================================================
// VERIFY OTP
// ================================================================

async function verifyOTP({
  email,
  otp
}) {
  if (!email) {
    return {
      success: false,
      reason: "EMAIL_REQUIRED"
    };
  }

  if (!otp) {
    return {
      success: false,
      reason: "OTP_REQUIRED"
    };
  }

  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  // --------------------------------------------------------------
  // Find latest unverified OTP
  // --------------------------------------------------------------

  const otpRecord =
    await OTP
      .findOne({
        email: normalizedEmail,
        verified: false
      })
      .select("+otpHash")
      .sort({
        createdAt: -1
      });

  if (!otpRecord) {
    return {
      success: false,
      reason: "OTP_NOT_FOUND"
    };
  }

  // --------------------------------------------------------------
  // Check expiry
  // --------------------------------------------------------------

  if (
    !otpRecord.expiresAt ||
    otpRecord.expiresAt.getTime() <=
      Date.now()
  ) {

    await OTP.deleteOne({
      _id: otpRecord._id
    });

    return {
      success: false,
      reason: "OTP_EXPIRED"
    };
  }

  // --------------------------------------------------------------
  // Check maximum attempts
  // --------------------------------------------------------------

  if (
    otpRecord.attempts >=
    otpRecord.maxAttempts
  ) {

    await OTP.deleteOne({
      _id: otpRecord._id
    });

    return {
      success: false,
      reason: "MAX_ATTEMPTS_EXCEEDED"
    };
  }

  // --------------------------------------------------------------
  // Compare entered OTP with stored hash
  // --------------------------------------------------------------

  const isValid =
    compareOTP(
      String(otp).trim(),
      otpRecord.otpHash
    );

  // --------------------------------------------------------------
  // Invalid OTP
  // --------------------------------------------------------------

  if (!isValid) {

    otpRecord.attempts += 1;

    await otpRecord.save();

    const attemptsRemaining =
      Math.max(
        0,
        otpRecord.maxAttempts -
        otpRecord.attempts
      );

    return {
      success: false,
      reason: "INVALID_OTP",
      attemptsRemaining
    };
  }

  // --------------------------------------------------------------
  // Valid OTP
  // --------------------------------------------------------------

  otpRecord.verified = true;

  await otpRecord.save();

  return {
    success: true,
    reason: "OTP_VERIFIED"
  };
}


// ================================================================
// DELETE EXPIRED OTPs
// ================================================================
// MongoDB TTL index normally handles this automatically.
// This helper can be used for manual cleanup if required.
// ================================================================

async function deleteExpiredOTPs() {

  const result =
    await OTP.deleteMany({
      expiresAt: {
        $lte: new Date()
      }
    });

  return {
    deletedCount:
      result.deletedCount || 0
  };
}


// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  createOTP,
  verifyOTP,
  deleteExpiredOTPs
};