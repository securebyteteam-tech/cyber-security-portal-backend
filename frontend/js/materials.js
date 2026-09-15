/* ================================================================
   CYBER SECURITY LEARNING PORTAL
   MATERIALS MODULE
   ================================================================ */

(function () {
    "use strict";

    let materialsCache = [];


    /* ============================================================
       HELPERS
       ============================================================ */

    function escapeHtml(value) {
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


    function getCurrentRole() {
        if (typeof getCurrentUser === "function") {
            const user = getCurrentUser();

            return String(
                user?.role || ""
            ).toLowerCase();
        }

        return String(
            localStorage.getItem("userRole") || ""
        ).toLowerCase();
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


    function showLoading(container) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="loading-message">
                Loading study materials...
            </div>
        `;
    }


    function showEmpty(container) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="empty-message">
                No study materials available.
            </div>
        `;
    }


    function showError(container, message) {
        if (!container) {
            return;
        }

        container.innerHTML = `
            <div class="error-message">
                ${escapeHtml(
                    message ||
                    "Unable to load study materials."
                )}
            </div>
        `;
    }


    /* ============================================================
       NORMALIZE API RESPONSE
       ============================================================ */

    function extractMaterials(response) {
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
            Array.isArray(response.materials)
        ) {
            return response.materials;
        }

        if (
            response &&
            response.data &&
            Array.isArray(
                response.data.materials
            )
        ) {
            return response.data.materials;
        }

        return [];
    }


    /* ============================================================
       LOAD MATERIALS
       ============================================================ */

    async function loadMaterials(options = {}) {
        const container =
            options.container ||
            getElement([
                "materialsContainer",
                "materialsList",
                "studyMaterials",
                "materialsGrid"
            ]);

        if (container) {
            showLoading(container);
        }

        try {
            let response;

            /*
             * Student and normal authenticated users:
             * GET /api/materials
             */

            if (
                typeof getMaterials ===
                "function"
            ) {
                response =
                    await getMaterials();
            } else if (
                window.API &&
                typeof window.API.getMaterials ===
                "function"
            ) {
                response =
                    await window.API.getMaterials();
            } else {
                throw new Error(
                    "Materials API is not available."
                );
            }

            materialsCache =
                extractMaterials(response);

            if (!materialsCache.length) {
                if (container) {
                    showEmpty(container);
                }

                return [];
            }

            renderMaterials(
                materialsCache,
                container
            );

            return materialsCache;

        } catch (error) {
            console.error(
                "Failed to load materials:",
                error
            );

            if (container) {
                showError(
                    container,
                    error.message
                );
            }

            return [];
        }
    }


    /* ============================================================
       LOAD MATERIALS BY TYPE
       ============================================================ */

    async function loadMaterialsByType(
        type,
        options = {}
    ) {
        const container =
            options.container ||
            getElement([
                "materialsContainer",
                "materialsList",
                "studyMaterials",
                "materialsGrid"
            ]);

        if (container) {
            showLoading(container);
        }

        try {
            if (!type) {
                return loadMaterials(options);
            }

            let response;

            if (
                typeof getMaterialsByType ===
                "function"
            ) {
                response =
                    await getMaterialsByType(
                        type
                    );
            } else if (
                window.API &&
                typeof window.API.getMaterialsByType ===
                "function"
            ) {
                response =
                    await window.API.getMaterialsByType(
                        type
                    );
            } else {
                /*
                 * Fallback to already loaded materials.
                 */

                if (!materialsCache.length) {
                    await loadMaterials({
                        container
                    });
                }

                const filtered =
                    materialsCache.filter(
                        material =>
                            String(
                                material.type || ""
                            ).toLowerCase() ===
                            String(type).toLowerCase()
                    );

                if (!filtered.length) {
                    if (container) {
                        showEmpty(container);
                    }

                    return [];
                }

                renderMaterials(
                    filtered,
                    container
                );

                return filtered;
            }

            const materials =
                extractMaterials(response);

            if (!materials.length) {
                if (container) {
                    showEmpty(container);
                }

                return [];
            }

            renderMaterials(
                materials,
                container
            );

            return materials;

        } catch (error) {
            console.error(
                "Failed to load materials by type:",
                error
            );

            if (container) {
                showError(
                    container,
                    error.message
                );
            }

            return [];
        }
    }


    /* ============================================================
       RENDER MATERIALS
       ============================================================ */

    function renderMaterials(
        materials,
        container = null
    ) {
        const target =
            container ||
            getElement([
                "materialsContainer",
                "materialsList",
                "studyMaterials",
                "materialsGrid"
            ]);

        if (!target) {
            return;
        }

        if (
            !Array.isArray(materials) ||
            materials.length === 0
        ) {
            showEmpty(target);
            return;
        }

        target.innerHTML =
            materials
                .map(
                    material =>
                        createMaterialCard(
                            material
                        )
                )
                .join("");

        attachMaterialEvents(target);
    }


    /* ============================================================
       MATERIAL CARD
       ============================================================ */

    function createMaterialCard(material) {
        const id =
            material._id ||
            material.id ||
            "";

        const title =
            material.title ||
            "Untitled Material";

        const type =
            material.type ||
            "Study Material";

        const pdfLink =
            material.pdfLink ||
            material.pdfUrl ||
            material.link ||
            "";

        const srNo =
            material.srNo ??
            material.serialNumber ??
            "";

        const safeId =
            escapeHtml(id);

        const safeTitle =
            escapeHtml(title);

        const safeType =
            escapeHtml(type);

        const safeLink =
            escapeHtml(pdfLink);

        return `
            <div
                class="material-card"
                data-material-id="${safeId}"
            >

                <div class="material-card-header">

                    <div class="material-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>

                    <div class="material-info">

                        ${
                            srNo !== ""
                                ? `
                                    <span class="material-number">
                                        #${escapeHtml(srNo)}
                                    </span>
                                  `
                                : ""
                        }

                        <h3 class="material-title">
                            ${safeTitle}
                        </h3>

                        <span class="material-type">
                            ${safeType}
                        </span>

                    </div>

                </div>

                <div class="material-card-footer">

                    ${
                        pdfLink
                            ? `
                                <a
                                    href="${safeLink}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="material-btn"
                                    data-material-link
                                >
                                    <i class="fas fa-book-open"></i>
                                    Open Material
                                </a>
                              `
                            : `
                                <button
                                    type="button"
                                    class="material-btn disabled"
                                    disabled
                                >
                                    <i class="fas fa-ban"></i>
                                    Link Unavailable
                                </button>
                              `
                    }

                </div>

            </div>
        `;
    }


    /* ============================================================
       EVENT HANDLERS
       ============================================================ */

    function attachMaterialEvents(
        container
    ) {
        if (!container) {
            return;
        }

        const links =
            container.querySelectorAll(
                "[data-material-link]"
            );

        links.forEach(
            function (link) {
                link.addEventListener(
                    "click",
                    function () {
                        /*
                         * External Google Drive / PDF links
                         * open in a new browser tab.
                         *
                         * No file is stored in MongoDB.
                         */
                    }
                );
            }
        );
    }


    /* ============================================================
       SEARCH MATERIALS
       ============================================================ */

    function searchMaterials(
        searchText,
        container = null
    ) {
        const target =
            container ||
            getElement([
                "materialsContainer",
                "materialsList",
                "studyMaterials",
                "materialsGrid"
            ]);

        const query =
            String(
                searchText || ""
            )
                .trim()
                .toLowerCase();

        if (!query) {
            renderMaterials(
                materialsCache,
                target
            );

            return materialsCache;
        }

        const filtered =
            materialsCache.filter(
                material => {
                    const title =
                        String(
                            material.title || ""
                        ).toLowerCase();

                    const type =
                        String(
                            material.type || ""
                        ).toLowerCase();

                    return (
                        title.includes(query) ||
                        type.includes(query)
                    );
                }
            );

        if (!filtered.length) {
            showEmpty(target);
            return [];
        }

        renderMaterials(
            filtered,
            target
        );

        return filtered;
    }


    /* ============================================================
       FILTER BY TYPE
       ============================================================ */

    function filterMaterialsByType(
        type,
        container = null
    ) {
        const target =
            container ||
            getElement([
                "materialsContainer",
                "materialsList",
                "studyMaterials",
                "materialsGrid"
            ]);

        if (!type || type === "all") {
            renderMaterials(
                materialsCache,
                target
            );

            return materialsCache;
        }

        const filtered =
            materialsCache.filter(
                material =>
                    String(
                        material.type || ""
                    ).toLowerCase() ===
                    String(type).toLowerCase()
            );

        if (!filtered.length) {
            showEmpty(target);
            return [];
        }

        renderMaterials(
            filtered,
            target
        );

        return filtered;
    }


    /* ============================================================
       GET SINGLE MATERIAL
       ============================================================ */

    async function getMaterial(
        materialId
    ) {
        if (!materialId) {
            throw new Error(
                "Material ID is required."
            );
        }

        try {
            if (
                typeof getMaterialById ===
                "function"
            ) {
                return await getMaterialById(
                    materialId
                );
            }

            if (
                window.API &&
                typeof window.API.getMaterialById ===
                "function"
            ) {
                return await window.API.getMaterialById(
                    materialId
                );
            }

            throw new Error(
                "Material API is not available."
            );

        } catch (error) {
            console.error(
                "Failed to get material:",
                error
            );

            throw error;
        }
    }


    /* ============================================================
       TEACHER MATERIALS
       ============================================================ */

    async function loadTeacherMaterials(
        options = {}
    ) {
        const role =
            getCurrentRole();

        if (role !== "teacher") {
            console.warn(
                "Teacher materials requested by non-teacher."
            );

            return [];
        }

        const container =
            options.container ||
            getElement([
                "materialsContainer",
                "materialsList",
                "studyMaterials",
                "materialsGrid"
            ]);

        if (container) {
            showLoading(container);
        }

        try {
            let response;

            if (
                typeof getAllMaterialsForTeacher ===
                "function"
            ) {
                response =
                    await getAllMaterialsForTeacher();
            } else if (
                window.API &&
                typeof window.API.getAllMaterialsForTeacher ===
                "function"
            ) {
                response =
                    await window.API.getAllMaterialsForTeacher();
            } else {
                /*
                 * The current backend provides
                 * GET /api/materials/teacher/all.
                 *
                 * api.js should expose this function.
                 */

                throw new Error(
                    "Teacher materials API is not available."
                );
            }

            const materials =
                extractMaterials(response);

            materialsCache =
                materials;

            if (!materials.length) {
                showEmpty(container);
                return [];
            }

            renderMaterials(
                materials,
                container
            );

            return materials;

        } catch (error) {
            console.error(
                "Failed to load teacher materials:",
                error
            );

            if (container) {
                showError(
                    container,
                    error.message
                );
            }

            return [];
        }
    }


    /* ============================================================
       REFRESH
       ============================================================ */

    async function refreshMaterials(
        options = {}
    ) {
        materialsCache = [];

        if (
            getCurrentRole() ===
            "teacher"
        ) {
            return loadTeacherMaterials(
                options
            );
        }

        return loadMaterials(
            options
        );
    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    function init() {
        /*
         * Do not automatically call the API here if
         * authentication has not completed yet.
         *
         * dashboard.js/auth.js can call:
         *
         * MaterialsModule.load()
         */

        const searchInput =
            getElement([
                "materialSearch",
                "materialsSearch",
                "searchMaterials"
            ]);

        if (
            searchInput &&
            !searchInput.dataset.materialsBound
        ) {
            searchInput.dataset.materialsBound =
                "true";

            searchInput.addEventListener(
                "input",
                function (event) {
                    searchMaterials(
                        event.target.value
                    );
                }
            );
        }


        const filter =
            getElement([
                "materialTypeFilter",
                "materialsTypeFilter",
                "materialFilter"
            ]);

        if (
            filter &&
            !filter.dataset.materialsBound
        ) {
            filter.dataset.materialsBound =
                "true";

            filter.addEventListener(
                "change",
                function (event) {
                    filterMaterialsByType(
                        event.target.value
                    );
                }
            );
        }
    }


    /* ============================================================
       PUBLIC MODULE
       ============================================================ */

    window.MaterialsModule = {
        init,

        load: loadMaterials,
        loadMaterials,

        loadByType:
            loadMaterialsByType,

        loadTeacher:
            loadTeacherMaterials,

        refresh:
            refreshMaterials,

        render:
            renderMaterials,

        search:
            searchMaterials,

        filterByType:
            filterMaterialsByType,

        get:
            getMaterial,

        getCache:
            function () {
                return [
                    ...materialsCache
                ];
            }
    };


    /*
     * Initialize DOM event bindings.
     */

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