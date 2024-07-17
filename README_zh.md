# Vite Plugin Dir2json

![npm](https://img.shields.io/npm/dt/vite-plugin-dir2json?style=flat-square)
![GitHub package.json version](https://img.shields.io/github/package-json/v/buddywang/vite-plugin-dir2json?color=brightgreen&style=flat-square)
![GitHub](https://img.shields.io/github/license/buddywang/vite-plugin-dir2json?color=brightgreen&style=flat-square)

# 功能

- [x] 将目录结构转换为包含指定后缀格式的文件路径的 JSON 数据
- [x] 默认返回静态路径，支持通过 `lazy` query 指定返回动态 import
- [x] 支持通过 query 或 options 自定义文件格式过滤，`ext`和`extg` query 会覆盖默认支持的 ext 列表

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

例如，对于以下目录结构:

```bash
home
├── h5
│   └── home1
│       └── home1.mp4
└── pc
    └── home1
        └── home1.mp4
```

返回如下数据:

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

默认支持以下文件扩展名，你也可以通过 `ext` query 或者 `extg` query 配合`options.extGroup` 来指定其他扩展名：

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

# 使用

## 安装

```bash
# using npm
npm install -D vite-plugin-dir2json
# using pnpm
pnpm install -D vite-plugin-dir2json
# using yarn
yarn add --dev vite-plugin-dir2json
```

## Vite 配置

```js
import { defineConfig } from "vite";
import dir2json from "vite-plugin-dir2json";

// https://vitejs.dev/config/
export default defineConfig({
  // ...
  plugins: [dir2json(/* options */)],
});
```

## Options 配置

```ts
interface Dir2jsonOptions {
  /**
   * 配置文件扩展名，配合 `extg` query 使用
   */
  extGroup?: { [key: string]: string[] };
  /**
   * 1. 可自定义 .d.ts 文件的路径，如 './src/xx.d.ts'
   * 2. 当项目是ts类型时，默认是 './dir2json.d.ts'
   * 3. 设置 false 禁止生成 .d.ts 文件
   */
  dts?: boolean | string;
  // /**
  //  * @deprecated (<=v1.0.5) use 'ext' query or 'extg' query with 'option.extGroup'
  //  * Additional support for file extensions
  //  */
  // ext?: string[];
}
```

## Query

- `ext`: 指定其它文件扩展名集合，会覆盖默认的扩展名集合, eg: `xx?dir2json&ext=.vue`
- `extg`: 指定其它文件扩展名集合，搭配 `options.extGroup` 使用，例如：

```ts
// vite.config.ts
// ...
export default defineConfig({
  // ...
  plugins: [
    dir2json({
      extGroup: {
        a: [".vue", ".xxx", ".xxx", ".xxxx"],
      },
    }),
  ],
});

// use
import xxxJson from "/path/to/xxx?dir2json&extg=a";
```

- `lazy`: 指定返回动态 import，例如:

```ts
// router.ts
import Views from "/path/to/views?dir2json&ext=.vue&lazy";

console.log(Views);
// {
//   about: () => import('/path/to/views/about.vue')
// };
```

## Typescript 支持

当您的项目是 ts 项目时，`vite-plugin-dir2json`会默认开启 ts 支持，本地开发环境会自动生成`dir2json.d.ts`文件，让您获取正确的类型提示如下(可通过配置 `options.dts`更改默认配置)：

![image](https://raw.githubusercontent.com/buddywang/vite-plugin-dir2json/main/img/code2.png)

为了获得正确的类型提示，请确保以下步骤：

1. 开启 `options.dts` 以自动生成 `dir2json.d.ts`文件
2. 确保 `dir2json.d.ts`文件的路径被 ts 识别到，如下:

```json
// tsconfig.json
{
  // ...
  "include": ["./dir2json.d.ts" /** ... */]
  // ...
}
```

3. 运行开发服务器(`npm run dev`), 在添加完 `imort xx from xxx?dir2json` 之类的语句后，保存修改，这样 `dir2json.d.ts` 文件会自动更新

### 注意

自动生成的 `dir2json.d.ts` 文件格式如下:

![image](https://raw.githubusercontent.com/buddywang/vite-plugin-dir2json/main/img/code3.png)

可以看到，最后一级目录名和 query 会作为模块名，所以当最后一级目录名相同时，为了防止类型声明被覆盖，可以添加查询参数来保证模块名称是唯一的，如下 `&1` ：

![image](https://raw.githubusercontent.com/buddywang/vite-plugin-dir2json/main/img/code4.png)

# [例子](./example/vite-vue-demo/vite.config.ts)

```ts
import dirJson from "../path/to/dir?dir2json";

console.log("dirJson>>>", dirJson);
```
