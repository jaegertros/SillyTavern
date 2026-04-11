// vite.config.js
import { defineConfig } from "file:///sessions/awesome-sweet-cray/mnt/SillyTavern/SillyTavern/node_modules/vite/dist/node/index.js";
import vue from "file:///sessions/awesome-sweet-cray/mnt/SillyTavern/SillyTavern/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "node:path";
var __vite_injected_original_dirname = "/sessions/awesome-sweet-cray/mnt/SillyTavern/SillyTavern";
var vite_config_default = defineConfig({
  plugins: [vue()],
  build: {
    outDir: "public/vue-dist",
    emptyOutDir: true,
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
        if (id === "vue" || id.endsWith(".vue")) return false;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYXdlc29tZS1zd2VldC1jcmF5L21udC9TaWxseVRhdmVybi9TaWxseVRhdmVyblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2F3ZXNvbWUtc3dlZXQtY3JheS9tbnQvU2lsbHlUYXZlcm4vU2lsbHlUYXZlcm4vdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2F3ZXNvbWUtc3dlZXQtY3JheS9tbnQvU2lsbHlUYXZlcm4vU2lsbHlUYXZlcm4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgICBidWlsZDoge1xuICAgICAgICBvdXREaXI6ICdwdWJsaWMvdnVlLWRpc3QnLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgICAgbGliOiB7XG4gICAgICAgICAgICBlbnRyeToge1xuICAgICAgICAgICAgICAgICdleHRlbnNpb25zL3Rva2VuLWNvdW50ZXIvaW5kZXgnOiAncHVibGljL3Z1ZS1zcmMvZXh0ZW5zaW9ucy90b2tlbi1jb3VudGVyL2luZGV4LmpzJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3JtYXRzOiBbJ2VzJ10sXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIC8vIEV4dGVybmFsaXplIGFsbCBpbXBvcnRzIHRvIGV4aXN0aW5nIFNpbGx5VGF2ZXJuIG1vZHVsZXMuXG4gICAgICAgICAgICAvLyBUaGVzZSByZXNvbHZlIGF0IGJyb3dzZXIgcnVudGltZSB2aWEgZXhwcmVzcy5zdGF0aWMuXG4gICAgICAgICAgICBleHRlcm5hbDogKGlkKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gQnVuZGxlIFZ1ZSBhbmQgLnZ1ZSBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIChpZCA9PT0gJ3Z1ZScgfHwgaWQuZW5kc1dpdGgoJy52dWUnKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIC8vIEJ1bmRsZSBjb21wb3NhYmxlcyAodGhleSdyZSBzbWFsbCBhbmQgVnVlLXNwZWNpZmljKVxuICAgICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL2NvbXBvc2FibGVzLycpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gRXh0ZXJuYWxpemUgZXZlcnl0aGluZyBlbHNlIChTVCBjb3JlIG1vZHVsZXMpXG4gICAgICAgICAgICAgICAgaWYgKGlkLnN0YXJ0c1dpdGgoJy4nKSB8fCBpZC5zdGFydHNXaXRoKCcvJykpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgICAgICAvLyBQcmVzZXJ2ZSBkaXJlY3Rvcnkgc3RydWN0dXJlIGluIG91dHB1dFxuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnW25hbWVdLmpzJyxcbiAgICAgICAgICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2NodW5rcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICAgIGFsaWFzOiB7XG4gICAgICAgICAgICAnQHN0JzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycpLFxuICAgICAgICB9LFxuICAgIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFYsU0FBUyxvQkFBb0I7QUFDdlgsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDZixPQUFPO0FBQUEsSUFDSCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsSUFDYixLQUFLO0FBQUEsTUFDRCxPQUFPO0FBQUEsUUFDSCxrQ0FBa0M7QUFBQSxNQUN0QztBQUFBLE1BQ0EsU0FBUyxDQUFDLElBQUk7QUFBQSxJQUNsQjtBQUFBLElBQ0EsZUFBZTtBQUFBO0FBQUE7QUFBQSxNQUdYLFVBQVUsQ0FBQyxPQUFPO0FBRWQsWUFBSSxPQUFPLFNBQVMsR0FBRyxTQUFTLE1BQU0sRUFBRyxRQUFPO0FBRWhELFlBQUksR0FBRyxTQUFTLGVBQWUsRUFBRyxRQUFPO0FBRXpDLFlBQUksR0FBRyxXQUFXLEdBQUcsS0FBSyxHQUFHLFdBQVcsR0FBRyxFQUFHLFFBQU87QUFDckQsZUFBTztBQUFBLE1BQ1g7QUFBQSxNQUNBLFFBQVE7QUFBQTtBQUFBLFFBRUosZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDcEI7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0gsT0FBTyxLQUFLLFFBQVEsa0NBQVcsUUFBUTtBQUFBLElBQzNDO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
