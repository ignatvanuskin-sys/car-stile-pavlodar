import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

/**
 * Car Stile — статический лендинг мастерской автоухода в Павлодаре.
 *
 * Стек намеренно минимальный: Vite + React + Tailwind, без серверной части.
 * Заявка не требует бэкенда — форма собирает готовый текст и открывает чат
 * WhatsApp мастерской, поэтому сайт можно раздавать с любого статического
 * хостинга.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // займёт следующий свободный порт, если 3000 занят
    host: true,
  },
});
