// vite.config.js
import { defineConfig } from "file:///sessions/awesome-sweet-cray/mnt/SillyTavern/SillyTavern/node_modules/vite/dist/node/index.js";
import vue from "file:///sessions/awesome-sweet-cray/mnt/SillyTavern/SillyTavern/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "node:path";
var __vite_injected_original_dirname = "/sessions/awesome-sweet-cray/mnt/SillyTavern/SillyTavern";
var vite_config_default = defineConfig({
  plugins: [vue()],
  // Disable public asset copying — we're building a library, not an app.
  // Without this, Vite would copy public/ into public/vue-dist/ since outDir is nested inside publicDir.
  publicDir: false,
  build: {
    outDir: "public/vue-dist",
    emptyOutDir: false,
    lib: {
      entry: {
        "extensions/token-counter/index": "public/vue-src/extensions/token-counter/index.js"
      },
      formats: ["es"]
    },
    rollupOptions: {
      // Externalize all imports to existing SillyTavern modules.
      // These resolve at browser runtime via express.static.
      external: (id) => {
        if (id.includes("/vue-src/") || id.includes("\\vue-src\\")) return false;
        if (id === "vue" || id.includes("/node_modules/vue/") || id.includes("\\node_modules\\vue\\")) return false;
        if (id.endsWith(".vue")) return false;
        if (id.includes("/composables/")) return false;
        if (id.startsWith(".") || id.startsWith("/")) return true;
        return false;
      },
      output: {
        // Preserve directory structure in output
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js"
      }
    }
  },
  resolve: {
    alias: {
      "@st": path.resolve(__vite_injected_original_dirname, "public")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYXdlc29tZS1zd2VldC1jcmF5L21udC9TaWxseVRhdmVybi9TaWxseVRhdmVyblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2F3ZXNvbWUtc3dlZXQtY3JheS9tbnQvU2lsbHlUYXZlcm4vU2lsbHlUYXZlcm4vdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2F3ZXNvbWUtc3dlZXQtY3JheS9tbnQvU2lsbHlUYXZlcm4vU2lsbHlUYXZlcm4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgICAvLyBEaXNhYmxlIHB1YmxpYyBhc3NldCBjb3B5aW5nIFx1MjAxNCB3ZSdyZSBidWlsZGluZyBhIGxpYnJhcnksIG5vdCBhbiBhcHAuXG4gICAgLy8gV2l0aG91dCB0aGlzLCBWaXRlIHdvdWxkIGNvcHkgcHVibGljLyBpbnRvIHB1YmxpYy92dWUtZGlzdC8gc2luY2Ugb3V0RGlyIGlzIG5lc3RlZCBpbnNpZGUgcHVibGljRGlyLlxuICAgIHB1YmxpY0RpcjogZmFsc2UsXG4gICAgYnVpbGQ6IHtcbiAgICAgICAgb3V0RGlyOiAncHVibGljL3Z1ZS1kaXN0JyxcbiAgICAgICAgZW1wdHlPdXREaXI6IGZhbHNlLFxuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiB7XG4gICAgICAgICAgICAgICAgJ2V4dGVuc2lvbnMvdG9rZW4tY291bnRlci9pbmRleCc6ICdwdWJsaWMvdnVlLXNyYy9leHRlbnNpb25zL3Rva2VuLWNvdW50ZXIvaW5kZXguanMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZvcm1hdHM6IFsnZXMnXSxcbiAgICAgICAgfSxcbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgLy8gRXh0ZXJuYWxpemUgYWxsIGltcG9ydHMgdG8gZXhpc3RpbmcgU2lsbHlUYXZlcm4gbW9kdWxlcy5cbiAgICAgICAgICAgIC8vIFRoZXNlIHJlc29sdmUgYXQgYnJvd3NlciBydW50aW1lIHZpYSBleHByZXNzLnN0YXRpYy5cbiAgICAgICAgICAgIGV4dGVybmFsOiAoaWQpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBOZXZlciBleHRlcm5hbGl6ZSBvdXIgb3duIHZ1ZS1zcmMgZmlsZXMgKGhhbmRsZXMgcmVzb2x2ZWQgYWJzb2x1dGUgcGF0aHMpXG4gICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvdnVlLXNyYy8nKSB8fCBpZC5pbmNsdWRlcygnXFxcXHZ1ZS1zcmNcXFxcJykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyBCdW5kbGUgVnVlIC0gbWF0Y2ggYm90aCBiYXJlIHNwZWNpZmllciBhbmQgcmVzb2x2ZWQgYWJzb2x1dGUgcGF0aFxuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ3Z1ZScgfHwgaWQuaW5jbHVkZXMoJy9ub2RlX21vZHVsZXMvdnVlLycpIHx8IGlkLmluY2x1ZGVzKCdcXFxcbm9kZV9tb2R1bGVzXFxcXHZ1ZVxcXFwnKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIEJ1bmRsZSAudnVlIGZpbGVzXG4gICAgICAgICAgICAgICAgaWYgKGlkLmVuZHNXaXRoKCcudnVlJykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyBCdW5kbGUgY29tcG9zYWJsZXMgKHRoZXkncmUgc21hbGwgYW5kIFZ1ZS1zcGVjaWZpYylcbiAgICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJy9jb21wb3NhYmxlcy8nKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIEV4dGVybmFsaXplIGV2ZXJ5dGhpbmcgZWxzZSAoU1QgY29yZSBtb2R1bGVzKVxuICAgICAgICAgICAgICAgIGlmIChpZC5zdGFydHNXaXRoKCcuJykgfHwgaWQuc3RhcnRzV2l0aCgnLycpKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgLy8gUHJlc2VydmUgZGlyZWN0b3J5IHN0cnVjdHVyZSBpbiBvdXRwdXRcbiAgICAgICAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ1tuYW1lXS5qcycsXG4gICAgICAgICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdjaHVua3MvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgJ0BzdCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdwdWJsaWMnKSxcbiAgICAgICAgfSxcbiAgICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBWLFNBQVMsb0JBQW9CO0FBQ3ZYLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUyxDQUFDLElBQUksQ0FBQztBQUFBO0FBQUE7QUFBQSxFQUdmLFdBQVc7QUFBQSxFQUNYLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLEtBQUs7QUFBQSxNQUNELE9BQU87QUFBQSxRQUNILGtDQUFrQztBQUFBLE1BQ3RDO0FBQUEsTUFDQSxTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2xCO0FBQUEsSUFDQSxlQUFlO0FBQUE7QUFBQTtBQUFBLE1BR1gsVUFBVSxDQUFDLE9BQU87QUFFZCxZQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGFBQWEsRUFBRyxRQUFPO0FBRW5FLFlBQUksT0FBTyxTQUFTLEdBQUcsU0FBUyxvQkFBb0IsS0FBSyxHQUFHLFNBQVMsdUJBQXVCLEVBQUcsUUFBTztBQUV0RyxZQUFJLEdBQUcsU0FBUyxNQUFNLEVBQUcsUUFBTztBQUVoQyxZQUFJLEdBQUcsU0FBUyxlQUFlLEVBQUcsUUFBTztBQUV6QyxZQUFJLEdBQUcsV0FBVyxHQUFHLEtBQUssR0FBRyxXQUFXLEdBQUcsRUFBRyxRQUFPO0FBQ3JELGVBQU87QUFBQSxNQUNYO0FBQUEsTUFDQSxRQUFRO0FBQUE7QUFBQSxRQUVKLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ3BCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILE9BQU8sS0FBSyxRQUFRLGtDQUFXLFFBQVE7QUFBQSxJQUMzQztBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
