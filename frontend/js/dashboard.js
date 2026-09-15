/* ================================================================
   CYBER SECURITY LEARNING PORTAL
   DASHBOARD MODULE
   ================================================================ */

(function () {
    "use strict";

    let initialized = false;


    /* ============================================================
       DOM HELPERS
       ============================================================ */

    function getElement(ids) {
        for (let i = 0; i < ids.length; i++) {
            const element = document.getElementById(ids[i]);

            if (element) {
                return element;
            }
        }

        return null;
    }


    function setText(ids, value) {
        const element = getElement(ids);

        if (element) {
            element.textContent =
                value === null || value === undefined
                    ? ""
                    : value;
        }
    }


    function showElement(ids) {
        const element = getElement(ids);

        if (element) {
            element.style.display = "";
        }
    }


    function hideElement(ids) {
        const element = getElement(ids);

        if (element) {
            element.style.display = "none";
        }
    }


    /* ============================================================
       USER
       ============================================================ */

    function getUser() {
        if (typeof getCurrentUser === "function") {
            return getCurrentUser();
        }

        return null;
    }


    function getRole() {
        const user = getUser();

        return String(
            user?.role || ""
        ).toLowerCase();
    }


    /* ============================================================
       DASHBOARD VISIBILITY
       ============================================================ */

    function showDashboard() {
        hideElement([
            "loginSection",
            "login-screen",
            "loginScreen",
            "loginPage"
        ]);

        hideElement([
            "otpSection",
            "otp-screen",
            "otpScreen",
            "otpPage"
        ]);

        showElement([
            "dashboard",
            "dashboardSection",
            "dashboardPage",
            "mainApp"
        ]);
    }


    function hideDashboard() {
        hideElement([
            "dashboard",
            "dashboardSection",
            "dashboardPage",
            "mainApp"
        ]);
    }


    /* ============================================================
       USER HEADER / PROFILE
       ============================================================ */

    function updateUserInformation(user) {
        if (!user) {
            return;
        }

        setText(
            [
                "userName",
                "profileName",
                "dashboardUserName",
                "welcomeName"
            ],
            user.name || ""
        );

        setText(
            [
                "userEmail",
                "profileEmail",
                "dashboardUserEmail"
            ],
            user.email || ""
        );

        setText(
            [
                "userRole",
                "profileRole",
                "dashboardUserRole"
            ],
            user.role || ""
        );

        setText(
            [
                "studentId",
                "profileStudentId",
                "dashboardStudentId"
            ],
            user.studentId || ""
        );
    }


    /* ============================================================
       WELCOME MESSAGE
       ============================================================ */

    function updateWelcomeMessage(user) {
        if (!user) {
            return;
        }

        const name =
            user.name ||
            "User";

        setText(
            [
                "welcomeMessage",
                "dashboardWelcome",
                "welcomeText"
            ],
            `Welcome, ${name}`
        );
    }


    /* ============================================================
       ROLE-BASED UI
       ============================================================ */

    function updateRoleBasedUI(role) {
        const normalizedRole =
            String(role || "").toLowerCase();

        const teacherElements =
            document.querySelectorAll(
                "[data-role='teacher'], .teacher-only"
            );

        const studentElements =
            document.querySelectorAll(
                "[data-role='student'], .student-only"
            );

        teacherElements.forEach(
            function (element) {
                element.style.display =
                    normalizedRole === "teacher"
                        ? ""
                        : "none";
            }
        );

        studentElements.forEach(
            function (element) {
                element.style.display =
                    normalizedRole === "student"
                        ? ""
                        : "none";
            }
        );

        /*
         * Additional common teacher sections.
         */

        if (normalizedRole === "teacher") {
            showElement([
                "teacherDashboard",
                "teacherSection"
            ]);

            hideElement([
                "studentDashboard",
                "studentSection"
            ]);
        }

        /*
         * Additional common student sections.
         */

        if (normalizedRole === "student") {
            showElement([
                "studentDashboard",
                "studentSection"
            ]);

            hideElement([
                "teacherDashboard",
                "teacherSection"
            ]);
        }
    }


    /* ============================================================
       LOAD PROFILE
       ============================================================ */

    async function loadProfile() {
        try {
            if (
                typeof getMyProfile !==
                "function"
            ) {
                return getUser();
            }

            const response =
                await getMyProfile();

            const profile =
                response?.data ||
                response?.user ||
                response;

            if (
                profile &&
                profile.email
            ) {
                if (
                    typeof setCurrentUser ===
                    "function"
                ) {
                    setCurrentUser(
                        profile
                    );
                }

                return profile;
            }

            return getUser();

        } catch (error) {
            console.error(
                "Unable to load profile:",
                error
            );

            /*
             * Do not destroy the existing UI here.
             * Authentication/session handling belongs
             * to auth.js.
             */

            return getUser();
        }
    }


    /* ============================================================
       STUDENT DASHBOARD DATA
       ============================================================ */

    async function loadStudentDashboard() {
        const results = {
            profile: null,
            attendance: null,
            scores: null,
            materials: null,
            chat: null
        };

        /*
         * Profile
         */

        results.profile =
            await loadProfile();

        /*
         * Attendance
         */

        if (
            typeof window.AttendanceModule
                ?.loadMyAttendance ===
            "function"
        ) {
            results.attendance =
                await window.AttendanceModule
                    .loadMyAttendance();
        } else if (
            typeof getMyAttendance ===
            "function"
        ) {
            try {
                results.attendance =
                    await getMyAttendance();
            } catch (error) {
                console.error(
                    "Student attendance failed:",
                    error
                );
            }
        }

        /*
         * Scores
         */

        if (
            typeof getMyScores ===
            "function"
        ) {
            try {
                results.scores =
                    await getMyScores();
            } catch (error) {
                console.error(
                    "Student scores failed:",
                    error
                );
            }
        }

        /*
         * Materials
         */

        if (
            typeof getMaterials ===
            "function"
        ) {
            try {
                results.materials =
                    await getMaterials();
            } catch (error) {
                console.error(
                    "Student materials failed:",
                    error
                );
            }
        }

        /*
         * Chat
         */

        if (
            window.ChatModule &&
            typeof window.ChatModule.init ===
            "function"
        ) {
            try {
                await window.ChatModule.init();

                results.chat = true;
            } catch (error) {
                console.error(
                    "Student chat failed:",
                    error
                );
            }
        }

        return results;
    }


    /* ============================================================
       TEACHER DASHBOARD DATA
       ============================================================ */

    async function loadTeacherDashboard() {
        const results = {
            profile: null,
            students: null,
            attendance: null,
            scores: null,
            materials: null,
            chat: null
        };

        /*
         * Profile
         */

        results.profile =
            await loadProfile();

        /*
         * Students
         */

        if (
            typeof getStudents ===
            "function"
        ) {
            try {
                results.students =
                    await getStudents();
            } catch (error) {
                console.error(
                    "Teacher students failed:",
                    error
                );
            }
        }

        /*
         * Attendance
         */

        if (
            window.AttendanceModule &&
            typeof window.AttendanceModule
                .loadAllAttendance ===
            "function"
        ) {
            try {
                results.attendance =
                    await window.AttendanceModule
                        .loadAllAttendance();
            } catch (error) {
                console.error(
                    "Teacher attendance failed:",
                    error
                );
            }
        } else if (
            typeof getAttendance ===
            "function"
        ) {
            try {
                results.attendance =
                    await getAttendance();
            } catch (error) {
                console.error(
                    "Teacher attendance failed:",
                    error
                );
            }
        }

        /*
         * Scores
         */

        if (
            typeof getScores ===
            "function"
        ) {
            try {
                results.scores =
                    await getScores();
            } catch (error) {
                console.error(
                    "Teacher scores failed:",
                    error
                );
            }
        }

        /*
         * Materials
         */

        if (
            typeof getAllMaterialsForTeacher ===
            "function"
        ) {
            try {
                results.materials =
                    await getAllMaterialsForTeacher();
            } catch (error) {
                console.error(
                    "Teacher materials failed:",
                    error
                );
            }
        } else if (
            typeof getMaterials ===
            "function"
        ) {
            try {
                results.materials =
                    await getMaterials();
            } catch (error) {
                console.error(
                    "Teacher materials failed:",
                    error
                );
            }
        }

        /*
         * Chat
         */

        if (
            window.ChatModule &&
            typeof window.ChatModule.init ===
            "function"
        ) {
            try {
                await window.ChatModule.init();

                results.chat = true;
            } catch (error) {
                console.error(
                    "Teacher chat failed:",
                    error
                );
            }
        }

        return results;
    }


    /* ============================================================
       DASHBOARD INITIALIZATION
       ============================================================ */

    async function initializeDashboard(
        suppliedUser = null
    ) {
        /*
         * Prevent accidental double initialization.
         */

        if (initialized) {
            return;
        }

        const user =
            suppliedUser ||
            getUser();

        if (!user) {
            hideDashboard();
            return;
        }

        const role =
            String(
                user.role || ""
            ).toLowerCase();

        if (
            role !== "student" &&
            role !== "teacher"
        ) {
            console.error(
                "Invalid user role."
            );

            hideDashboard();
            return;
        }

        initialized = true;

        showDashboard();

        updateUserInformation(user);
        updateWelcomeMessage(user);
        updateRoleBasedUI(role);

        try {
            if (role === "student") {
                await loadStudentDashboard();
            }

            if (role === "teacher") {
                await loadTeacherDashboard();
            }
        } catch (error) {
            console.error(
                "Dashboard initialization failed:",
                error
            );
        }
    }


    /* ============================================================
       REFRESH DASHBOARD
       ============================================================ */

    async function refreshDashboard() {
        initialized = false;

        const user =
            await loadProfile();

        if (!user) {
            return;
        }

        await initializeDashboard(
            user
        );
    }


    /* ============================================================
       NAVIGATION
       ============================================================ */

    function showPage(pageId) {
        if (!pageId) {
            return;
        }

        /*
         * Support existing page containers.
         */

        const pages =
            document.querySelectorAll(
                ".page, .dashboard-page, [data-page]"
            );

        pages.forEach(
            function (page) {
                page.style.display =
                    "none";
            }
        );

        const page =
            document.getElementById(
                pageId
            );

        if (page) {
            page.style.display = "";
        }
    }


    /* ============================================================
       DASHBOARD LOGOUT
       ============================================================ */

    async function logout() {
        initialized = false;

        if (
            window.ChatModule &&
            typeof window.ChatModule.destroy ===
            "function"
        ) {
            window.ChatModule.destroy();
        }

        if (
            typeof logoutUser ===
            "function"
        ) {
            await logoutUser();
        } else {
            localStorage.removeItem(
                "authToken"
            );

            localStorage.removeItem(
                "currentUser"
            );
        }

        hideDashboard();

        if (
            window.AuthModule &&
            typeof window.AuthModule
                .showLogin ===
            "function"
        ) {
            window.AuthModule.showLogin();
        }
    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.DashboardModule = {
        init: initializeDashboard,

        loadProfile,
        loadStudentDashboard,
        loadTeacherDashboard,

        refresh: refreshDashboard,

        showDashboard,
        hideDashboard,

        updateUserInformation,
        updateWelcomeMessage,
        updateRoleBasedUI,

        showPage,

        logout
    };


    /*
     * Make auth.js dashboard callback compatible.
     *
     * auth.js can call:
     * showDashboard(user)
     */

    window.showDashboard = function (user) {
        initializeDashboard(user);
    };


})();