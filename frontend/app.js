const chat = document.querySelector(".chat");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const micButton = document.getElementById("mic-btn");
const muteButton = document.getElementById("mute-btn");
const typingIndicator = document.getElementById("typing-indicator");
const statusPill = document.querySelector(".status");
const statusNote = document.getElementById("status-note");
const transcriptPanel = document.getElementById("transcript-panel");
const transcriptText = document.getElementById("transcript-text");
const chatLoadingBanner = document.createElement("div");

const WS_URL = "ws://localhost:8000/ws";
const sessionId = `session-${Date.now()}`;

let socket = null;
let socketReady = false;
let pendingReply = "";
let pendingAudioChunks = [];
let fallbackTimer = null;
let audioChunkCount = 0;
let audioContext = null;
let audioQueue = [];
let audioPlaying = false;
let audioElement = null;
let mediaSource = null;
let sourceBuffer = null;
let audioByteQueue = [];
let audioStreamEnded = false;
let streamingBubble = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isMuted = false;
let mediaStream = null;
let mediaRecorder = null;
let recordingChunks = [];
let isRecording = false;
let speechRecognition = null;

const GRAMMAR_HIGHLIGHTS = [
    { from: /\bwork\b/i, to: "work" },
    { from: /\bimprove\b/i, to: "improve" },
];

chatLoadingBanner.className = "loading-banner";
chatLoadingBanner.innerHTML = `
    <div class="loading-bars"><span></span><span></span><span></span></div>
    <p class="loading-title">Preparing your session</p>
    <p class="loading-subtitle">We are waiting for the live connection. You can still draft messages and preview the layout.</p>
`;

function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight;
}

function setStatus(text, kind = "idle") {
    statusPill.innerHTML = "";

    const dot = document.createElement("span");
    dot.className = "status-dot";
    if (kind === "offline") {
        dot.style.background = "#f59e0b";
        dot.style.boxShadow = "0 0 0 6px rgba(245, 158, 11, 0.12)";
    }
    if (kind === "playing") {
        dot.style.background = "#38bdf8";
        dot.style.boxShadow = "0 0 0 6px rgba(56, 189, 248, 0.12)";
    }

    const label = document.createElement("span");
    label.textContent = text;

    statusPill.append(dot, label);
}

function setConnectedState(connected) {
    socketReady = connected;
    setStatus(connected ? "Connected" : "Offline", connected ? "idle" : "offline");
    if (statusNote) {
        statusNote.textContent = connected
            ? "Live connection is ready."
            : "Waiting for the live connection.";
    }

    if (connected) {
        chatLoadingBanner.hidden = true;
    } else if (!chat.querySelector(".loading-banner")) {
        chat.insertBefore(chatLoadingBanner, chat.firstChild);
        chatLoadingBanner.hidden = false;
    }
}

function runFrontendHealthCheck() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const requirements = [
        SpeechRecognition ? null : "speech recognition support",
        window.WebSocket ? null : "WebSocket support",
        window.MediaSource ? null : "streaming audio playback support",
    ].filter(Boolean);

    if (requirements.length === 0) {
        if (statusNote) {
            statusNote.textContent = "All browser features needed for the frontend are available.";
        }
        if (chatLoadingBanner.querySelector(".loading-subtitle")) {
            chatLoadingBanner.querySelector(".loading-subtitle").textContent =
                "The interface is ready. Live chat, audio, and recording are available in this browser.";
        }
        return;
    }

    if (statusNote) {
        statusNote.textContent = `Limited browser support: ${requirements.join(", ")}.`;
    }

    const subtitle = chatLoadingBanner.querySelector(".loading-subtitle");
    if (subtitle) {
        subtitle.textContent = `Some browser features are unavailable: ${requirements.join(", ")}. The UI will still load, but some actions may be limited.`;
    }
}

function setRecordingState(recording) {
    isRecording = recording;
    micButton.setAttribute("aria-pressed", String(recording));
    micButton.textContent = recording ? "Stop" : "Mic";

    if (recording) {
        setStatus("Recording", "playing");
        return;
    }

    if (socketReady) {
        setStatus("Connected", "idle");
    } else if (isMuted) {
        setStatus("Muted", "offline");
    } else {
        setStatus("Offline", "offline");
    }
}

function setTranscriptState(text, visible = true) {
    transcriptText.textContent = text;
    transcriptPanel.hidden = !visible;
}

function clearReconnectTimer() {
    if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        clearReconnectTimer();
        setConnectedState(false);
        return;
    }

    clearReconnectTimer();
    reconnectAttempts += 1;

    const delay = Math.min(1000 * reconnectAttempts, 5000);
    setStatus(`Reconnecting ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`, "offline");

    reconnectTimer = window.setTimeout(() => {
        connectSocket();
    }, delay);
}

function updateAudioStatus(isPlaying) {
    if (isMuted) {
        setStatus("Muted", "offline");
        return;
    }

    if (isPlaying) {
        setStatus("Playing audio", "playing");
        return;
    }

    setStatus(socketReady ? "Connected" : "Offline", socketReady ? "idle" : "offline");
}

function createMessageElement({ author, text, tone = "bot", time = formatTime() }) {
    const article = document.createElement("article");
    article.className = `message ${tone}`;

    const avatar = document.createElement("div");
    avatar.className = `avatar${tone === "user" ? " user-avatar" : ""}`;
    avatar.textContent = tone === "user" ? "You" : author.charAt(0);

    const bubble = document.createElement("div");
    bubble.className = `bubble${tone === "user" ? " user-bubble" : ""}`;

    const meta = document.createElement("div");
    meta.className = "bubble-meta";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = author;

    const timestamp = document.createElement("span");
    timestamp.className = "time";
    timestamp.textContent = time;

    const paragraph = document.createElement("p");
    if (tone === "bot") {
        paragraph.innerHTML = renderGrammarHighlight(text);
    } else {
        paragraph.textContent = text;
    }

    meta.append(name, timestamp);
    bubble.append(meta, paragraph);

    if (tone === "user") {
        article.append(bubble, avatar);
    } else {
        article.append(avatar, bubble);
    }

    return article;
}

function createStreamingMessageElement() {
    const article = document.createElement("article");
    article.className = "message bot";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "A";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const meta = document.createElement("div");
    meta.className = "bubble-meta";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = "Ava";

    const timestamp = document.createElement("span");
    timestamp.className = "time";
    timestamp.textContent = formatTime();

    const paragraph = document.createElement("p");
    paragraph.textContent = "";
    paragraph.dataset.streamBody = "true";

    meta.append(name, timestamp);
    bubble.append(meta, paragraph);
    article.append(avatar, bubble);
    return article;
}

function setSendingState(isSending) {
    sendButton.disabled = isSending;
    messageInput.disabled = isSending;
    typingIndicator.hidden = !isSending;

    if (isSending) {
        scrollToBottom();
    }
}

function getMockReply(message) {
    const trimmed = message.trim();
    if (!trimmed) return "";

    return `That sounds clearer. A more professional version would be: "${trimmed.replace(/^i\s+/i, "I ")}"`;
}

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function renderGrammarHighlight(text) {
    let safeText = escapeHtml(text);

    GRAMMAR_HIGHLIGHTS.forEach((rule) => {
        safeText = safeText.replace(rule.from, (match) => `<mark>${match}</mark>`);
    });

    return safeText;
}

function clearPendingStream() {
    pendingReply = "";
    pendingAudioChunks = [];
    audioChunkCount = 0;
    audioQueue = [];
    audioByteQueue = [];
    sourceBuffer = null;
    mediaSource = null;
    audioStreamEnded = false;
}

function ensureAudioElement() {
    if (!audioElement) {
        audioElement = document.createElement("audio");
        audioElement.autoplay = true;
        audioElement.controls = false;
        audioElement.preload = "auto";
        audioElement.style.display = "none";
        document.body.appendChild(audioElement);
    }

    return audioElement;
}

function base64ToBytes(base64) {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index);
    }
    return bytes;
}

function startLiveAudioStream() {
    if (isMuted || !window.MediaSource) {
        return;
    }

    const player = ensureAudioElement();
    audioByteQueue = [];
    audioStreamEnded = false;
    sourceBuffer = null;
    mediaSource = new MediaSource();
    player.src = URL.createObjectURL(mediaSource);

    mediaSource.addEventListener("sourceopen", () => {
        if (mediaSource.readyState !== "open") return;

        sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        sourceBuffer.mode = "sequence";
        sourceBuffer.addEventListener("updateend", appendQueuedAudioBytes);
        appendQueuedAudioBytes();
    }, { once: true });
}

function queueAudioChunk(base64Chunk) {
    if (isMuted) {
        return;
    }

    if (!mediaSource) {
        startLiveAudioStream();
    }

    audioByteQueue.push(base64ToBytes(base64Chunk));
    appendQueuedAudioBytes();
    ensureAudioElement().play().catch(() => {});
    updateAudioStatus(true);
}

async function playQueuedAudio() {
    appendQueuedAudioBytes();
}

function appendQueuedAudioBytes() {
    if (!sourceBuffer || sourceBuffer.updating || audioByteQueue.length === 0) {
        if (
            audioStreamEnded &&
            mediaSource &&
            mediaSource.readyState === "open" &&
            sourceBuffer &&
            !sourceBuffer.updating &&
            audioByteQueue.length === 0
        ) {
            try {
                mediaSource.endOfStream();
            } catch (error) {
                // Browser may already have closed the stream.
            }
        }
        return;
    }

    sourceBuffer.appendBuffer(audioByteQueue.shift());
}

function finishLiveAudioStream() {
    audioStreamEnded = true;
    appendQueuedAudioBytes();
    updateAudioStatus(false);
}

function appendBotReply(text) {
    const botMessage = createMessageElement({
        author: "Ava",
        text,
        tone: "bot",
    });

    chat.insertBefore(botMessage, typingIndicator);
    scrollToBottom();
}

function appendUserMessage(text) {
    const userMessage = createMessageElement({
        author: "You",
        text,
        tone: "user",
    });

    chat.insertBefore(userMessage, typingIndicator);
    scrollToBottom();
}

function handleStreamMessage(data) {
    if (!data || typeof data !== "object") return;

    if (data.type === "text_token" && typeof data.content === "string") {
        pendingReply += data.content;
        if (streamingBubble) {
            streamingBubble.textContent = pendingReply;
            scrollToBottom();
        }
        return;
    }

    if (data.type === "audio_chunk" && typeof data.audio_base64 === "string") {
        pendingAudioChunks.push(data.audio_base64);
        audioChunkCount += 1;
        if (streamingBubble) {
            const meta = streamingBubble.parentElement?.querySelector(".bubble-meta .time");
            if (meta) {
                meta.textContent = `${formatTime()} · audio ${audioChunkCount}`;
            }
        }
        queueAudioChunk(data.audio_base64);
        return;
    }

    if (data.type === "done") {
        finishLiveAudioStream();
        finishStream();
    }
}

function finishStream() {
    if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
    }

    if (streamingBubble && pendingReply.trim()) {
        streamingBubble.innerHTML = renderGrammarHighlight(pendingReply);
    } else if (streamingBubble) {
        streamingBubble.textContent = "I can help make that sound more professional.";
    }

    setSendingState(false);
    clearPendingStream();
    streamingBubble = null;
    messageInput.focus();
    scrollToBottom();
}

function connectSocket() {
    clearReconnectTimer();

    try {
        socket = new WebSocket(WS_URL);
    } catch (error) {
        setConnectedState(false);
        scheduleReconnect();
        return;
    }

    socket.addEventListener("open", () => {
        reconnectAttempts = 0;
        clearReconnectTimer();
        setConnectedState(true);
    });

    socket.addEventListener("close", () => {
        setConnectedState(false);
        scheduleReconnect();
    });

    socket.addEventListener("error", () => {
        setConnectedState(false);
        scheduleReconnect();
    });

    socket.addEventListener("message", (event) => {
        try {
            const data = JSON.parse(event.data);
            handleStreamMessage(data);
        } catch (error) {
            // Ignore non-JSON frames for now.
        }
    });
}

function sendViaSocket(text) {
    if (!socketReady || !socket || socket.readyState !== WebSocket.OPEN) {
        return false;
    }

    socket.send(JSON.stringify({
        action: "send_message",
        text,
        session_id: sessionId,
    }));

    return true;
}

function setMuteState(muted) {
    isMuted = muted;
    muteButton.setAttribute("aria-pressed", String(muted));
    muteButton.textContent = muted ? "Sound off" : "Sound on";

    if (muted) {
        audioQueue = [];
        audioByteQueue = [];
        if (audioElement) {
            audioElement.pause();
        }
        setStatus("Muted", "offline");
    } else {
        updateAudioStatus(false);
    }
}

function createVoiceStatus(text) {
    let status = document.querySelector(".voice-status");
    if (!status) {
        status = document.createElement("p");
        status.className = "voice-status";
        const composer = document.querySelector(".composer");
        composer.appendChild(status);
    }
    status.textContent = text;
}

async function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        createVoiceStatus("Speech-to-text is not supported in this browser. Try Chrome or Edge.");
        micButton.disabled = true;
        return;
    }

    try {
        speechRecognition = new SpeechRecognition();
        speechRecognition.lang = "en-US";
        speechRecognition.interimResults = true;
        speechRecognition.continuous = false;

        let finalTranscript = "";

        speechRecognition.addEventListener("result", (event) => {
            let interimTranscript = "";

            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const transcript = event.results[index][0].transcript;
                if (event.results[index].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            const visibleTranscript = `${finalTranscript} ${interimTranscript}`.trim();
            if (visibleTranscript) {
                messageInput.value = visibleTranscript;
                setTranscriptState(visibleTranscript, true);
            }
        });

        speechRecognition.addEventListener("end", () => {
            setRecordingState(false);
            speechRecognition = null;

            if (messageInput.value.trim()) {
                sendMessage();
            } else {
                createVoiceStatus("I did not catch anything. Try again.");
            }
        });

        speechRecognition.addEventListener("error", (event) => {
            createVoiceStatus(`Speech recognition error: ${event.error}`);
            setRecordingState(false);
            speechRecognition = null;
        });

        speechRecognition.start();
        setRecordingState(true);
        setTranscriptState("Listening...", true);
        createVoiceStatus("Listening... speak naturally, then pause.");
    } catch (error) {
        createVoiceStatus("Microphone permission was not granted.");
        setRecordingState(false);
    }
}

function stopRecording() {
    if (speechRecognition) {
        speechRecognition.stop();
        return;
    }

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
        mediaStream = null;
    }
}

function handleRecordingStop() {
    setRecordingState(false);

    const audioBlob = new Blob(recordingChunks, { type: "audio/webm" });
    recordingChunks = [];

    if (!audioBlob.size) {
        createVoiceStatus("Recording ended, but no audio was captured.");
        return;
    }

    const previewUrl = URL.createObjectURL(audioBlob);
    createVoiceStatus("Recording saved locally for now.");
    setTranscriptState("Your transcript will be shown here once speech-to-text is wired in.", true);

    const voiceNote = document.createElement("audio");
    voiceNote.controls = true;
    voiceNote.src = previewUrl;
    voiceNote.className = "voice-preview";
    voiceNote.setAttribute("aria-label", "Recorded voice preview");
    chat.insertBefore(
        createVoicePreviewMessage(voiceNote),
        typingIndicator
    );
    scrollToBottom();
}

function createVoicePreviewMessage(audioElement) {
    const article = document.createElement("article");
    article.className = "message user";

    const avatar = document.createElement("div");
    avatar.className = "avatar user-avatar";
    avatar.textContent = "You";

    const bubble = document.createElement("div");
    bubble.className = "bubble user-bubble";

    const meta = document.createElement("div");
    meta.className = "bubble-meta";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = "You";

    const timestamp = document.createElement("span");
    timestamp.className = "time";
    timestamp.textContent = formatTime();

    const label = document.createElement("p");
    label.textContent = "Voice note recorded locally:";

    meta.append(name, timestamp);
    bubble.append(meta, label, audioElement);
    article.append(bubble, avatar);
    return article;
}

function highlightVisibleExample() {
    const firstBotBubble = chat.querySelector(".message.bot .bubble p");
    if (firstBotBubble && firstBotBubble.textContent.includes("Let's practice")) {
        firstBotBubble.innerHTML = renderGrammarHighlight(firstBotBubble.textContent);
    }
}

function updateLoadingBanner() {
    const isReady = socketReady;
    chatLoadingBanner.hidden = isReady;
    if (!chat.querySelector(".loading-banner")) {
        chat.insertBefore(chatLoadingBanner, chat.firstChild);
    }
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    appendUserMessage(text);
    messageInput.value = "";
    setSendingState(true);
    clearPendingStream();
    startLiveAudioStream();

    const streamingMessage = createStreamingMessageElement();
    streamingBubble = streamingMessage.querySelector("[data-stream-body='true']");
    chat.insertBefore(streamingMessage, typingIndicator);
    scrollToBottom();

    const sentToSocket = sendViaSocket(text);

    if (!sentToSocket) {
        fallbackTimer = window.setTimeout(() => {
            pendingReply = getMockReply(text);
            finishStream();
        }, 700);
    }
}

sendButton.addEventListener("click", sendMessage);

micButton.addEventListener("click", () => {
    if (isRecording) {
        stopRecording();
        return;
    }

    void startRecording();
});

muteButton.addEventListener("click", () => {
    setMuteState(!isMuted);
});

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

window.addEventListener("beforeunload", () => {
    clearReconnectTimer();
    if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
        audioContext.close().catch(() => {});
    }
    if (audioElement) {
        audioElement.pause();
    }
});

messageInput.focus();
setConnectedState(false);
setMuteState(false);
setRecordingState(false);
setTranscriptState("Speech-to-text will appear here soon.", true);
highlightVisibleExample();
updateLoadingBanner();
runFrontendHealthCheck();
connectSocket();
scrollToBottom();
