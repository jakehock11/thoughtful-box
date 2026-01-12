import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";
import { componentTagger } from "lovable-tagger";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    electron([
      {
        // Main process entry
        entry: "electron/main.ts",
        onstart(args) {
          args.startup();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["better-sqlite3"],
              plugins: [
                copy({
                  targets: [
                    { src: "electron/database/schema.sql", dest: "dist-electron" },
                  ],
                  hook: "writeBundle",
                }),
              ],
            },
          },
        },
      },
      {
        // Preload script entry
        entry: "electron/preload.ts",
        onstart(args) {
          // Notify the renderer process when preload scripts have been rebuilt
          args.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron",
            lib: {
              entry: "electron/preload.ts",
              formats: ["cjs"],
            },
            rollupOptions: {
              external: ["better-sqlite3"],
              output: {
                entryFileNames: "preload.js",
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
}));
