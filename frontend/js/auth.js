// ================================================================
// CYBER SECURITY LEARNING PORTAL
// FRONTEND AUTHENTICATION
// Email + OTP
// ================================================================


"use strict";


// ================================================================
// SEND OTP
// ================================================================


async function handleSendOTP() {
  const emailInput = document.getElementById("loginEmail");
  const nameInput = document.getElementById("loginName");
  const message = document.getElementById("loginMessage");
  const button = document.getElementById("sendOtpBtn");


  const email = emailInput ? emailInput.value.trim() : "";
  const name = nameInput ? nameInput.value.trim() : "";


  console.log("Email:", email);
  console.log("Name:", name);


  if (!email) {
    showLoginMessage("Please enter your registered email address.", true);
    return;
  }


  if (!name) {
    showLoginMessage("Please enter your full name.", true);
    return;
  }


  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showLoginMessage("Please enter a valid email address.", true);
    return;
  }


  try {
    if (button) {
      button.disabled = true;
      button.textContent = "⏳ SENDING OTP...";
    }


    showLoginMessage("Checking your account and sending OTP...", false);


    // FIXED: Pass email and name as separate arguments
    const response = await api.sendOTP(email, name);


    if (!response || response.success === false) {
      throw new Error(
        response && response.message
          ? response.message
          : "Unable to send OTP."
      );
    }


    // Save login details for OTP verification
    sessionStorage.setItem("pendingLoginEmail", email);
    sessionStorage.setItem("pendingLoginName", name);


    // Hide login screen
    const loginScreen = document.getElementById("loginScreen");
    const otpScreen = document.getElementById("otpScreen");


    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }


    if (otpScreen) {
      otpScreen.classList.remove("hidden");
    }


    const otpInput = document.getElementById("otpInput");


    if (otpInput) {
      otpInput.value = "";
      setTimeout(() => otpInput.focus(), 100);
    }


    showOTPMessage(
      response.message ||
        "OTP sent successfully. Please check your registered email.",
      false
    );


  } catch (error) {
    console.error("SEND OTP ERROR:", error);


    showLoginMessage(
      error.message || "Unable to send OTP. Please try again.",
      true
    );


  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "🔑 GET SECURE OTP →";
    }
  }
}


// ================================================================
// VERIFY OTP
// ================================================================


async function handleVerifyOTP() {
  const email =
    sessionStorage.getItem("pendingLoginEmail") ||
    document.getElementById("loginEmail")?.value.trim() ||
    "";


  const otpInput = document.getElementById("otpInput");
  const button = document.getElementById("verifyOtpBtn");


  const otp = otpInput ? otpInput.value.trim() : "";


  if (!email) {
    showOTPMessage(
      "Login session expired. Please enter your email again.",
      true
    );
    backToLogin();
    return;
  }


  if (!/^\d{6}$/.test(otp)) {
    showOTPMessage("Please enter the 6-digit OTP.", true);
    return;
  }


  try {
    if (button) {
      button.disabled = true;
      button.textContent = "⏳ VERIFYING...";
    }


    showOTPMessage("Verifying OTP...", false);


    // FIXED: Pass email and otp as separate arguments
    const response = await api.verifyOTP(email, otp);


    if (!response || response.success === false) {
      throw new Error(
        response && response.message
          ? response.message
          : "OTP verification failed."
      );
    }


    // ------------------------------------------------------------
    // Save authentication data
    // ------------------------------------------------------------


    if (response.token) {
      localStorage.setItem("token", response.token);
      localStorage.setItem("authToken", response.token);
    }


    if (response.user) {
      localStorage.setItem(
        "currentUser",
        JSON.stringify(response.user)
      );


      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );
    }


    sessionStorage.removeItem("pendingLoginEmail");
    sessionStorage.removeItem("pendingLoginName");


    // ------------------------------------------------------------
    // Show dashboard
    // ------------------------------------------------------------


    const loginScreen = document.getElementById("loginScreen");
    const otpScreen = document.getElementById("otpScreen");
    const dashboardScreen =
      document.getElementById("dashboardScreen");


    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }


    if (otpScreen) {
      otpScreen.classList.add("hidden");
    }


    if (dashboardScreen) {
      dashboardScreen.classList.remove("hidden");
    }


    // Update user information
    updateUserInterface(response.user);


    // Load dashboard data
    if (typeof loadDashboard === "function") {
      await loadDashboard();
    }


    // Load materials if function exists
    if (typeof loadMaterials === "function") {
      await loadMaterials();
    }


    showDashboard();


  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);


    showOTPMessage(
      error.message || "OTP verification failed. Please try again.",
      true
    );


  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "✅ VERIFY & LOGIN →";
    }
  }
}


// ================================================================
// BACK TO LOGIN
// ================================================================


function backToLogin() {
  const loginScreen = document.getElementById("loginScreen");
  const otpScreen = document.getElementById("otpScreen");


  if (otpScreen) {
    otpScreen.classList.add("hidden");
  }


  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }


  const otpInput = document.getElementById("otpInput");


  if (otpInput) {
    otpInput.value = "";
  }


  sessionStorage.removeItem("pendingLoginEmail");
  sessionStorage.removeItem("pendingLoginName");


  showLoginMessage("", false);
}


// ================================================================
// LOGOUT
// ================================================================


async function logout() {
  try {
    if (
      typeof api !== "undefined" &&
      typeof api.logoutUser === "function"
    ) {
      await api.logoutUser();
    }
  } catch (error) {
    console.warn("Logout API error:", error);
  }


  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("user");


  sessionStorage.removeItem("pendingLoginEmail");
  sessionStorage.removeItem("pendingLoginName");


  const dashboardScreen =
    document.getElementById("dashboardScreen");


  const loginScreen =
    document.getElementById("loginScreen");


  const otpScreen =
    document.getElementById("otpScreen");


  if (dashboardScreen) {
    dashboardScreen.classList.add("hidden");
  }


  if (otpScreen) {
    otpScreen.classList.add("hidden");
  }


  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }


  const emailInput =
    document.getElementById("loginEmail");


  const nameInput =
    document.getElementById("loginName");


  if (emailInput) emailInput.value = "";
  if (nameInput) nameInput.value = "";


  showLoginMessage("", false);
}


// ================================================================
// UPDATE USER INTERFACE
// ================================================================


function updateUserInterface(user) {
  if (!user) return;


  const name = user.name || "";
  const email = user.email || "";
  const role = user.role || "student";
  const studentId = user.studentId || "";


  setText("sidebarName", name);
  setText("sidebarEmail", email);
  setText("sidebarRole", role);
  setText("sidebarStudentId", studentId);


  setText("dashboardUserName", name);
  setText("dashboardRoleText", role);
  setText("dashboardName", name);


  // Teacher-only navigation
  const studentsNav =
    document.getElementById("studentsNav");


  if (studentsNav) {
    if (String(role).toLowerCase() === "teacher") {
      studentsNav.classList.remove("hidden");
    } else {
      studentsNav.classList.add("hidden");
    }
  }
}


// ================================================================
// SHOW DASHBOARD
// ================================================================


function showDashboard() {
  const dashboardScreen =
    document.getElementById("dashboardScreen");


  if (dashboardScreen) {
    dashboardScreen.classList.remove("hidden");
  }
}


// ================================================================
// MESSAGE HELPERS
// ================================================================


function showLoginMessage(text, isError) {
  const element =
    document.getElementById("loginMessage");


  if (!element) return;


  element.textContent = text || "";


  element.style.display = text ? "block" : "none";


  if (isError) {
    element.classList.add("error");
  } else {
    element.classList.remove("error");
  }
}


function showOTPMessage(text, isError) {
  const element =
    document.getElementById("otpMessage");


  if (!element) return;


  element.textContent = text || "";


  element.style.display = text ? "block" : "none";


  if (isError) {
    element.classList.add("error");
  } else {
    element.classList.remove("error");
  }
}


// ================================================================
// TEXT HELPER
// ================================================================


function setText(id, value) {
  const element = document.getElementById(id);


  if (element) {
    element.textContent = value ?? "";
  }
}


// ================================================================
// AUTO LOGIN FROM STORED TOKEN
// ================================================================


document.addEventListener("DOMContentLoaded", function () {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken");


    const storedUser =
      localStorage.getItem("currentUser") ||
      localStorage.getItem("user");


    if (!token || !storedUser) {
      return;
    }


    const user = JSON.parse(storedUser);


    const loginScreen =
      document.getElementById("loginScreen");


    const otpScreen =
      document.getElementById("otpScreen");


    const dashboardScreen =
      document.getElementById("dashboardScreen");


    if (loginScreen) {
      loginScreen.classList.add("hidden");
    }


    if (otpScreen) {
      otpScreen.classList.add("hidden");
    }


    if (dashboardScreen) {
      dashboardScreen.classList.remove("hidden");
    }


    updateUserInterface(user);


    if (typeof loadDashboard === "function") {
      loadDashboard();
    }


  } catch (error) {
    console.warn("AUTO LOGIN ERROR:", error);


    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("user");
  }
});