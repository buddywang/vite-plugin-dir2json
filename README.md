# Vite Plugin Dir2json

![npm](https://img.shields.io/npm/dt/vite-plugin-dir2json?style=flat-square)
![GitHub package.json version](https://img.shields.io/github/package-json/v/buddywang/vite-plugin-dir2json?color=brightgreen&style=flat-square)
![GitHub](https://img.shields.io/github/license/buddywang/vite-plugin-dir2json?color=brightgreen&style=flat-square)

# Feature

- [x] Convert the directory structure into json data containing supported file paths.
- [ ] 默认返回静态路径，支持通过 `lazy` query 指定返回动态 import

```js
import homeJson from "/path/to/home?dir2json&lazy";
```

- [ ] 支持通过 query 或 options 自定义文件格式过滤，`ext`和`extg`query 会覆盖默认支持的 ext 列表

```js
import homeJson from "/path/to/home?dir2json&ext=.vue,.ts&lazy";
// 或者自定义的文件后缀太多，可以通过extgroup配置格式组，再通过extg query指定即可
import homeJson from "/path/to/home?dir2json&extg=a&lazy";

// vite.config.ts
dir2json({
  extGroup: {
    a: [".vue", ".ts"],
  },
});
```

For example, for this structure of directory:

```bash
home
├── h5
│   └── home1
│       └── home1.mp4
└── pc
    └── home1
        └── home1.mp4
```

you can get this result:

```ts
import homeJson from "/path/to/home?dir2json";

console.log(homeJson);
// {
//   h5: {
//     home1: {
//       home1: "/src/assets/home/h5/home1/home1.mp4",
//     },
//   },
//   pc: {
//     home1: {
//       home1: "/src/assets/home/pc/home1/home1.mp4",
//     },
//   },
// };
```

Here are the file extensions supported by default, you can add additional extensions using the `options.ext`

```ts
const supportImageExt = [
  ".apng",
  ".png",
  ".jpg",
  ".jpeg",
  ".jfig",
  ".pjepg",
  ".pjp",
  ".gif",
  ".svg",
  ".ico",
  ".avif",
];
const supportMediaExt = [
  ".mp4",
  ".webm",
  ".ogg",
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".opus",
  ".mov",
];
```

# How to use

## Install

```bash
# using npm
npm install -D vite-plugin-dir2json
# using pnpm
pnpm install -D vite-plugin-dir2json
# using yarn
yarn add --dev vite-plugin-dir2json
```

## Vite config

```js
import { defineConfig } from "vite";
import dir2json from "vite-plugin-dir2json";

// https://vitejs.dev/config/
export default defineConfig({
  // ...
  plugins: [dir2json(/* options */)],
});
```

## Options

```ts
interface Dir2jsonOptions {
  /**
   * Additional support for file extensions
   */
  ext?: string[];
  /**
   * Filepath to generate corresponding .d.ts file.
   * Defaults to './dir2json.d.ts' when `typescript` is installed locally.
   * Set `false` to disable.
   */
  dts?: boolean | string;
}
```

## With typescript

When your project is a ts project, `vite-plugin-dir2json` will turn on ts support by default, and the `dir2json.d.ts` file will be automatically generated in the local development environment, allowing you to get the correct type prompts, as follows:

![image](https://raw.githubusercontent.com/buddywang/vite-plugin-dir2json/main/img/code2.png)

In order to properly hint types for import-dir2json variable：

1. Enable options.dts so that `dir2json.d.ts` file is automatically generated
2. Make sure `dir2json.d.ts`'s path is include in tsconfig.json, as follows:

```json
// tsconfig.json
{
  // ...
  "include": ["./dir2json.d.ts" /** ... */]
  // ...
}
```

3. run dev server(`npm run dev`), save the changes after add `imort xx from xxx?dir2json`, then the `dir2json.d.ts` file will be updated

### Notice

The automatically generated `dir2json.d.ts` looks like this:

![image](https://raw.githubusercontent.com/buddywang/vite-plugin-dir2json/main/img/code3.png)

As you can see, the last-level directory name and query parameter will be used as the module name, so when the last-level directory name is the same, in order to prevent type declaration overwriting, you can add the query parameter to ensure that the module name is unique, as follows `&1` :

![image](https://raw.githubusercontent.com/buddywang/vite-plugin-dir2json/main/img/code4.png)

## [Example](./packages/vite-vue-demo/README.md)

```ts
import dirJson from "../path/to/dir?dir2json";

console.log("dirJson>>>", dirJson);
```
