// vite.config.js
import { defineConfig } from "file:///E:/triocommerceshopify/node_modules/vite/dist/node/index.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import react from "file:///E:/triocommerceshopify/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///E:/triocommerceshopify/web/frontend/vite.config.js";
if (process.env.npm_lifecycle_event === "build" && !process.env.CI && !process.env.SHOPIFY_API_KEY) {
  console.warn(
    "\nBuilding the frontend app without an API key. The frontend build will not run without an API key. Set the SHOPIFY_API_KEY environment variable when running the build command.\n"
  );
}
var proxyOptions = {
  target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
  changeOrigin: false,
  secure: true,
  ws: false
};
var host = process.env.HOST ? process.env.HOST.replace(/https?:\/\//, "") : "localhost";
var hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host,
    port: process.env.FRONTEND_PORT,
    clientPort: 443
  };
}
var vite_config_default = defineConfig({
  root: dirname(fileURLToPath(__vite_injected_original_import_meta_url)),
  plugins: [react()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify(process.env.SHOPIFY_API_KEY)
  },
  resolve: {
    preserveSymlinks: true
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT,
    hmr: hmrConfig,
    proxy: {
      "^/(\\?.*)?$": proxyOptions,
      "^/api(/|(\\?.*)?$)": proxyOptions
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFx0cmlvY29tbWVyY2VzaG9waWZ5XFxcXHdlYlxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcdHJpb2NvbW1lcmNlc2hvcGlmeVxcXFx3ZWJcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L3RyaW9jb21tZXJjZXNob3BpZnkvd2ViL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCBodHRwcyBmcm9tIFwiaHR0cHNcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcblxuaWYgKFxuICBwcm9jZXNzLmVudi5ucG1fbGlmZWN5Y2xlX2V2ZW50ID09PSBcImJ1aWxkXCIgJiZcbiAgIXByb2Nlc3MuZW52LkNJICYmXG4gICFwcm9jZXNzLmVudi5TSE9QSUZZX0FQSV9LRVlcbikge1xuICBjb25zb2xlLndhcm4oXG4gICAgXCJcXG5CdWlsZGluZyB0aGUgZnJvbnRlbmQgYXBwIHdpdGhvdXQgYW4gQVBJIGtleS4gVGhlIGZyb250ZW5kIGJ1aWxkIHdpbGwgbm90IHJ1biB3aXRob3V0IGFuIEFQSSBrZXkuIFNldCB0aGUgU0hPUElGWV9BUElfS0VZIGVudmlyb25tZW50IHZhcmlhYmxlIHdoZW4gcnVubmluZyB0aGUgYnVpbGQgY29tbWFuZC5cXG5cIlxuICApO1xufVxuXG5jb25zdCBwcm94eU9wdGlvbnMgPSB7XG4gIHRhcmdldDogYGh0dHA6Ly8xMjcuMC4wLjE6JHtwcm9jZXNzLmVudi5CQUNLRU5EX1BPUlR9YCxcbiAgY2hhbmdlT3JpZ2luOiBmYWxzZSxcbiAgc2VjdXJlOiB0cnVlLFxuICB3czogZmFsc2UsXG59O1xuXG5jb25zdCBob3N0ID0gcHJvY2Vzcy5lbnYuSE9TVFxuICA/IHByb2Nlc3MuZW52LkhPU1QucmVwbGFjZSgvaHR0cHM/OlxcL1xcLy8sIFwiXCIpXG4gIDogXCJsb2NhbGhvc3RcIjtcblxubGV0IGhtckNvbmZpZztcbmlmIChob3N0ID09PSBcImxvY2FsaG9zdFwiKSB7XG4gIGhtckNvbmZpZyA9IHtcbiAgICBwcm90b2NvbDogXCJ3c1wiLFxuICAgIGhvc3Q6IFwibG9jYWxob3N0XCIsXG4gICAgcG9ydDogNjQ5OTksXG4gICAgY2xpZW50UG9ydDogNjQ5OTksXG4gIH07XG59IGVsc2Uge1xuICBobXJDb25maWcgPSB7XG4gICAgcHJvdG9jb2w6IFwid3NzXCIsXG4gICAgaG9zdDogaG9zdCxcbiAgICBwb3J0OiBwcm9jZXNzLmVudi5GUk9OVEVORF9QT1JULFxuICAgIGNsaWVudFBvcnQ6IDQ0MyxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcm9vdDogZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpLFxuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIGRlZmluZToge1xuICAgIFwicHJvY2Vzcy5lbnYuU0hPUElGWV9BUElfS0VZXCI6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52LlNIT1BJRllfQVBJX0tFWSksXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBwcmVzZXJ2ZVN5bWxpbmtzOiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcImxvY2FsaG9zdFwiLFxuICAgIHBvcnQ6IHByb2Nlc3MuZW52LkZST05URU5EX1BPUlQsXG4gICAgaG1yOiBobXJDb25maWcsXG4gICAgcHJveHk6IHtcbiAgICAgIFwiXi8oXFxcXD8uKik/JFwiOiBwcm94eU9wdGlvbnMsXG4gICAgICBcIl4vYXBpKC98KFxcXFw/LiopPyQpXCI6IHByb3h5T3B0aW9ucyxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1TLFNBQVMsb0JBQW9CO0FBQ2hVLFNBQVMsZUFBZTtBQUN4QixTQUFTLHFCQUFxQjtBQUU5QixPQUFPLFdBQVc7QUFKbUssSUFBTSwyQ0FBMkM7QUFNdE8sSUFDRSxRQUFRLElBQUksd0JBQXdCLFdBQ3BDLENBQUMsUUFBUSxJQUFJLE1BQ2IsQ0FBQyxRQUFRLElBQUksaUJBQ2I7QUFDQSxVQUFRO0FBQUEsSUFDTjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU0sZUFBZTtBQUFBLEVBQ25CLFFBQVEsb0JBQW9CLFFBQVEsSUFBSSxZQUFZO0FBQUEsRUFDcEQsY0FBYztBQUFBLEVBQ2QsUUFBUTtBQUFBLEVBQ1IsSUFBSTtBQUNOO0FBRUEsSUFBTSxPQUFPLFFBQVEsSUFBSSxPQUNyQixRQUFRLElBQUksS0FBSyxRQUFRLGVBQWUsRUFBRSxJQUMxQztBQUVKLElBQUk7QUFDSixJQUFJLFNBQVMsYUFBYTtBQUN4QixjQUFZO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDVixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUNGLE9BQU87QUFDTCxjQUFZO0FBQUEsSUFDVixVQUFVO0FBQUEsSUFDVjtBQUFBLElBQ0EsTUFBTSxRQUFRLElBQUk7QUFBQSxJQUNsQixZQUFZO0FBQUEsRUFDZDtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTSxRQUFRLGNBQWMsd0NBQWUsQ0FBQztBQUFBLEVBQzVDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTiwrQkFBK0IsS0FBSyxVQUFVLFFBQVEsSUFBSSxlQUFlO0FBQUEsRUFDM0U7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLGtCQUFrQjtBQUFBLEVBQ3BCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNLFFBQVEsSUFBSTtBQUFBLElBQ2xCLEtBQUs7QUFBQSxJQUNMLE9BQU87QUFBQSxNQUNMLGVBQWU7QUFBQSxNQUNmLHNCQUFzQjtBQUFBLElBQ3hCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
