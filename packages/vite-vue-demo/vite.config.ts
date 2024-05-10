import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dir2json from "vite-plugin-dir2json";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dir2json()],
});
