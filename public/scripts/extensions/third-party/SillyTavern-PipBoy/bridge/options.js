// ============================================================
// Claude ↔ SillyTavern Bridge — Options Page (MV3, universal)
// ============================================================

const api = typeof browser !== 'undefined' ? browser : chrome;

const claudeInput = document.getElementById('claude-url');
const stInput = document.getElementById('st-url');
const saveBtn = document.getElementById('save-btn');
const status = document.getElementById('status');

// Load saved values
api.storage.local.get(['claudeUrl', 'stUrl']).then((data) => {
    if (data.claudeUrl) claudeInput.value = data.claudeUrl;
    if (data.stUrl)     stInput.value     = data.stUrl;
}).catch(() => {
    // Chrome callback fallback
    api.storage.local.get(['claudeUrl', 'stUrl'], (data) => {
        if (data.claudeUrl) claudeInput.value = data.claudeUrl;
        if (data.stUrl)     stInput.value     = data.stUrl;
    });
});

// Save
saveBtn.addEventListener('click', () => {
    const claudeUrl = claudeInput.value.trim();
    const stUrl     = stInput.value.trim();

    const save = api.storage.local.set({ claudeUrl, stUrl });

    const onSaved = () => {
        status.textContent = 'Saved.';
        status.className = 'status saved';
        setTimeout(() => { status.className = 'status'; }, 2000);
    };

    if (save && typeof save.then === 'function') {
        save.then(onSaved);
    } else {
        // Chrome callback fallback
        onSaved();
    }
});
