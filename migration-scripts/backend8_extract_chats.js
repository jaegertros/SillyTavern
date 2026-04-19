/**
 * Backend Extraction #8 — chats.js
 *
 * Extracts non-Express chat service logic into chats/chat-service.js:
 *   - backupChat, getBackupFunction, backupFunctions map (private)
 *   - process.on('exit') flush handler
 *   - checkChatIntegrity (private)
 *   - IntegrityMismatchError class
 *   - getChatInfo, getChatData, getPreviewMessage, trySaveChat
 *   - CHAT_BACKUPS_PREFIX constant
 *   - Config constants (isBackupEnabled, maxTotalChatBackups, throttleInterval, checkIntegrity)
 *
 * chats.js retains:
 *   - Express router with all route handlers (/save, /get, /rename, /delete, /export,
 *     /import, /group/*, /search, /recent)
 *   - Re-exports CHAT_BACKUPS_PREFIX and getChatInfo for backward compatibility
 *
 * Result:
 *   chats.js: 859 → 606 lines (29% reduction)
 *   chats/chat-service.js: 277 lines (new)
 *   (chats/importers.js already existed: 208 lines)
 *
 * Consumer impact: zero — chats.js re-exports all public symbols.
 * Verified consumers: data-maid.js, characters.js, backups.js, server-startup.js
 *
 * This script is documentation-only; the extraction was done manually.
 */
console.log('backend8_extract_chats: documentation-only migration script');
