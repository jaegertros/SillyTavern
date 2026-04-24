// ============================================================
// Claude ↔ SillyTavern Bridge — UI Overlay
// ============================================================

(function () {
    if (window.__bridgeUI) return;
    window.__bridgeUI = true;

    // ── Create container ─────────────────────────────────────
    const container = document.createElement('div');
    container.id = 'bridge-indicator';

    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '999999';
    container.style.background = 'rgba(0,0,0,0.75)';
    container.style.padding = '10px 12px';
    container.style.borderRadius = '8px';
    container.style.fontSize = '12px';
    container.style.fontFamily = 'monospace';
    container.style.color = '#fff';
    container.style.lineHeight = '1.4';
    container.style.minWidth = '180px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
    container.style.pointerEvents = 'none'; // non-interactive

    container.innerHTML = `
        <div style="margin-bottom:4px;">
            Claude: <span id="bridge-claude">⚪</span>
        </div>
        <div id="bridge-claude-name" style="font-size:11px; opacity:0.7; margin-bottom:6px;"></div>

        <div style="margin-bottom:4px;">
            ST: <span id="bridge-st">⚪</span>
        </div>
        <div id="bridge-st-name" style="font-size:11px; opacity:0.7; margin-bottom:6px;"></div>

        <div>
            Status: <span id="bridge-status">idle</span>
        </div>
    `;

    document.body.appendChild(container);

    // ── Element refs ─────────────────────────────────────────
    const elClaude = document.getElementById('bridge-claude');
    const elST = document.getElementById('bridge-st');
    const elStatus = document.getElementById('bridge-status');

    const elClaudeName = document.getElementById('bridge-claude-name');
    const elSTName = document.getElementById('bridge-st-name');

    // ── Helpers ──────────────────────────────────────────────
    function setText(el, text, color) {
        if (!el) return;
        el.textContent = text;
        if (color) el.style.color = color;
    }

    function setDot(el, on) {
        if (!el) return;
        el.textContent = on ? '🟢' : '⚪';
        el.style.color = on ? '#0f0' : '#888';
    }

    // ── Message listener ─────────────────────────────────────
    window.addEventListener('message', (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;

        // ── Connection state ────────────────────────────────
        if (msg.type === 'BRIDGE_CONNECTION') {
            setDot(elClaude, msg.claude);
            setDot(elST, msg.st);
        }

        // ── Pipeline state ─────────────────────────────────
        if (msg.type === 'BRIDGE_STATE') {
            setText(elStatus, msg.state, msg.color);
        }

        // ── Context (titles) ───────────────────────────────
        if (msg.type === 'BRIDGE_CONTEXT') {

            // Claude context
            if (msg.side === 'claude') {
                const project = msg.project || 'Unknown Project';
                const chat = msg.chat || 'Unknown Chat';

                elClaudeName.textContent = `${project} / ${chat}`;
            }

            // SillyTavern context
            if (msg.side === 'st') {
                const chat = msg.chat || 'SillyTavern';
                elSTName.textContent = chat;
            }
        }
    });

})();