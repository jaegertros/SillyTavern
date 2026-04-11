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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvYXdlc29tZS1zd2VldC1jcmF5L21udC9TaWxseVRhdmVybi9TaWxseVRhdmVyblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL3Nlc3Npb25zL2F3ZXNvbWUtc3dlZXQtY3JheS9tbnQvU2lsbHlUYXZlcm4vU2lsbHlUYXZlcm4vdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL3Nlc3Npb25zL2F3ZXNvbWUtc3dlZXQtY3JheS9tbnQvU2lsbHlUYXZlcm4vU2lsbHlUYXZlcm4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgICBidWlsZDoge1xuICAgICAgICBvdXREaXI6ICdwdWJsaWMvdnVlLWRpc3QnLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICAgICAgbGliOiB7XG4gICAgICAgICAgICBlbnRyeToge1xuICAgICAgICAgICAgICAgICdleHRlbnNpb25zL3Rva2VuLWNvdW50ZXIvaW5kZXgnOiAncHVibGljL3Z1ZS1zcmMvZXh0ZW5zaW9ucy90b2tlbi1jb3VudGVyL2luZGV4LmpzJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmb3JtYXRzOiBbJ2VzJ10sXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIC8vIEV4dGVybmFsaXplIGFsbCBpbXBvcnRzIHRvIGV4aXN0aW5nIFNpbGx5VGF2ZXJuIG1vZHVsZXMuXG4gICAgICAgICAgICAvLyBUaGVzZSByZXNvbHZlIGF0IGJyb3dzZXIgcnVudGltZSB2aWEgZXhwcmVzcy5zdGF0aWMuXG4gICAgICAgICAgICBleHRlcm5hbDogKGlkKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gTmV2ZXIgZXh0ZXJuYWxpemUgb3VyIG93biB2dWUtc3JjIGZpbGVzIChoYW5kbGVzIHJlc29sdmVkIGFic29sdXRlIHBhdGhzKVxuICAgICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3Z1ZS1zcmMvJykgfHwgaWQuaW5jbHVkZXMoJ1xcXFx2dWUtc3JjXFxcXCcpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gQnVuZGxlIFZ1ZSAtIG1hdGNoIGJvdGggYmFyZSBzcGVjaWZpZXIgYW5kIHJlc29sdmVkIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09ICd2dWUnIHx8IGlkLmluY2x1ZGVzKCcvbm9kZV9tb2R1bGVzL3Z1ZS8nKSB8fCBpZC5pbmNsdWRlcygnXFxcXG5vZGVfbW9kdWxlc1xcXFx2dWVcXFxcJykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyBCdW5kbGUgLnZ1ZSBmaWxlc1xuICAgICAgICAgICAgICAgIGlmIChpZC5lbmRzV2l0aCgnLnZ1ZScpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgLy8gQnVuZGxlIGNvbXBvc2FibGVzICh0aGV5J3JlIHNtYWxsIGFuZCBWdWUtc3BlY2lmaWMpXG4gICAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCcvY29tcG9zYWJsZXMvJykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyBFeHRlcm5hbGl6ZSBldmVyeXRoaW5nIGVsc2UgKFNUIGNvcmUgbW9kdWxlcylcbiAgICAgICAgICAgICAgICBpZiAoaWQuc3RhcnRzV2l0aCgnLicpIHx8IGlkLnN0YXJ0c1dpdGgoJy8nKSkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIC8vIFByZXNlcnZlIGRpcmVjdG9yeSBzdHJ1Y3R1cmUgaW4gb3V0cHV0XG4gICAgICAgICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdbbmFtZV0uanMnLFxuICAgICAgICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnY2h1bmtzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgICAgYWxpYXM6IHtcbiAgICAgICAgICAgICdAc3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncHVibGljJyksXG4gICAgICAgIH0sXG4gICAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVixTQUFTLG9CQUFvQjtBQUN2WCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQ3hCLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxFQUNmLE9BQU87QUFBQSxJQUNILFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLEtBQUs7QUFBQSxNQUNELE9BQU87QUFBQSxRQUNILGtDQUFrQztBQUFBLE1BQ3RDO0FBQUEsTUFDQSxTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2xCO0FBQUEsSUFDQSxlQUFlO0FBQUE7QUFBQTtBQUFBLE1BR1gsVUFBVSxDQUFDLE9BQU87QUFFZCxZQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLGFBQWEsRUFBRyxRQUFPO0FBRW5FLFlBQUksT0FBTyxTQUFTLEdBQUcsU0FBUyxvQkFBb0IsS0FBSyxHQUFHLFNBQVMsdUJBQXVCLEVBQUcsUUFBTztBQUV0RyxZQUFJLEdBQUcsU0FBUyxNQUFNLEVBQUcsUUFBTztBQUVoQyxZQUFJLEdBQUcsU0FBUyxlQUFlLEVBQUcsUUFBTztBQUV6QyxZQUFJLEdBQUcsV0FBVyxHQUFHLEtBQUssR0FBRyxXQUFXLEdBQUcsRUFBRyxRQUFPO0FBQ3JELGVBQU87QUFBQSxNQUNYO0FBQUEsTUFDQSxRQUFRO0FBQUE7QUFBQSxRQUVKLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ3BCO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNILE9BQU8sS0FBSyxRQUFRLGtDQUFXLFFBQVE7QUFBQSxJQUMzQztBQUFBLEVBQ0o7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
