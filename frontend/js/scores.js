/* ================================================================
   CYBER SECURITY LEARNING PORTAL
   SCORES / PERFORMANCE MODULE
   ================================================================ */

(function () {
    "use strict";

    let scoresCache = [];


    /* ============================================================
       HELPERS
       ============================================================ */

    function escapeHtml(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getElement(ids) {
        for (const id of ids) {
            const element =
                document.getElementById(id);

            if (element) {
                return element;
            }
        }

        return null;
    }


    function getCurrentUserSafe() {
        if (
            typeof getCurrentUser ===
            "function"
        ) {
            return getCurrentUser();
        }

        try {
            const stored =
                localStorage.getItem(
                    "currentUser"
                );

            return stored
                ? JSON.parse(stored)
                : null;

        } catch (error) {
            console.error(
                "Unable to read current user:",
                error
            );

            return null;
        }
    }


    function getCurrentRole() {
        const user =
            getCurrentUserSafe();

        return String(
            user?.role || ""
        ).toLowerCase();
    }


    /* ============================================================
       RESPONSE NORMALIZATION
       ============================================================ */

    function extractScores(response) {
        if (Array.isArray(response)) {
            return response;
        }

        if (
            response &&
            Array.isArray(response.data)
        ) {
            return response.data;
        }

        if (
            response &&
            Array.isArray(response.scores)
        ) {
            return response.scores;
        }

        if (
            response &&
            response.data &&
            Array.isArray(
                response.data.scores
            )
        ) {
            return response.data.scores;
        }

        return [];
    }


    function extractSingleScore(response) {
        if (
            response &&
            response.data &&
            !Array.isArray(response.data)
        ) {
            return response.data;
        }

        if (
            response &&
            response.score &&
            !Array.isArray(response.score)
        ) {
            return response.score;
        }

        return response;
    }


    /* ============================================================
       SCORE VALUE HELPERS
       ============================================================ */

    function getScoreEntries(scoreRecord) {
        if (!scoreRecord) {
            return [];
        }

        const scores =
            scoreRecord.scores;

        if (!scores) {
            return [];
        }

        /*
         * MongoDB Map may arrive as a normal object
         * after JSON serialization.
         */

        if (
            typeof scores ===
            "object" &&
            !Array.isArray(scores)
        ) {
            return Object.entries(
                scores
            );
        }

        /*
         * Support array format as a fallback.
         */

        if (Array.isArray(scores)) {
            return scores
                .map(item => {
                    if (
                        item &&
                        item.key !== undefined
                    ) {
                        return [
                            item.key,
                            item.value
                        ];
                    }

                    return null;
                })
                .filter(Boolean);
        }

        return [];
    }


    function parseScore(value) {
        if (
            value === null ||
            value === undefined
        ) {
            return null;
        }

        const text =
            String(value).trim();

        if (!text) {
            return null;
        }

        /*
         * Examples:
         * 10/10
         * 8/10
         * 10
         * 10, note
         */

        const fractionMatch =
            text.match(
                /(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/
            );

        if (fractionMatch) {
            const obtained =
                Number(
                    fractionMatch[1]
                );

            const total =
                Number(
                    fractionMatch[2]
                );

            if (
                Number.isFinite(obtained) &&
                Number.isFinite(total) &&
                total > 0
            ) {
                return {
                    obtained,
                    total,
                    percentage:
                        (obtained / total) * 100
                };
            }
        }

        const numberMatch =
            text.match(
                /^(-?\d+(?:\.\d+)?)/
            );

        if (numberMatch) {
            const obtained =
                Number(
                    numberMatch[1]
                );

            if (
                Number.isFinite(obtained)
            ) {
                return {
                    obtained,
                    total: null,
                    percentage: null
                };
            }
        }

        return null;
    }


    /* ============================================================
       SCORE SUMMARY
       ============================================================ */

    function calculateSummary(scoreRecord) {
        const entries =
            getScoreEntries(
                scoreRecord
            );

        let totalObtained = 0;
        let totalMaximum = 0;
        let validScores = 0;

        entries.forEach(
            function ([, value]) {
                const parsed =
                    parseScore(value);

                if (!parsed) {
                    return;
                }

                if (
                    parsed.total !== null
                ) {
                    totalObtained +=
                        parsed.obtained;

                    totalMaximum +=
                        parsed.total;

                    validScores++;
                }
            }
        );

        const percentage =
            totalMaximum > 0
                ? (
                    totalObtained /
                    totalMaximum
                ) * 100
                : null;

        return {
            totalObtained,
            totalMaximum,
            validScores,
            percentage
        };
    }


    /* ============================================================
       LOAD STUDENT SCORES
       ============================================================ */

    async function loadMyScores(
        options = {}
    ) {
        const container =
            options.container ||
            getElement([
                "scoresContainer",
                "scoreContainer",
                "scoresList",
                "performanceContainer"
            ]);

        if (container) {
            showLoading(container);
        }

        try {
            let response;

            if (
                typeof getMyScores ===
                "function"
            ) {
                response =
                    await getMyScores();

            } else if (
                window.API &&
                typeof window.API.getMyScores ===
                "function"
            ) {
                response =
                    await window.API.getMyScores();

            } else {
                throw new Error(
                    "Scores API is not available."
                );
            }

            const data =
                extractScores(response);

            scoresCache =
                data;

            if (!data.length) {
                showEmpty(container);
                return [];
            }

            renderScores(
                data,
                container
            );

            return data;

        } catch (error) {
            console.error(
                "Failed to load student scores:",
                error
            );

            showError(
                container,
                error.message
            );

            return [];
        }
    }


    /* ============================================================
       LOAD ALL SCORES - TEACHER
       ============================================================ */

    async function loadAllScores(
        options = {}
    ) {
        if (
            getCurrentRole() !==
            "teacher"
        ) {
            console.warn(
                "All scores can only be accessed by a teacher."
            );

            return [];
        }

        const container =
            options.container ||
            getElement([
                "scoresContainer",
                "scoreContainer",
                "scoresList",
                "performanceContainer"
            ]);

        if (container) {
            showLoading(container);
        }

        try {
            let response;

            if (
                typeof getScores ===
                "function"
            ) {
                response =
                    await getScores();

            } else if (
                window.API &&
                typeof window.API.getScores ===
                "function"
            ) {
                response =
                    await window.API.getScores();

            } else {
                throw new Error(
                    "Teacher scores API is not available."
                );
            }

            const data =
                extractScores(response);

            scoresCache =
                data;

            if (!data.length) {
                showEmpty(container);
                return [];
            }

            renderScores(
                data,
                container
            );

            return data;

        } catch (error) {
            console.error(
                "Failed to load all scores:",
                error
            );

            showError(
                container,
                error.message
            );

            return [];
        }
    }


    /* ============================================================
       LOAD SPECIFIC STUDENT - TEACHER
       ============================================================ */

    async function loadStudentScores(
        studentId,
        options = {}
    ) {
        if (
            getCurrentRole() !==
            "teacher"
        ) {
            console.warn(
                "Student score lookup is teacher-only."
            );

            return null;
        }

        if (!studentId) {
            throw new Error(
                "Student ID is required."
            );
        }

        const container =
            options.container ||
            getElement([
                "scoresContainer",
                "scoreContainer",
                "scoresList",
                "performanceContainer"
            ]);

        if (container) {
            showLoading(container);
        }

        try {
            let response;

            if (
                typeof getStudentScores ===
                "function"
            ) {
                response =
                    await getStudentScores(
                        studentId
                    );

            } else if (
                window.API &&
                typeof window.API.getStudentScores ===
                "function"
            ) {
                response =
                    await window.API.getStudentScores(
                        studentId
                    );

            } else {
                throw new Error(
                    "Student scores API is not available."
                );
            }

            const record =
                extractSingleScore(
                    response
                );

            if (!record) {
                showEmpty(container);
                return null;
            }

            renderScores(
                [record],
                container
            );

            return record;

        } catch (error) {
            console.error(
                "Failed to load student scores:",
                error
            );

            showError(
                container,
                error.message
            );

            return null;
        }
    }


    /* ============================================================
       RENDER SCORES
       ============================================================ */

    function renderScores(
        records,
        container = null
    ) {
        const target =
            container ||
            getElement([
                "scoresContainer",
                "scoreContainer",
                "scoresList",
                "performanceContainer"
            ]);

        if (!target) {
            return;
        }

        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {
            showEmpty(target);
            return;
        }

        target.innerHTML =
            records
                .map(
                    record =>
                        createScoreCard(
                            record
                        )
                )
                .join("");
    }


    /* ============================================================
       SCORE CARD
       ============================================================ */

    function createScoreCard(
        record
    ) {
        const studentName =
            record.studentName ||
            record.fullName ||
            "Student";

        const studentEmail =
            record.studentEmail ||
            record.email ||
            "";

        const uniqueId =
            record.uniqueId ||
            record.studentId ||
            "";

        const entries =
            getScoreEntries(record);

        const summary =
            calculateSummary(record);

        const summaryPercentage =
            summary.percentage !== null
                ? `${summary.percentage.toFixed(1)}%`
                : "—";

        const scoreRows =
            entries.length
                ? entries
                    .map(
                        ([label, value]) =>
                            createScoreRow(
                                label,
                                value
                            )
                    )
                    .join("")
                : `
                    <tr>
                        <td
                            colspan="2"
                            class="no-score-data"
                        >
                            No score records available.
                        </td>
                    </tr>
                  `;

        return `
            <div
                class="score-card"
                data-student-id="${escapeHtml(uniqueId)}"
            >

                <div class="score-card-header">

                    <div class="score-student-info">

                        <h3>
                            ${escapeHtml(
                                studentName
                            )}
                        </h3>

                        ${
                            studentEmail
                                ? `
                                    <div class="score-email">
                                        ${escapeHtml(
                                            studentEmail
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                        ${
                            uniqueId
                                ? `
                                    <div class="score-student-id">
                                        ID:
                                        ${escapeHtml(
                                            uniqueId
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                    </div>

                    <div class="score-summary">

                        <span class="score-summary-label">
                            Overall
                        </span>

                        <strong>
                            ${summaryPercentage}
                        </strong>

                    </div>

                </div>


                <div class="score-card-body">

                    <div class="score-table-wrapper">

                        <table class="score-table">

                            <thead>
                                <tr>
                                    <th>
                                        Assessment
                                    </th>

                                    <th>
                                        Score
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                ${scoreRows}
                            </tbody>

                        </table>

                    </div>

                </div>

            </div>
        `;
    }


    /* ============================================================
       SCORE ROW
       ============================================================ */

    function createScoreRow(
        label,
        value
    ) {
        const parsed =
            parseScore(value);

        let scoreClass =
            "score-value";

        if (
            parsed &&
            parsed.percentage !== null
        ) {
            if (
                parsed.percentage >= 75
            ) {
                scoreClass +=
                    " score-good";

            } else if (
                parsed.percentage >= 50
            ) {
                scoreClass +=
                    " score-average";

            } else {
                scoreClass +=
                    " score-low";
            }
        }

        return `
            <tr>

                <td class="score-label">
                    ${escapeHtml(label)}
                </td>

                <td class="${scoreClass}">
                    ${escapeHtml(value)}
                </td>

            </tr>
        `;
    }


    /* ============================================================
       SUMMARY ONLY
       ============================================================ */

    function renderScoreSummary(
        record,
        container = null
    ) {
        const target =
            container ||
            getElement([
                "scoreSummary",
                "performanceSummary",
                "scoreOverview"
            ]);

        if (!target) {
            return;
        }

        const summary =
            calculateSummary(record);

        const percentage =
            summary.percentage !== null
                ? `${summary.percentage.toFixed(1)}%`
                : "—";

        target.innerHTML = `
            <div class="score-summary-box">

                <div class="summary-item">
                    <span>
                        Assessments
                    </span>

                    <strong>
                        ${summary.validScores}
                    </strong>
                </div>

                <div class="summary-item">
                    <span>
                        Total Score
                    </span>

                    <strong>
                        ${
                            summary.totalMaximum > 0
                                ? `${summary.totalObtained}/${summary.totalMaximum}`
                                : "—"
                        }
                    </strong>
                </div>

                <div class="summary-item">
                    <span>
                        Percentage
                    </span>

                    <strong>
                        ${percentage}
                    </strong>
                </div>

            </div>
        `;
    }


    /* ============================================================
       SEARCH SCORES
       ============================================================ */

    function searchScores(
        searchText,
        container = null
    ) {
        const target =
            container ||
            getElement([
                "scoresContainer",
                "scoreContainer",
                "scoresList",
                "performanceContainer"
            ]);

        const query =
            String(
                searchText || ""
            )
                .trim()
                .toLowerCase();

        if (!query) {
            renderScores(
                scoresCache,
                target
            );

            return scoresCache;
        }

        const filtered =
            scoresCache.filter(
                record => {

                    const name =
                        String(
                            record.studentName ||
                            record.fullName ||
                            ""
                        ).toLowerCase();

                    const email =
                        String(
                            record.studentEmail ||
                            record.email ||
                            ""
                        ).toLowerCase();

                    const studentId =
                        String(
                            record.uniqueId ||
                            record.studentId ||
                            ""
                        ).toLowerCase();

                    return (
                        name.includes(query) ||
                        email.includes(query) ||
                        studentId.includes(query)
                    );
                }
            );

        if (!filtered.length) {
            showEmpty(target);
            return [];
        }

        renderScores(
            filtered,
            target
        );

        return filtered;
    }


    /* ============================================================
       GET SCORE CACHE
       ============================================================ */

    function getCachedScores() {
        return [
            ...scoresCache
        ];
    }


    /* ============================================================
       LOADING / EMPTY / ERROR
       ============================================================ */

    function showLoading(
        container
    ) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="loading-message">
                Loading scores...
            </div>
        `;
    }


    function showEmpty(
        container
    ) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="empty-message">
                No score records available.
            </div>
        `;
    }


    function showError(
        container,
        message
    ) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="error-message">
                ${escapeHtml(
                    message ||
                    "Unable to load scores."
                )}
            </div>
        `;
    }


    /* ============================================================
       REFRESH
       ============================================================ */

    async function refreshScores(
        options = {}
    ) {
        scoresCache = [];

        if (
            getCurrentRole() ===
            "teacher"
        ) {
            return loadAllScores(
                options
            );
        }

        return loadMyScores(
            options
        );
    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    function init() {
        const searchInput =
            getElement([
                "scoreSearch",
                "scoresSearch",
                "searchScores",
                "studentSearch"
            ]);

        if (
            searchInput &&
            !searchInput.dataset.scoresBound
        ) {
            searchInput.dataset.scoresBound =
                "true";

            searchInput.addEventListener(
                "input",
                function (event) {
                    searchScores(
                        event.target.value
                    );
                }
            );
        }
    }


    /* ============================================================
       PUBLIC MODULE
       ============================================================ */

    window.ScoresModule = {

        init,

        load:
            loadMyScores,

        loadMyScores,

        loadAll:
            loadAllScores,

        loadStudent:
            loadStudentScores,

        refresh:
            refreshScores,

        render:
            renderScores,

        renderSummary:
            renderScoreSummary,

        search:
            searchScores,

        calculateSummary,

        getEntries:
            getScoreEntries,

        parseScore,

        getCache:
            getCachedScores
    };


    /* ============================================================
       DOM READY
       ============================================================ */

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );
    } else {
        init();
    }

})();