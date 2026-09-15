// ================================================================
// CYBER SECURITY LEARNING PORTAL
// EMAIL SERVICE
// OTP EMAIL DELIVERY
// ================================================================

const nodemailer = require("nodemailer");


// ================================================================
// ENVIRONMENT CONFIGURATION
// ================================================================

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_SECURE =
  String(process.env.EMAIL_SECURE).toLowerCase() === "true";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const EMAIL_FROM =
  process.env.EMAIL_FROM || EMAIL_USER;


// ================================================================
// VALIDATE EMAIL CONFIGURATION
// ================================================================

function validateEmailConfiguration() {
  const missing = [];

  if (!EMAIL_HOST) {
    missing.push("EMAIL_HOST");
  }

  if (!EMAIL_USER) {
    missing.push("EMAIL_USER");
  }

  if (!EMAIL_PASSWORD) {
    missing.push("EMAIL_PASSWORD");
  }

  if (!EMAIL_FROM) {
    missing.push("EMAIL_FROM");
  }

  if (missing.length > 0) {
    throw new Error(
      `Email service configuration missing: ${missing.join(", ")}`
    );
  }
}


// ================================================================
// CREATE SMTP TRANSPORTER
// ================================================================

function createTransporter() {
  validateEmailConfiguration();

  return nodemailer.createTransport({
    host: EMAIL_HOST,

    port: EMAIL_PORT,

    secure: EMAIL_SECURE,

    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    },

    connectionTimeout: 10000,

    greetingTimeout: 10000,

    socketTimeout: 15000
  });
}


// ================================================================
// VERIFY SMTP CONNECTION
// ================================================================

async function verifyEmailConnection() {
  const transporter = createTransporter();

  await transporter.verify();

  return true;
}


// ================================================================
// SEND EMAIL
// ================================================================

async function sendEmail({
  to,
  subject,
  text,
  html
}) {
  if (!to) {
    throw new Error("Recipient email is required.");
  }

  if (!subject) {
    throw new Error("Email subject is required.");
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html
  };

  return await transporter.sendMail(mailOptions);
}


// ================================================================
// SEND OTP EMAIL
// ================================================================

async function sendOTPEmail(
  email,
  name,
  otp
) {
  if (!email) {
    throw new Error("Recipient email is required.");
  }

  if (!otp) {
    throw new Error("OTP is required.");
  }

  const safeName =
    name && String(name).trim()
      ? String(name).trim()
      : "User";

  const subject =
    "Your Cyber Security Portal OTP";

  const text = `
Hello ${safeName},

Your OTP for the Cyber Security Learning Portal is:

${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

If you did not request this OTP, please ignore this email.

Regards,
Cyber Secure Team
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cyber Security Portal OTP</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h2>Cyber Security Portal</h2>

  <p>Hello ${escapeHtml(safeName)},</p>

  <p>
    Your OTP for the Cyber Security Learning Portal is:
  </p>

  <div
    style="
      font-size: 30px;
      font-weight: bold;
      letter-spacing: 8px;
      margin: 20px 0;
    "
  >
    ${escapeHtml(otp)}
  </div>

  <p>
    This OTP is valid for <strong>5 minutes</strong>.
  </p>

  <p>
    <strong>Do not share this OTP with anyone.</strong>
  </p>

  <p>
    If you did not request this OTP, please ignore this email.
  </p>

  <br>

  <p>
    Regards,<br>
    <strong>Cyber Secure Team</strong>
  </p>

</body>
</html>
`.trim();

  return await sendEmail({
    to: email,
    subject,
    text,
    html
  });
}


// ================================================================
// HTML ESCAPE HELPER
// ================================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  sendEmail,
  sendOTPEmail,
  verifyEmailConnection
};