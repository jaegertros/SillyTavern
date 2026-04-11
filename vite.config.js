import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
    plugins: [vue()],
    // Disable public asset copying — we're building a library, not an app.
    // Without this, Vite would copy public/ into public/vue-dist/ since outDir is nested inside publicDir.
    publicDir: false,
    // Replace process.env.NODE_ENV in the Vue runtime bundle so it works in the browser
    // and enables dead-code elimination of Vue's dev-only warnings.
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        outDir: 'public/vue-dist',
        emptyOutDir: false,
        lib: {
            entry: {
                'extensions/token-counter/index': 'public/vue-src/extensions/token-counter/index.js',
            },
            formats: ['es'],
        },
        rollupOptions: {
            // Externalize all imports to existing SillyTavern modules.
            // These resolve at browser runtime via express.static.
            external: (id) => {
                // Always bundle node_modules packages (Vue, @vue/*, etc.)
                // Rollup calls this function for both import specifiers and resolved absolute paths,
                // so we must check both forms.
                if (id.includes('node_modules')) return false;
                // Never externalize our own vue-src files
                if (id.includes('/vue-src/') || id.includes('\\vue-src\\')) return false;
                // Bundle .vue files
                if (id.endsWith('.vue')) return false;
                // Bundle composables (they're small and Vue-specific)
                if (id.includes('/composables/')) return false;
                // Externalize relative and absolute imports to ST core modules
                if (id.startsWith('.') || id.startsWith('/')) return true;
                return false;
            },
            output: {
                // Preserve directory structure in output
                entryFileNames: '[name].js',
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
    },
    resolve: {
        alias: {
            '@st': path.resolve(import.meta.dirname, 'public'),
        },
    },
});
