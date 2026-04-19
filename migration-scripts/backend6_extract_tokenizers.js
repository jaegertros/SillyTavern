/**
 * Backend Extraction #6 — tokenizers.js
 *
 * Extracts non-Express tokenizer logic into tokenizer-engine.js:
 *   - SentencePieceTokenizer / WebTokenizer classes
 *   - getPathToTokenizer helper
 *   - All tokenizer instances (spp_llama, claude_tokenizer, etc.)
 *   - sentencepieceTokenizers / webTokenizers arrays
 *   - getSentencepiceTokenizer / getWebTokenizer lookup functions
 *   - getTokenizerModel model resolution
 *   - getTiktokenTokenizer cache
 *   - Token counting utilities (countSentencepieceTokens, countSentencepieceArrayTokens, etc.)
 *   - CHARS_PER_TOKEN, TEXT_COMPLETION_MODELS constants
 *
 * tokenizers.js retains:
 *   - Express router with all route registrations
 *   - Handler factory functions (createSentencepieceEncodingHandler, etc.)
 *   - Re-exports from tokenizer-engine.js for backward compatibility
 *
 * Result:
 *   tokenizers.js:       1,128 → 530 lines (53% reduction)
 *   tokenizer-engine.js: 401 lines (new)
 *
 * Consumer impact: zero — tokenizers.js re-exports all public symbols.
 * Verified consumer: src/endpoints/backends/chat-completions.js
 *
 * This script is documentation-only; the extraction was done manually.
 */
console.log('backend6_extract_tokenizers: documentation-only migration script');
