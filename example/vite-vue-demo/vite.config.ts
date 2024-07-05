import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dir2json from "vite-plugin-dir2json";
// @ts-ignore
import dir2jsonOrigin from "../../src/index";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let pluginFunc = dir2json;
  if (mode == "debug") {
    pluginFunc = dir2jsonOrigin;
  }

  return {
    plugins: [vue(), pluginFunc()],
  };
});
