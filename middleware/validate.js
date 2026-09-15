// ================================================================
// CYBER SECURITY LEARNING PORTAL
// REQUEST VALIDATION & SANITIZATION MIDDLEWARE
// Express.js
// ================================================================

// ================================================================
// BASIC HELPERS
// ================================================================

const isObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};


const cleanString = (value, maxLength = 500) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\0/g, "")
    .slice(0, maxLength);
};


const cleanEmail = (value) => {
  return cleanString(value, 254).toLowerCase();
};


const cleanStudentId = (value) => {
  return cleanString(value, 100);
};


// ================================================================
// EMAIL VALIDATION
// ================================================================

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  if (email.length > 254) {
    return false;
  }

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  return emailRegex.test(email);
};


// ================================================================
// OTP VALIDATION
// ================================================================

const isValidOTP = (otp) => {
  return (
    typeof otp === "string" &&
    /^\d{6}$/.test(otp)
  );
};


// ================================================================
// NAME VALIDATION
// ================================================================

const isValidName = (name) => {
  if (
    typeof name !== "string" ||
    name.length < 2 ||
    name.length > 100
  ) {
    return false;
  }

  // Allows normal names with spaces, dots, apostrophes and hyphens.
  return /^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(name);
};


// ================================================================
// STUDENT ID VALIDATION
// ================================================================

const isValidStudentId = (studentId) => {
  if (
    typeof studentId !== "string" ||
    studentId.length < 1 ||
    studentId.length > 100
  ) {
    return false;
  }

  // Student IDs should contain only safe identifier characters.
  return /^[A-Za-z0-9._/-]+$/.test(studentId);
};


// ================================================================
// CHAT MESSAGE VALIDATION
// ================================================================

const isValidMessage = (message) => {
  if (
    typeof message !== "string" ||
    message.trim().length < 1 ||
    message.length > 1000
  ) {
    return false;
  }

  return true;
};


// ================================================================
// VALIDATE EMAIL + NAME
// ================================================================

const validateLoginRequest = (req, res, next) => {
  const email = cleanEmail(req.body.email);
  const name = cleanString(req.body.name, 100);

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address."
    });
  }

  if (!isValidName(name)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid name."
    });
  }

  // Replace original values with sanitized values.
  req.body.email = email;
  req.body.name = name;

  next();
};


// ================================================================
// VALIDATE OTP REQUEST
// ================================================================

const validateOTPRequest = (req, res, next) => {
  const email = cleanEmail(req.body.email);

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address."
    });
  }

  req.body.email = email;

  next();
};


// ================================================================
// VALIDATE OTP VERIFICATION
// ================================================================

const validateOTPVerification = (req, res, next) => {
  const email = cleanEmail(req.body.email);
  const otp = cleanString(req.body.otp, 6);

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address."
    });
  }

  if (!isValidOTP(otp)) {
    return res.status(400).json({
      success: false,
      message: "OTP must be exactly 6 digits."
    });
  }

  req.body.email = email;
  req.body.otp = otp;

  next();
};


// ================================================================
// VALIDATE STUDENT ID
// ================================================================

const validateStudentId = (req, res, next) => {
  const studentId = cleanStudentId(
    req.body.studentId ||
    req.query.studentId ||
    req.params.studentId
  );

  if (!studentId || !isValidStudentId(studentId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid student ID."
    });
  }

  // Store validated value for controller use.
  req.validatedStudentId = studentId;

  next();
};


// ================================================================
// VALIDATE CHAT MESSAGE
// ================================================================

const validateChatMessage = (req, res, next) => {
  const message = cleanString(
    req.body.message,
    1000
  );

  if (!isValidMessage(message)) {
    return res.status(400).json({
      success: false,
      message: "Message must contain between 1 and 1000 characters."
    });
  }

  req.body.message = message;

  next();
};


// ================================================================
// VALIDATE BROADCAST MESSAGE
// ================================================================

const validateBroadcastMessage = (req, res, next) => {
  const message = cleanString(
    req.body.message,
    1000
  );

  if (!isValidMessage(message)) {
    return res.status(400).json({
      success: false,
      message: "Message must contain between 1 and 1000 characters."
    });
  }

  req.body.message = message;

  next();
};


// ================================================================
// VALIDATE REQUEST BODY
// ================================================================

const validateBodyObject = (req, res, next) => {
  if (!isObject(req.body)) {
    return res.status(400).json({
      success: false,
      message: "Invalid request body."
    });
  }

  next();
};


// ================================================================
// EXPORT
// ================================================================

module.exports = {
  cleanString,
  cleanEmail,
  cleanStudentId,

  isValidEmail,
  isValidOTP,
  isValidName,
  isValidStudentId,
  isValidMessage,

  validateBodyObject,
  validateLoginRequest,
  validateOTPRequest,
  validateOTPVerification,
  validateStudentId,
  validateChatMessage,
  validateBroadcastMessage
};