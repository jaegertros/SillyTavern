/**
 * Backend Extraction #7 — users.js
 *
 * Extracts into two sub-modules:
 *
 * users/user-auth.js (433 lines):
 *   - verifySecuritySettings, logSecurityAlert (private)
 *   - getPasswordSalt, getPasswordHash, getCsrfSecret
 *   - getCookieSessionName, getSessionCookieAge
 *   - shouldRedirectToLogin, tryAutoLogin
 *   - singleUserLogin, autheliaUserLogin, authentikUserLogin, headerUserLogin, basicUserLogin (private)
 *   - setUserDataMiddleware, requireLoginMiddleware, loginPageMiddleware, requireAdminMiddleware
 *
 * users/user-migration.js (277 lines):
 *   - migrateUserData (old→new directory format migration)
 *   - migrateSystemPrompts (instruct→sysprompt migration)
 *
 * users.js retains (442 lines):
 *   - Type definitions (User, UserViewModel, UserDirectoryList)
 *   - Directory management (getUserDirectories, ensurePublicDirectoriesExist, getUserDirectoriesList)
 *   - Storage (initUserStorage, toKey, toAvatarKey, getAllUserHandles, getAllEnabledUsers)
 *   - Avatar/backup (getUserAvatar, createBackupArchive, cleanUploads)
 *   - File-serving router + route handlers
 *   - Re-exports from both sub-modules for backward compatibility
 *
 * Result:
 *   users.js: 1,101 → 442 lines (60% reduction)
 *
 * Note: user-auth.js imports from parent users.js (circular import at module level,
 * safe because all cross-module calls happen at runtime, not at evaluation time).
 *
 * Consumer impact: zero — users.js re-exports all public symbols.
 * Verified consumers: server-main.js, server-startup.js, basicAuth.js,
 *   users-public.js, users-private.js, users-admin.js, stats.js, settings.js,
 *   recover-password.js, characters/disk-cache.js
 *
 * This script is documentation-only; the extraction was done manually.
 */
console.log('backend7_extract_users: documentation-only migration script');
