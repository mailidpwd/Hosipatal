import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      tailwindcss(), 
      react(), 
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "RDM Health",
          short_name: "RDM Health",
          description: "RDM Health - PWA Application",
          theme_color: "#0df2df",
        },
        pwaAssets: { disabled: false, config: true },
        devOptions: { enabled: true },
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3001,
      host: '0.0.0.0',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
  };
});
