# Vite Plugin Dir2json

![npm](https://img.shields.io/npm/dt/vite-plugin-dir2json?style=flat-square)
![GitHub package.json version](https://img.shields.io/github/package-json/v/UstymUkhman/vite-plugin-dir2json?color=brightgreen&style=flat-square)
![GitHub](https://img.shields.io/github/license/UstymUkhman/vite-plugin-dir2json?color=brightgreen&style=flat-square)

# Feature

> Convert the directory structure into json data containing supported file paths.

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

Here are the file extensions supported by default, you can add additional extensions using the options

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
export interface Dir2jsonOptions {
  /**
   * Additional support for file extensions
   */
  ext: string[];
}
```

## With typescript

add below to the top of a new `ext.d.ts` file or exists `dts` file

```ts
/// <reference types="vite-plugin-dir2json/ext" />
```

or append below to a `dts` file

```ts
// ...
declare module "*?dir2json" {
  const src: { [key: string]: any };
  export default src;
}
// ...
```

## [Example](./packages/vite-vue-demo/README.md)

```ts
import dirJson from "../path/to/dir?dir2json";

console.log("dirJson>>>", dirJson);
```
