/* ================================================================
   CYBER SECURITY LEARNING PORTAL
   CHAT MODULE
   ================================================================ */

(function () {
    "use strict";

    let selectedStudentEmail = "";
    let refreshTimer = null;
    let isLoadingMessages = false;

    const REFRESH_INTERVAL = 15000;


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
            element.textContent = value;
        }
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


    /* ============================================================
       CURRENT USER
       ============================================================ */

    function getUser() {
        if (typeof getCurrentUser === "function") {
            return getCurrentUser();
        }

        return null;
    }


    function getUserRole() {
        const user = getUser();

        return String(
            user?.role || ""
        ).toLowerCase();
    }


    /* ============================================================
       RESPONSE NORMALIZATION
       ============================================================ */

    function normalizeMessages(response) {
        if (!response) {
            return [];
        }

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response.data)) {
            return response.data;
        }

        if (Array.isArray(response.messages)) {
            return response.messages;
        }

        if (
            response.data &&
            Array.isArray(response.data.messages)
        ) {
            return response.data.messages;
        }

        return [];
    }


    /* ============================================================
       DATE / TIME
       ============================================================ */

    function formatTimestamp(timestamp) {
        if (!timestamp) {
            return "";
        }

        const date = new Date(timestamp);

        if (Number.isNaN(date.getTime())) {
            return String(timestamp);
        }

        return date.toLocaleString(
            undefined,
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );
    }


    /* ============================================================
       MESSAGE TEXT
       ============================================================ */

    function getMessageText(message) {
        return (
            message?.message ??
            message?.text ??
            ""
        );
    }


    function getMessageFrom(message) {
        return String(
            message?.from || ""
        ).toLowerCase();
    }


    function getMessageType(message) {
        return String(
            message?.type || "query"
        ).toLowerCase();
    }


    /* ============================================================
       STUDENT CHAT
       ============================================================ */

    async function loadStudentChat() {
        if (isLoadingMessages) {
            return;
        }

        if (
            typeof getStudentMessages !==
            "function"
        ) {
            console.error(
                "Student chat API is not available."
            );
            return;
        }

        isLoadingMessages = true;

        try {
            const response =
                await getStudentMessages();

            const messages =
                normalizeMessages(response);

            renderStudentMessages(messages);

            updateStudentUnreadCount();

        } catch (error) {
            console.error(
                "Failed to load student chat:",
                error
            );

            showChatError(
                error.message ||
                "Unable to load messages."
            );
        } finally {
            isLoadingMessages = false;
        }
    }


    /* ============================================================
       TEACHER CHAT
       ============================================================ */

    async function loadTeacherChat() {
        if (isLoadingMessages) {
            return;
        }

        if (
            typeof getTeacherMessages !==
            "function"
        ) {
            console.error(
                "Teacher chat API is not available."
            );
            return;
        }

        isLoadingMessages = true;

        try {
            const response =
                await getTeacherMessages();

            const messages =
                normalizeMessages(response);

            renderTeacherMessages(messages);

            updateTeacherUnreadCount();

        } catch (error) {
            console.error(
                "Failed to load teacher chat:",
                error
            );

            showChatError(
                error.message ||
                "Unable to load messages."
            );
        } finally {
            isLoadingMessages = false;
        }
    }


    /* ============================================================
       TEACHER → STUDENT CONVERSATION
       ============================================================ */

    async function loadTeacherStudentChat(email) {
        if (!email) {
            return [];
        }

        try {
            const response =
                await getTeacherStudentMessages(
                    email
                );

            const messages =
                normalizeMessages(response);

            selectedStudentEmail = email;

            renderConversation(messages);

            return messages;

        } catch (error) {
            console.error(
                "Failed to load conversation:",
                error
            );

            showChatError(
                error.message ||
                "Unable to load conversation."
            );

            return [];
        }
    }


    /* ============================================================
       STUDENT SEND MESSAGE
       ============================================================ */

    async function sendStudentMessage(message) {
        const text =
            String(message || "").trim();

        if (!text) {
            showChatError(
                "Please enter a message."
            );
            return null;
        }

        try {
            setSendButtonLoading(true);

            const response =
                await sendChatMessage(text);

            clearChatInput();

            await loadStudentChat();

            return response;

        } catch (error) {
            console.error(
                "Failed to send student message:",
                error
            );

            showChatError(
                error.message ||
                "Unable to send message."
            );

            return null;

        } finally {
            setSendButtonLoading(false);
        }
    }


    /* ============================================================
       TEACHER REPLY
       ============================================================ */

    async function sendTeacherReply(
        email,
        message
    ) {
        const text =
            String(message || "").trim();

        if (!email) {
            showChatError(
                "Student email is required."
            );
            return null;
        }

        if (!text) {
            showChatError(
                "Please enter a message."
            );
            return null;
        }

        try {
            setSendButtonLoading(true);

            const response =
                await sendChatReply(
                    email,
                    text
                );

            clearChatInput();

            await loadTeacherStudentChat(
                email
            );

            return response;

        } catch (error) {
            console.error(
                "Failed to send teacher reply:",
                error
            );

            showChatError(
                error.message ||
                "Unable to send reply."
            );

            return null;

        } finally {
            setSendButtonLoading(false);
        }
    }


    /* ============================================================
       TEACHER BROADCAST
       ============================================================ */

    async function sendTeacherBroadcast(
        message
    ) {
        const text =
            String(message || "").trim();

        if (!text) {
            showChatError(
                "Please enter a broadcast message."
            );
            return null;
        }

        try {
            setSendButtonLoading(true);

            const response =
                await sendBroadcastMessage(
                    text
                );

            clearChatInput();

            await loadTeacherChat();

            return response;

        } catch (error) {
            console.error(
                "Broadcast failed:",
                error
            );

            showChatError(
                error.message ||
                "Unable to send broadcast."
            );

            return null;

        } finally {
            setSendButtonLoading(false);
        }
    }


    /* ============================================================
       RENDER STUDENT MESSAGES
       ============================================================ */

    function renderStudentMessages(messages) {
        const container = getElement([
            "studentChatMessages",
            "chatMessages",
            "messagesContainer",
            "chatContainer"
        ]);

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (!messages.length) {
            renderEmptyState(
                container,
                "No messages yet. Start a conversation."
            );

            return;
        }

        messages.forEach(function (message) {
            container.appendChild(
                createMessageElement(
                    message,
                    "student"
                )
            );
        });

        scrollChatToBottom(container);
    }


    /* ============================================================
       RENDER TEACHER MESSAGES
       ============================================================ */

    function renderTeacherMessages(messages) {
        const container = getElement([
            "teacherChatMessages",
            "teacherMessages",
            "chatMessages",
            "messagesContainer"
        ]);

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (!messages.length) {
            renderEmptyState(
                container,
                "No student messages yet."
            );

            return;
        }

        /*
         * Teacher overview can contain messages
         * from multiple students.
         */

        messages.forEach(function (message) {
            container.appendChild(
                createMessageElement(
                    message,
                    "teacher"
                )
            );
        });

        scrollChatToBottom(container);
    }


    /* ============================================================
       RENDER SELECTED CONVERSATION
       ============================================================ */

    function renderConversation(messages) {
        const container = getElement([
            "teacherChatMessages",
            "teacherMessages",
            "chatMessages",
            "messagesContainer"
        ]);

        if (!container) {
            return;
        }

        container.innerHTML = "";

        if (!messages.length) {
            renderEmptyState(
                container,
                "No messages in this conversation."
            );

            return;
        }

        messages.forEach(function (message) {
            container.appendChild(
                createMessageElement(
                    message,
                    "teacher"
                )
            );
        });

        scrollChatToBottom(container);
    }


    /* ============================================================
       MESSAGE ELEMENT
       ============================================================ */

    function createMessageElement(
        message,
        viewerRole
    ) {
        const wrapper =
            document.createElement("div");

        const from =
            getMessageFrom(message);

        const type =
            getMessageType(message);

        const user =
            getUser();

        /*
         * Determine whether this message
         * belongs to current user.
         */

        const isMine =
            (
                viewerRole === "student" &&
                (
                    from ===
                    String(user?.email || "")
                        .toLowerCase()
                )
            ) ||
            (
                viewerRole === "teacher" &&
                (
                    type === "reply" &&
                    from ===
                    String(user?.email || "")
                        .toLowerCase()
                )
            );

        wrapper.className =
            `chat-message ${
                isMine
                    ? "sent"
                    : "received"
            }`;

        const sender =
            message?.from ||
            (
                type === "broadcast"
                    ? "Teacher"
                    : "User"
            );

        const messageText =
            getMessageText(message);

        const timestamp =
            formatTimestamp(
                message?.timestamp
            );

        const read =
            message?.read === true ||
            String(message?.read)
                .toLowerCase() === "yes";

        wrapper.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-sender">
                    ${escapeHTML(sender)}
                </span>

                ${
                    type === "broadcast"
                        ? `
                            <span class="chat-type">
                                Broadcast
                            </span>
                          `
                        : ""
                }
            </div>

            <div class="chat-message-body">
                ${escapeHTML(messageText)}
            </div>

            <div class="chat-message-footer">
                <span class="chat-time">
                    ${escapeHTML(timestamp)}
                </span>

                ${
                    isMine
                        ? `
                            <span class="chat-read">
                                ${read ? "Read" : "Sent"}
                            </span>
                          `
                        : ""
                }
            </div>
        `;

        /*
         * Automatically mark received messages
         * as read when displayed.
         */

        if (
            !isMine &&
            message?._id
        ) {
            markMessageRead(
                message._id
            );
        }

        return wrapper;
    }


    /* ============================================================
       MARK MESSAGE READ
       ============================================================ */

    async function markMessageRead(
        messageId
    ) {
        if (!messageId) {
            return;
        }

        try {
            await markMessageAsRead(
                messageId
            );
        } catch (error) {
            /*
             * Read status is non-critical.
             * Do not interrupt chat UI.
             */
            console.warn(
                "Unable to mark message as read:",
                error
            );
        }
    }


    /* ============================================================
       UNREAD COUNT
       ============================================================ */

    async function updateStudentUnreadCount() {
        try {
            const response =
                await getUnreadCount();

            updateUnreadBadge(response);

        } catch (error) {
            console.warn(
                "Unable to get unread count:",
                error
            );
        }
    }


    async function updateTeacherUnreadCount() {
        try {
            const response =
                await getUnreadCount();

            updateUnreadBadge(response);

        } catch (error) {
            console.warn(
                "Unable to get unread count:",
                error
            );
        }
    }


    function updateUnreadBadge(response) {
        const count =
            Number(
                response?.count ??
                response?.unreadCount ??
                response?.data?.count ??
                0
            );

        const badges = document.querySelectorAll(
            ".chat-unread-count"
        );

        badges.forEach(function (badge) {
            badge.textContent = count;

            badge.style.display =
                count > 0
                    ? ""
                    : "none";
        });

        setText(
            [
                "unreadCount",
                "chatUnreadCount"
            ],
            count
        );
    }


    /* ============================================================
       INPUT
       ============================================================ */

    function getChatInput() {
        return getElement([
            "chatInput",
            "messageInput",
            "chatMessage",
            "message"
        ]);
    }


    function clearChatInput() {
        const input =
            getChatInput();

        if (input) {
            input.value = "";
            input.focus();
        }
    }


    function getChatInputValue() {
        const input =
            getChatInput();

        return input
            ? input.value.trim()
            : "";
    }


    /* ============================================================
       SEND BUTTON
       ============================================================ */

    function setSendButtonLoading(
        loading
    ) {
        const buttons =
            document.querySelectorAll(
                ".chat-send-btn, #sendMessageBtn, #sendChatBtn"
            );

        buttons.forEach(function (button) {
            if (loading) {
                button.disabled = true;

                if (!button.dataset.originalText) {
                    button.dataset.originalText =
                        button.textContent;
                }

                button.textContent =
                    "Sending...";
            } else {
                button.disabled = false;

                if (button.dataset.originalText) {
                    button.textContent =
                        button.dataset.originalText;
                }
            }
        });
    }


    /* ============================================================
       SEND CURRENT INPUT
       ============================================================ */

    async function sendCurrentMessage() {
        const message =
            getChatInputValue();

        if (getUserRole() === "student") {
            return sendStudentMessage(
                message
            );
        }

        if (
            getUserRole() === "teacher"
        ) {
            if (!selectedStudentEmail) {
                showChatError(
                    "Please select a student first."
                );

                return null;
            }

            return sendTeacherReply(
                selectedStudentEmail,
                message
            );
        }

        return null;
    }


    /* ============================================================
       TEACHER BROADCAST FROM CURRENT INPUT
       ============================================================ */

    async function broadcastCurrentMessage() {
        if (
            getUserRole() !== "teacher"
        ) {
            showChatError(
                "Only teachers can send broadcast messages."
            );

            return null;
        }

        return sendTeacherBroadcast(
            getChatInputValue()
        );
    }


    /* ============================================================
       STUDENT SELECTION
       ============================================================ */

    function selectStudent(email) {
        if (!email) {
            return;
        }

        selectedStudentEmail = email;

        loadTeacherStudentChat(
            email
        );
    }


    /* ============================================================
       EMPTY STATE
       ============================================================ */

    function renderEmptyState(
        container,
        message
    ) {
        const empty =
            document.createElement("div");

        empty.className =
            "chat-empty-state";

        empty.textContent =
            message;

        container.appendChild(
            empty
        );
    }


    /* ============================================================
       ERROR
       ============================================================ */

    function showChatError(message) {
        const errorElement =
            getElement([
                "chatError",
                "chat-error",
                "messageError"
            ]);

        if (errorElement) {
            errorElement.textContent =
                message;

            errorElement.style.display =
                "block";

            return;
        }

        console.error(
            "Chat:",
            message
        );
    }


    /* ============================================================
       SCROLL
       ============================================================ */

    function scrollChatToBottom(
        container
    ) {
        if (!container) {
            return;
        }

        container.scrollTop =
            container.scrollHeight;
    }


    /* ============================================================
       REFRESH
       ============================================================ */

    function startAutoRefresh() {
        stopAutoRefresh();

        refreshTimer =
            setInterval(
                async function () {
                    const role =
                        getUserRole();

                    if (role === "student") {
                        await loadStudentChat();
                    } else if (
                        role === "teacher"
                    ) {
                        if (
                            selectedStudentEmail
                        ) {
                            await loadTeacherStudentChat(
                                selectedStudentEmail
                            );
                        } else {
                            await loadTeacherChat();
                        }
                    }
                },
                REFRESH_INTERVAL
            );
    }


    function stopAutoRefresh() {
        if (refreshTimer) {
            clearInterval(
                refreshTimer
            );

            refreshTimer = null;
        }
    }


    /* ============================================================
       EVENT BINDING
       ============================================================ */

    function bindEvents() {
        const sendButtons =
            document.querySelectorAll(
                "#sendMessageBtn, #sendChatBtn, .chat-send-btn"
            );

        sendButtons.forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();

                        sendCurrentMessage();
                    }
                );
            }
        );


        const input =
            getChatInput();

        if (input) {
            input.addEventListener(
                "keydown",
                function (event) {
                    /*
                     * Enter = send
                     * Shift + Enter = new line
                     */

                    if (
                        event.key === "Enter" &&
                        !event.shiftKey
                    ) {
                        event.preventDefault();

                        sendCurrentMessage();
                    }
                }
            );
        }


        const broadcastButtons =
            document.querySelectorAll(
                "#broadcastBtn, .broadcast-btn"
            );

        broadcastButtons.forEach(
            function (button) {
                button.addEventListener(
                    "click",
                    function (event) {
                        event.preventDefault();

                        broadcastCurrentMessage();
                    }
                );
            }
        );
    }


    /* ============================================================
       INITIALIZATION
       ============================================================ */

    async function initializeChat() {
        const user = getUser();

        if (!user) {
            return;
        }

        bindEvents();

        const role =
            String(
                user.role || ""
            ).toLowerCase();

        if (role === "student") {
            await loadStudentChat();
        } else if (
            role === "teacher"
        ) {
            await loadTeacherChat();
        }

        startAutoRefresh();
    }


    /* ============================================================
       CLEANUP
       ============================================================ */

    function destroyChat() {
        stopAutoRefresh();
    }


    /* ============================================================
       PUBLIC API
       ============================================================ */

    window.ChatModule = {
        init: initializeChat,
        destroy: destroyChat,

        loadStudentChat,
        loadTeacherChat,
        loadTeacherStudentChat,

        sendStudentMessage,
        sendTeacherReply,
        sendTeacherBroadcast,

        sendCurrentMessage,
        broadcastCurrentMessage,

        selectStudent,

        markMessageRead,

        updateStudentUnreadCount,
        updateTeacherUnreadCount
    };

})();