// ============================================================
// Claude ↔ SillyTavern Bridge — Options Page
// ============================================================

const claudeInput = document.getElementById('claude-url');
const stInput = document.getElementById('st-url');
const saveBtn = document.getElementById('save-btn');
const status = document.getElementById('status');

// Load saved values when the page opens.
chrome.storage.local.get(['claudeUrl', 'stUrl'], (data) => {
    if (data.claudeUrl) claudeInput.value = data.claudeUrl;
    if (data.stUrl)     stInput.value     = data.stUrl;
});

// Save on button click.
saveBtn.addEventListener('click', async () => {
    const claudeUrl = claudeInput.value.trim();
    const stUrl     = stInput.value.trim();

    await chrome.storage.local.set({ claudeUrl, stUrl });

    status.textContent = 'Saved.';
    status.className = 'status saved';
    setTimeout(() => { status.className = 'status'; }, 2000);
});
