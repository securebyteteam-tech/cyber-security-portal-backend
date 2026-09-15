/* ================================================================
   CYBER SECURITY LEARNING PORTAL
   ATTENDANCE MODULE
   ================================================================ */

(function () {
    "use strict";

    /* ============================================================
       HELPERS
       ============================================================ */

    function getUser() {
        if (typeof getCurrentUser === "function") {
            return getCurrentUser();
        }

        return null;
    }


    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function normalizeAttendanceData(response) {
        if (!response) {
            return null;
        }

        /*
         * Backend may return:
         * { success: true, data: {...} }
         */
        if (response.data !== undefined) {
            return response.data;
        }

        return response;
    }


    /* ============================================================
       STATUS HELPERS
       ============================================================ */

    function normalizeStatus(status) {
        if (status === null || status === undefined) {
            return "";
        }

        return String(status).trim().toUpperCase();
    }


    function getStatusLabel(status) {
        const value = normalizeStatus(status);

        if (value === "P") {
            return "Present";
        }

        if (value === "A") {
            return "Absent";
        }

        if (value === "L") {
            return "Leave";
        }

        return "-";
    }


    function getStatusClass(status) {
        const value = normalizeStatus(status);

        if (value === "P") {
            return "present";
        }

        if (value === "A") {
            return "absent";
        }

        if (value === "L") {
            return "leave";
        }

        return "unknown";
    }


    /* ============================================================
       CALCULATE ATTENDANCE
       ============================================================ */

    function calculateAttendanceSummary(attendance) {
        if (!attendance || typeof attendance !== "object") {
            return {
                total: 0,
                present: 0,
                absent: 0,
                leave: 0,
                percentage: 0
            };
        }

        let total = 0;
        let present = 0;
        let absent = 0;
        let leave = 0;

        Object.keys(attendance).forEach(function (date) {
            const status = normalizeStatus(attendance[date]);

            /*
             * Ignore blank/separator columns.
             */
            if (!status) {
                return;
            }

            total++;

            if (status === "P") {
                present++;
            } else if (status === "A") {
                absent++;
            } else if (status === "L") {
                leave++;
            }
        });

        const percentage =
            total > 0
                ? Number(((present / total) * 100).toFixed(2))
                : 0;

        return {
            total,
            present,
            absent,
            leave,
            percentage
        };
    }


    /* ============================================================
       LOAD STUDENT ATTENDANCE
       ============================================================ */

    async function loadMyAttendance() {
        try {
            if (typeof getMyAttendance !== "function") {
                throw new Error("Attendance API is not available.");
            }

            const response = await getMyAttendance();
            const data = normalizeAttendanceData(response);

            if (!data) {
                throw new Error("No attendance data received.");
            }

            renderAttendance(data);

            return data;
        } catch (error) {
            console.error("Failed to load attendance:", error);

            showAttendanceError(
                error.message || "Unable to load attendance."
            );

            return null;
        }
    }


    /* ============================================================
       LOAD STUDENT ATTENDANCE SUMMARY
       ============================================================ */

    async function loadMyAttendanceSummary() {
        try {
            if (typeof getMyAttendanceSummary !== "function") {
                throw new Error("Attendance summary API is not available.");
            }

            const response = await getMyAttendanceSummary();
            const data = normalizeAttendanceData(response);

            if (!data) {
                throw new Error("No attendance summary received.");
            }

            renderAttendanceSummary(data);

            return data;
        } catch (error) {
            console.error(
                "Failed to load attendance summary:",
                error
            );

            return null;
        }
    }


    /* ============================================================
       LOAD ALL ATTENDANCE - TEACHER
       ============================================================ */

    async function loadAllAttendance() {
        try {
            if (typeof getAttendance !== "function") {
                throw new Error("Attendance API is not available.");
            }

            const response = await getAttendance();
            const data = normalizeAttendanceData(response);

            if (!data) {
                throw new Error("No attendance data received.");
            }

            renderTeacherAttendance(data);

            return data;
        } catch (error) {
            console.error(
                "Failed to load teacher attendance:",
                error
            );

            showAttendanceError(
                error.message || "Unable to load attendance."
            );

            return null;
        }
    }


    /* ============================================================
       LOAD SPECIFIC STUDENT - TEACHER
       ============================================================ */

    async function loadStudentAttendance(studentId) {
        if (!studentId) {
            console.error("Student ID is required.");
            return null;
        }

        try {
            if (typeof getStudentAttendance !== "function") {
                throw new Error("Student attendance API is not available.");
            }

            const response = await getStudentAttendance(studentId);
            const data = normalizeAttendanceData(response);

            if (!data) {
                throw new Error("No attendance data received.");
            }

            renderAttendance(data);

            return data;
        } catch (error) {
            console.error(
                "Failed to load student attendance:",
                error
            );

            showAttendanceError(
                error.message || "Unable to load student attendance."
            );

            return null;
        }
    }


    /* ============================================================
       RENDER STUDENT ATTENDANCE
       ============================================================ */

    function renderAttendance(data) {
        const attendance =
            data.attendance ||
            data.records ||
            {};

        const summary =
            data.summary ||
            calculateAttendanceSummary(attendance);

        updateAttendanceSummary(summary);
        renderAttendanceTable(attendance);
    }


    /* ============================================================
       RENDER SUMMARY
       ============================================================ */

    function renderAttendanceSummary(summary) {
        if (!summary) {
            return;
        }

        updateAttendanceSummary(summary);
    }


    function updateAttendanceSummary(summary) {
        const total =
            summary.total ??
            summary.totalDays ??
            0;

        const present =
            summary.present ??
            summary.totalPresent ??
            0;

        const absent =
            summary.absent ??
            summary.totalAbsence ??
            0;

        const leave =
            summary.leave ??
            summary.totalLeave ??
            0;

        const percentage =
            summary.percentage ??
            summary.attendancePercentage ??
            0;

        setText(
            [
                "attendancePercentage",
                "attendance-percent",
                "attendancePercent"
            ],
            `${Number(percentage).toFixed(2)}%`
        );

        setText(
            [
                "totalPresent",
                "presentCount",
                "attendancePresent"
            ],
            present
        );

        setText(
            [
                "totalAbsence",
                "absentCount",
                "attendanceAbsent"
            ],
            absent
        );

        setText(
            [
                "totalLeave",
                "leaveCount",
                "attendanceLeave"
            ],
            leave
        );

        setText(
            [
                "totalAttendance",
                "attendanceTotal",
                "totalDays"
            ],
            total
        );
    }


    /* ============================================================
       ATTENDANCE TABLE
       ============================================================ */

    function renderAttendanceTable(attendance) {
        const tableBody = findElement([
            "attendanceTableBody",
            "attendance-body",
            "attendanceBody"
        ]);

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = "";

        const dates = Object.keys(attendance || {});

        const validDates = dates.filter(function (date) {
            return String(date).trim() !== "";
        });

        if (validDates.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        No attendance records available.
                    </td>
                </tr>
            `;

            return;
        }

        validDates.forEach(function (date) {
            const status = attendance[date];
            const normalizedStatus = normalizeStatus(status);

            /*
             * Ignore blank separator columns from the original sheet.
             */
            if (!normalizedStatus) {
                return;
            }

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(date)}</td>
                <td>
                    <span class="attendance-status ${escapeHTML(
                        getStatusClass(normalizedStatus)
                    )}">
                        ${escapeHTML(getStatusLabel(normalizedStatus))}
                    </span>
                </td>
                <td>${escapeHTML(normalizedStatus)}</td>
            `;

            tableBody.appendChild(row);
        });
    }


    /* ============================================================
       TEACHER ATTENDANCE TABLE
       ============================================================ */

    function renderTeacherAttendance(data) {
        const tableBody = findElement([
            "teacherAttendanceTableBody",
            "attendanceTableBody",
            "attendance-body"
        ]);

        if (!tableBody) {
            return;
        }

        let records = data;

        if (data && Array.isArray(data.data)) {
            records = data.data;
        }

        if (data && Array.isArray(data.records)) {
            records = data.records;
        }

        if (!Array.isArray(records)) {
            records = [records];
        }

        tableBody.innerHTML = "";

        if (records.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No attendance records available.
                    </td>
                </tr>
            `;

            return;
        }

        records.forEach(function (student) {
            if (!student) {
                return;
            }

            const attendance =
                student.attendance ||
                {};

            const calculated =
                calculateAttendanceSummary(attendance);

            const present =
                student.totalPresent ??
                calculated.present;

            const absent =
                student.totalAbsence ??
                calculated.absent;

            const percentage =
                student.percentage ??
                calculated.percentage;

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${escapeHTML(
                    student.uniqueId ||
                    student.studentId ||
                    "-"
                )}</td>

                <td>${escapeHTML(
                    student.fullName ||
                    student.studentName ||
                    "-"
                )}</td>

                <td>${escapeHTML(
                    student.totalPresent ??
                    present
                )}</td>

                <td>${escapeHTML(
                    student.totalAbsence ??
                    absent
                )}</td>

                <td>${Number(percentage).toFixed(2)}%</td>

                <td>
                    <button
                        type="button"
                        class="attendance-view-btn"
                        data-student-id="${escapeHTML(
                            student.uniqueId ||
                            student.studentId ||
                            ""
                        )}">
                        View
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

        attachTeacherAttendanceEvents();
    }


    /* ============================================================
       TEACHER VIEW BUTTON
       ============================================================ */

    function attachTeacherAttendanceEvents() {
        const buttons = document.querySelectorAll(
            ".attendance-view-btn"
        );

        buttons.forEach(function (button) {
            button.addEventListener("click", async function () {
                const studentId =
                    button.getAttribute("data-student-id");

                if (!studentId) {
                    return;
                }

                await loadStudentAttendance(studentId);
            });
        });
    }


    /* ============================================================
       DOM HELPERS
       ============================================================ */

    function findElement(ids) {
        for (let i = 0; i < ids.length; i++) {
            const element = document.getElementById(ids[i]);

            if (element) {
                return element;
            }
        }

        return null;
    }


    function setText(ids, value) {
        const element = findElement(ids);

        if (element) {
            element.textContent = value;
        }
    }


    /* ============================================================
       ERROR DISPLAY
       ============================================================ */

    function showAttendanceError(message) {
        const container = findElement([
            "attendanceError",
            "attendance-error"
        ]);

        if (container) {
            container.textContent = message;
            container.style.display = "block";
            return;
        }

        console.error(message);
    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    async function initializeAttendance() {
        const user = getUser();

        if (!user) {
            return;
        }

        const role =
            String(user.role || "").toLowerCase();

        /*
         * Student gets only their own attendance.
         */
        if (role === "student") {
            await loadMyAttendance();
            await loadMyAttendanceSummary();
            return;
        }

        /*
         * Teacher can access all attendance.
         */
        if (role === "teacher") {
            await loadAllAttendance();
        }
    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.AttendanceModule = {
        init: initializeAttendance,

        loadMyAttendance,
        loadMyAttendanceSummary,
        loadAllAttendance,
        loadStudentAttendance,

        renderAttendance,
        renderAttendanceSummary,
        renderAttendanceTable,
        renderTeacherAttendance,

        calculateAttendanceSummary
    };

})();