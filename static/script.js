document.addEventListener('DOMContentLoaded', () => {
    // === WebGL Shader Background (from Stitch MCP design) ===
    initShaderBackground();

    // === DOM References ===
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const newChatBtn = document.getElementById('new-chat-btn');
    const tabChat = document.getElementById('tab-chat');
    const tabRedTeam = document.getElementById('tab-redteam');
    const chatWorkspace = document.getElementById('chat-workspace');
    const redteamWorkspace = document.getElementById('redteam-workspace');
    const startSimBtn = document.getElementById('start-simulation-btn');
    const whatsappFeed = document.getElementById('whatsapp-feed');
    const simStatusText = document.getElementById('sim-status-text');
    const reportModal = document.getElementById('report-modal');
    const reportModalBody = document.getElementById('report-modal-body');
    const closeModal = document.getElementById('close-modal');
    const closeModalFooter = document.getElementById('close-modal-footer');

    // === Suggestion Chips ===
    bindChipListeners();

    function bindChipListeners() {
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                userInput.value = chip.getAttribute('data-query');
                chatForm.dispatchEvent(new Event('submit'));
            });
        });
    }

    // === New Chat ===
    newChatBtn.addEventListener('click', async () => {
        try { await fetch('/api/reset', { method: 'POST' }); } catch (e) {}
        chatBox.innerHTML = `
            <div class="welcome-state">
                <div class="welcome-glow"></div>
                <div class="welcome-content">
                    <span class="welcome-wave">🌊</span>
                    <h1 class="welcome-title">Namaskaram!</h1>
                    <p class="welcome-subtitle">
                        Nenu <span class="text-accent">The Village by the Sea</span> pustakam gurinchi Tenglish lo matladagalanu. Emaina adagandi!
                    </p>
                    <div class="suggestion-chips">
                        <button class="chip" data-query="Ee book evaru rasaru?">
                            <span class="chip-emoji">📚</span><span>Ee book evaru rasaru?</span>
                        </button>
                        <button class="chip" data-query="Hari evaru? Vaadi gurinchi cheppu">
                            <span class="chip-emoji">🧑</span><span>Hari gurinchi cheppu</span>
                        </button>
                        <button class="chip" data-query="Ee story enti? Short ga cheppu">
                            <span class="chip-emoji">📖</span><span>Story enti?</span>
                        </button>
                        <button class="chip" data-query="Lila paatra gurinchi cheppu">
                            <span class="chip-emoji">👧</span><span>Lila gurinchi cheppu</span>
                        </button>
                    </div>
                </div>
            </div>`;
        bindChipListeners();
    });

    // === Chat Message Helpers ===
    function removeWelcomeState() {
        const el = document.querySelector('.welcome-state');
        if (el) el.remove();
    }

    function addMessage(content, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        msgDiv.appendChild(contentDiv);
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addTypingIndicator() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message ai-message';
        msgDiv.id = 'typing-indicator';
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message-content typing';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        msgDiv.appendChild(typingDiv);
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function removeTypingIndicator() {
        const el = document.getElementById('typing-indicator');
        if (el) el.remove();
    }

    // === Chat Form Submit ===
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = userInput.value.trim();
        if (!query) return;

        removeWelcomeState();
        addMessage(query, true);
        userInput.value = '';
        userInput.focus();
        addTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            removeTypingIndicator();
            addMessage(response.ok ? data.response : "Ayyoo! Error vachindi: " + (data.error || "Unknown error"));
        } catch (err) {
            removeTypingIndicator();
            addMessage("Network error vachindi. Server running lo unda ani check cheyyandi.");
        }
    });

    // === Workspace Tab Switcher ===
    tabChat.addEventListener('click', () => {
        tabChat.classList.add('active');
        tabRedTeam.classList.remove('active');
        chatWorkspace.classList.add('active');
        redteamWorkspace.classList.remove('active');
    });

    tabRedTeam.addEventListener('click', () => {
        tabRedTeam.classList.add('active');
        tabChat.classList.remove('active');
        redteamWorkspace.classList.add('active');
        chatWorkspace.classList.remove('active');
    });

    // === Modal Close ===
    closeModal.addEventListener('click', () => reportModal.classList.remove('active'));
    closeModalFooter.addEventListener('click', () => reportModal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === reportModal) reportModal.classList.remove('active');
    });

    // === Red Teaming Simulation ===
    startSimBtn.addEventListener('click', async () => {
        const secret = document.getElementById('rt-secret').value.trim();
        const guardrail = document.getElementById('rt-guardrail').value.trim();
        const maxTurns = document.getElementById('rt-turns').value;

        if (!secret || !guardrail) {
            alert('Secret and Guardrail details should not be empty!');
            return;
        }

        // Reset
        whatsappFeed.innerHTML = '';
        simStatusText.innerHTML = '<span class="status-dot-mini"></span> Simulating...';
        startSimBtn.disabled = true;

        try {
            const response = await fetch('/api/redteam/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret, guardrail, max_turns: maxTurns })
            });

            if (!response.ok) throw new Error('Simulation failed to start');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const rawData = line.slice(6).trim();
                        if (!rawData) continue;
                        try {
                            handleSimulationEvent(JSON.parse(rawData));
                        } catch (err) {
                            console.error('SSE parse error:', err, rawData);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            simStatusText.innerHTML = '<span class="status-dot-mini" style="background:var(--danger)"></span> Error';
            whatsappFeed.innerHTML = `<div class="chat-bubble attacker-bubble"><div class="bubble-text" style="color:var(--danger)">Failed: ${error.message}</div></div>`;
            startSimBtn.disabled = false;
        }
    });

    function handleSimulationEvent(data) {
        const placeholder = whatsappFeed.querySelector('.arena-placeholder');
        if (placeholder) placeholder.remove();

        if (data.event === 'attacker_turn') {
            simStatusText.innerHTML = `<span class="status-dot-mini"></span> Turn ${data.turn}: Target defending...`;

            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble attacker-bubble';
            bubble.innerHTML = `
                <div class="bubble-header">
                    <span class="agent-label">👤 Attacker</span>
                    <span class="turn-badge">Turn ${data.turn}</span>
                </div>
                <details class="thought-toggle">
                    <summary>
                        <span class="material-symbols-outlined" style="font-size:14px">psychology</span>
                        🧠 View Strategy Reasoning
                    </summary>
                    <div class="thought-body">${escapeHtml(data.thought || 'Direct strategy execution.')}</div>
                </details>
                <div class="bubble-text">${escapeHtml(data.content)}</div>
            `;
            whatsappFeed.appendChild(bubble);
            whatsappFeed.scrollTop = whatsappFeed.scrollHeight;

        } else if (data.event === 'defender_turn') {
            simStatusText.innerHTML = `<span class="status-dot-mini"></span> Turn ${data.turn}: Attacker planning...`;

            const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble defender-bubble';
            bubble.innerHTML = `
                <div class="bubble-header">
                    <span class="agent-label">🛡️ Defender</span>
                    <span class="turn-badge">Turn ${data.turn}</span>
                </div>
                <div class="bubble-text">${escapeHtml(data.content)}</div>
                <div class="bubble-timestamp">
                    <span>${now}</span>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1; font-size:14px;">done_all</span>
                </div>
            `;
            whatsappFeed.appendChild(bubble);
            whatsappFeed.scrollTop = whatsappFeed.scrollHeight;

        } else if (data.event === 'evaluating') {
            simStatusText.innerHTML = '<span class="status-dot-mini" style="background:var(--gold)"></span> Analyzing results...';

            const marker = document.createElement('div');
            marker.className = 'sim-end-marker';
            marker.innerHTML = '<span>Simulation Complete — Evaluating...</span>';
            whatsappFeed.appendChild(marker);
            whatsappFeed.scrollTop = whatsappFeed.scrollHeight;

        } else if (data.event === 'completed') {
            simStatusText.innerHTML = '<span class="status-dot-mini" style="background:var(--success)"></span> Finished';
            startSimBtn.disabled = false;
            showReport(data.report);
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showReport(report) {
        const passed = !report.leaked;
        const badgeClass = passed ? 'passed' : 'failed';
        const badgeIcon = passed ? 'check_circle' : 'cancel';
        const badgeText = passed ? 'PASSED: Secret Safe' : 'FAILED: Secret Leaked';
        const scoreColor = passed ? 'safe' : 'warn';

        reportModalBody.innerHTML = `
            <div class="report-status-badge">
                <div class="report-badge ${badgeClass}">
                    <span class="material-symbols-outlined" style="font-size:18px; font-variation-settings:'FILL' 1;">${badgeIcon}</span>
                    ${badgeText}
                </div>
            </div>

            <div class="report-metrics">
                <div class="metric-card">
                    <div class="metric-label">Vulnerability Score</div>
                    <div class="metric-value ${scoreColor}">${report.vulnerability_level || 'N/A'}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Attack Strategy</div>
                    <div class="metric-value text-sm ${passed ? '' : 'warn'}">${report.attack_method_detected || 'N/A'}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Leak Turn</div>
                    <div class="metric-value ${report.leak_turn !== null ? 'warn' : 'neutral'}">${report.leak_turn !== null ? 'Turn ' + report.leak_turn : 'N/A'}</div>
                </div>
            </div>

            <div class="report-analysis">
                <h4>
                    <span class="material-symbols-outlined" style="font-size:16px">summarize</span>
                    Security Posture Analysis
                </h4>
                <p>${escapeHtml(report.detailed_analysis || 'No analysis available.')}</p>
            </div>
        `;

        reportModal.classList.add('active');
    }

    // === WebGL Shader Background ===
    function initShaderBackground() {
        const canvas = document.getElementById('shader-canvas');
        if (!canvas) return;

        function syncSize() {
            const w = canvas.clientWidth || 1280;
            const h = canvas.clientHeight || 720;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        }

        if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(syncSize).observe(canvas);
        }
        syncSize();

        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return;

        const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

        const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
    vec2 uv = v_texCoord;
    vec3 color = vec3(0.039, 0.039, 0.071);
    float t = u_time * 0.2;

    // Orb 1: Cyan
    vec2 pos1 = vec2(0.3 + 0.2 * sin(t), 0.7 + 0.1 * cos(t * 1.3));
    float dist1 = length(uv - pos1);
    float glow1 = smoothstep(0.5, 0.0, dist1);
    color += glow1 * vec3(0.0, 0.988, 0.945) * 0.15;

    // Orb 2: Teal
    vec2 pos2 = vec2(0.8 + 0.15 * cos(t * 0.8), 0.3 + 0.2 * sin(t * 1.1));
    float dist2 = length(uv - pos2);
    float glow2 = smoothstep(0.6, 0.0, dist2);
    color += glow2 * vec3(0.12, 0.6, 0.6) * 0.12;

    // Orb 3: Subtle accent
    vec2 pos3 = vec2(0.5 + 0.25 * sin(t * 0.5), 0.5 + 0.25 * cos(t * 0.7));
    float dist3 = length(uv - pos3);
    float glow3 = smoothstep(0.4, 0.0, dist3);
    color += glow3 * vec3(0.0, 0.4, 0.4) * 0.08;

    gl_FragColor = vec4(color, 1.0);
}`;

        function createShader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            return s;
        }

        const prog = gl.createProgram();
        gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs));
        gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(prog);
        gl.useProgram(prog);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const pos = gl.getAttribLocation(prog, 'a_position');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uRes = gl.getUniformLocation(prog, 'u_resolution');

        let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
        window.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width && rect.height) {
                mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
                mouse.y = (1.0 - (e.clientY - rect.top) / rect.height) * canvas.height;
            }
        });

        function render(t) {
            if (typeof ResizeObserver === 'undefined') syncSize();
            gl.viewport(0, 0, canvas.width, canvas.height);
            if (uTime) gl.uniform1f(uTime, t * 0.001);
            if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        }
        render(0);
    }
});
