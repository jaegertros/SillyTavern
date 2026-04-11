import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

/** Shared rules applied to all files */
const sharedRules = {
    'jsdoc/no-undefined-types': ['warn', { disableReporting: true, markVariablesAsUsed: true }],
    'no-unused-vars': ['error', { args: 'none' }],
    'no-control-regex': 'off',
    'no-constant-condition': ['error', { checkLoops: false }],
    'require-yield': 'off',
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'indent': ['error', 4, { SwitchCase: 1, FunctionDeclaration: { parameters: 'first' } }],
    'comma-dangle': ['error', 'always-multiline'],
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'space-infix-ops': 'error',
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    'no-cond-assign': 'error',
    'no-unneeded-ternary': 'error',
    'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true }],
    'dot-notation': ['error', { 'allowPattern': '[A-Z]\\w*$' }],
    // These rules should eventually be enabled.
    'no-async-promise-executor': 'off',
    'no-inner-declarations': 'off',
};

export default [
    // Global ignores (replaces ignorePatterns)
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.git/**',
            'public/lib/**',
            'backups/**',
            'data/**',
            'cache/**',
            'src/tokenizers/**',
            'docker/**',
            'plugins/**',
            '**/*.min.js',
            'public/scripts/extensions/quick-reply/lib/**',
            'public/scripts/extensions/tts/lib/**',
            'public/vue-dist/**',
        ],
    },

    // Server-side files (src/, root .js, plugins/)
    {
        files: ['src/**/*.js', './*.js', 'plugins/**/*.js'],
        ...js.configs.recommended,
        plugins: {
            jsdoc,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
                globalThis: 'readonly',
                Deno: 'readonly',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...sharedRules,
        },
    },

    // CommonJS files (*.cjs)
    {
        files: ['*.cjs'],
        ...js.configs.recommended,
        plugins: {
            jsdoc,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...sharedRules,
        },
    },

    // ESM server files (*.mjs)
    {
        files: ['src/**/*.mjs'],
        ...js.configs.recommended,
        plugins: {
            jsdoc,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...sharedRules,
        },
    },

    // Browser-side files
    {
        files: ['public/**/*.js'],
        ...js.configs.recommended,
        plugins: {
            jsdoc,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.jquery,
                ...globals.es2021,
                globalThis: 'readonly',
                ePub: 'readonly',
                pdfjsLib: 'readonly',
                toastr: 'readonly',
                SillyTavern: 'readonly',
            },
        },
        rules: {
            ...js.configs.recommended.rules,
            ...sharedRules,
        },
    },
];
