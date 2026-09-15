/* ================================================================
   CYBER SECURITY LEARNING PORTAL
   FRONTEND API SERVICE
   Firebase Compatible
   ================================================================ */

(function () {

    "use strict";

    /* ============================================================
       BACKEND API BASE URL (FIREBASE)
       ============================================================ */

    const API_BASE = "https://cyber-security-portal-backend.onrender.com/api";
    
    // Also export as API_BASE_URL for compatibility
    const API_BASE_URL = API_BASE;

    /* ============================================================
       TOKEN MANAGEMENT
       ============================================================ */

    function getAuthToken() {
        return localStorage.getItem("authToken");
    }

    function setAuthToken(token) {
        if (token) {
            localStorage.setItem("authToken", token);
        }
    }

    function removeAuthToken() {
        localStorage.removeItem("authToken");
    }

    /* ============================================================
       CURRENT USER MANAGEMENT
       ============================================================ */

    function getCurrentUser() {
        try {
            const user = localStorage.getItem("currentUser");
            if (!user) {
                return null;
            }
            return JSON.parse(user);
        } catch (error) {
            console.error("Unable to read current user:", error);
            return null;
        }
    }

    function setCurrentUser(user) {
        if (user) {
            localStorage.setItem("currentUser", JSON.stringify(user));
        }
    }

    function clearCurrentUser() {
        localStorage.removeItem("currentUser");
    }

    /* ============================================================
       COMMON REQUEST HANDLER
       ============================================================ */

    async function apiRequest(endpoint, options = {}) {
        const token = getAuthToken();
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const requestOptions = {
            ...options,
            headers
        };

        let response;

        try {
            const requestUrl = `${API_BASE_URL}${endpoint}`;

            console.log("API Request:", requestUrl);

            response = await fetch(requestUrl, requestOptions);

        } catch (error) {
            console.error("API connection error:", error);
            throw new Error("Unable to connect to backend server.");
        }

        /* ========================================================
           READ RESPONSE
           ======================================================== */

        let data = null;

        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }

        /* ========================================================
           UNAUTHORIZED
           ======================================================== */

        if (response.status === 401) {
            removeAuthToken();
            clearCurrentUser();

            throw new Error(
                data?.message || "Your session has expired. Please login again."
            );
        }

        /* ========================================================
           FORBIDDEN
           ======================================================== */

        if (response.status === 403) {
            throw new Error(
                data?.message || "You do not have permission to perform this action."
            );
        }

        /* ========================================================
           RATE LIMIT
           ======================================================== */

        if (response.status === 429) {
            throw new Error(
                data?.message || "Too many requests. Please wait and try again."
            );
        }

        /* ========================================================
           OTHER HTTP ERRORS
           ======================================================== */

        if (!response.ok) {
            console.error("API Error:", response.status, data);
            throw new Error(
                data?.message || `Request failed with status ${response.status}.`
            );
        }

        return data;
    }

    /* ============================================================
       GET REQUEST
       ============================================================ */

    async function apiGet(endpoint, params = {}) {
        const query = new URLSearchParams();

        Object.keys(params).forEach(function (key) {
            const value = params[key];

            if (value !== undefined && value !== null && value !== "") {
                query.append(key, value);
            }
        });

        const queryString = query.toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return apiRequest(url, { method: "GET" });
    }

    /* ============================================================
       POST REQUEST
       ============================================================ */

    async function apiPost(endpoint, body = {}) {
        return apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(body)
        });
    }

    /* ============================================================
       PUT REQUEST
       ============================================================ */

    async function apiPut(endpoint, body = {}) {
        return apiRequest(endpoint, {
            method: "PUT",
            body: JSON.stringify(body)
        });
    }

    /* ============================================================
       PATCH REQUEST
       ============================================================ */

    async function apiPatch(endpoint, body = {}) {
        return apiRequest(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body)
        });
    }

    /* ============================================================
       DELETE REQUEST
       ============================================================ */

    async function apiDelete(endpoint) {
        return apiRequest(endpoint, { method: "DELETE" });
    }

    /* ============================================================
       AUTHENTICATION API
       ============================================================ */

    async function sendOTP(email, name) {
        if (!email || !name) {
            throw new Error("Email and name are required.");
        }

        console.log("Sending OTP:", email);

        return apiPost("/auth/send-otp", {
            email: email,
            name: name
        });
    }

    async function verifyOTP(email, otp) {
        if (!email || !otp) {
            throw new Error("Email and OTP are required.");
        }

        const data = await apiPost("/auth/verify-otp", {
            email: email,
            otp: otp
        });

        /* ========================================================
           SAVE JWT
           ======================================================== */

        if (data && data.token) {
            setAuthToken(data.token);
        }

        /* ========================================================
           SAVE USER
           ======================================================== */

        if (data && data.user) {
            setCurrentUser(data.user);
        }

        return data;
    }

    async function logoutUser() {
        try {
            await apiPost("/auth/logout");
        } catch (error) {
            console.warn("Logout request failed:", error);
        } finally {
            removeAuthToken();
            clearCurrentUser();
        }
    }

    /* ============================================================
       USER API
       ============================================================ */

    async function getMyProfile() {
        return apiGet("/users/me");
    }

    async function getUsers() {
        return apiGet("/users");
    }

    async function getStudents() {
        return apiGet("/users/students");
    }

    async function getStudent(studentId) {
        return apiGet(`/users/student/${encodeURIComponent(studentId)}`);
    }

    async function getUserByEmail(email) {
        return apiGet(`/users/email/${encodeURIComponent(email)}`);
    }

    /* ============================================================
       ATTENDANCE API
       ============================================================ */

    async function getMyAttendance() {
        return apiGet("/attendance/me");
    }

    async function getMyAttendanceSummary() {
        return apiGet("/attendance/me/summary");
    }

    async function getAttendance() {
        return apiGet("/attendance");
    }

    async function getStudentAttendance(studentId) {
        return apiGet(`/attendance/student/${encodeURIComponent(studentId)}`);
    }

    /* ============================================================
       SCORE API
       ============================================================ */

    async function getMyScores() {
        return apiGet("/scores/me");
    }

    async function getMyScoreSummary() {
        return apiGet("/scores/me/summary");
    }

    async function getScores() {
        return apiGet("/scores");
    }

    async function getStudentScores(studentId) {
        return apiGet(`/scores/student/${encodeURIComponent(studentId)}`);
    }

    /* ============================================================
       MATERIALS API
       ============================================================ */

    async function getMaterials(type = "") {
        if (type) {
            return apiGet(`/materials/type/${encodeURIComponent(type)}`);
        }
        return apiGet("/materials");
    }

    async function getMaterial(materialId) {
        return apiGet(`/materials/${encodeURIComponent(materialId)}`);
    }

    async function getAllMaterialsForTeacher() {
        return apiGet("/materials/teacher/all");
    }

    /* ============================================================
       CHAT API
       ============================================================ */

    async function getStudentMessages() {
        return apiGet("/chat/student");
    }

    async function getTeacherMessages() {
        return apiGet("/chat/teacher");
    }

    async function getTeacherStudentMessages(email) {
        return apiGet(`/chat/teacher/student/${encodeURIComponent(email)}`);
    }

    async function sendChatMessage(message) {
        return apiPost("/chat/message", { message: message });
    }

    async function sendChatReply(email, message) {
        return apiPost("/chat/reply", {
            email: email,
            message: message
        });
    }

    async function sendBroadcastMessage(message) {
        return apiPost("/chat/broadcast", { message: message });
    }

    async function markMessageAsRead(messageId) {
        return apiPatch(`/chat/${encodeURIComponent(messageId)}/read`);
    }

    async function getUnreadCount() {
        return apiGet("/chat/unread-count");
    }

    /* ============================================================
       BACKEND HEALTH CHECK
       ============================================================ */

    async function checkBackendHealth() {
        try {
            const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
            const response = await fetch(`${baseUrl}/health`);

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data?.success === true;

        } catch (error) {
            console.error("Backend health check failed:", error);
            return false;
        }
    }

    /* ============================================================
       API OBJECT
       ============================================================ */

    const API = {
        auth: {
            sendOTP,
            verifyOTP,
            logout: logoutUser
        },

        users: {
            getMe: getMyProfile,
            getUsers,
            getStudents,
            getStudent,
            getUserByEmail
        },

        attendance: {
            getMy: getMyAttendance,
            getMySummary: getMyAttendanceSummary,
            getAll: getAttendance,
            getStudent: getStudentAttendance
        },

        scores: {
            getMy: getMyScores,
            getMySummary: getMyScoreSummary,
            getAll: getScores,
            getStudent: getStudentScores
        },

        materials: {
            getAll: getMaterials,
            getOne: getMaterial,
            getTeacherAll: getAllMaterialsForTeacher
        },

        chat: {
            getStudentMessages,
            getTeacherMessages,
            getTeacherStudentMessages,
            sendMessage: sendChatMessage,
            sendReply: sendChatReply,
            sendBroadcast: sendBroadcastMessage,
            markAsRead: markMessageAsRead,
            getUnreadCount
        },

        health: {
            check: checkBackendHealth
        }
    };

    /* ============================================================
       GLOBAL EXPORTS
       ============================================================ */

    window.API = API;
    window.api = {
        /* Authentication */
        sendOTP,
        verifyOTP,
        logoutUser,

        /* Users */
        getMyProfile,
        getUsers,
        getStudents,
        getStudent,
        getUserByEmail,

        /* Attendance */
        getMyAttendance,
        getMyAttendanceSummary,
        getAttendance,
        getStudentAttendance,

        /* Scores */
        getMyScores,
        getMyScoreSummary,
        getScores,
        getStudentScores,

        /* Materials */
        getMaterials,
        getMaterial,
        getAllMaterialsForTeacher,

        /* Chat */
        getStudentMessages,
        getTeacherMessages,
        getTeacherStudentMessages,
        sendChatMessage,
        sendChatReply,
        sendBroadcastMessage,
        markMessageAsRead,
        getUnreadCount,

        /* Health */
        checkBackendHealth
    };

    // Export API_BASE_URL for compatibility
    window.API_BASE_URL = API_BASE_URL;
    window.API_BASE = API_BASE;

    /* ============================================================
       LOW-LEVEL API EXPORTS
       ============================================================ */

    window.apiRequest = apiRequest;
    window.apiGet = apiGet;
    window.apiPost = apiPost;
    window.apiPut = apiPut;
    window.apiPatch = apiPatch;
    window.apiDelete = apiDelete;

    /* ============================================================
       AUTH EXPORTS
       ============================================================ */

    window.getAuthToken = getAuthToken;
    window.setAuthToken = setAuthToken;
    window.removeAuthToken = removeAuthToken;

    window.getCurrentUser = getCurrentUser;
    window.setCurrentUser = setCurrentUser;
    window.clearCurrentUser = clearCurrentUser;

    window.sendOTP = sendOTP;
    window.verifyOTP = verifyOTP;
    window.logoutUser = logoutUser;

    /* ============================================================
       USER EXPORTS
       ============================================================ */

    window.getMyProfile = getMyProfile;
    window.getUsers = getUsers;
    window.getStudents = getStudents;
    window.getStudent = getStudent;
    window.getUserByEmail = getUserByEmail;

    /* ============================================================
       ATTENDANCE EXPORTS
       ============================================================ */

    window.getMyAttendance = getMyAttendance;
    window.getMyAttendanceSummary = getMyAttendanceSummary;
    window.getAttendance = getAttendance;
    window.getStudentAttendance = getStudentAttendance;

    /* ============================================================
       SCORE EXPORTS
       ============================================================ */

    window.getMyScores = getMyScores;
    window.getMyScoreSummary = getMyScoreSummary;
    window.getScores = getScores;
    window.getStudentScores = getStudentScores;

    /* ============================================================
       MATERIAL EXPORTS
       ============================================================ */

    window.getMaterials = getMaterials;
    window.getMaterial = getMaterial;
    window.getAllMaterialsForTeacher = getAllMaterialsForTeacher;

    /* ============================================================
       CHAT EXPORTS
       ============================================================ */

    window.getStudentMessages = getStudentMessages;
    window.getTeacherMessages = getTeacherMessages;
    window.getTeacherStudentMessages = getTeacherStudentMessages;
    window.sendChatMessage = sendChatMessage;
    window.sendChatReply = sendChatReply;
    window.sendBroadcastMessage = sendBroadcastMessage;
    window.markMessageAsRead = markMessageAsRead;
    window.getUnreadCount = getUnreadCount;

    /* ============================================================
       HEALTH EXPORT
       ============================================================ */

    window.checkBackendHealth = checkBackendHealth;

    /* ============================================================
       INITIALIZATION LOG
       ============================================================ */

    console.log("API service initialized.");
    console.log("API Base URL:", API_BASE_URL);
    console.log("Global API object:", window.api);

})();