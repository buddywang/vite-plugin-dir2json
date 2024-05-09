import { existsSync } from "fs";
import path from "path";
import { readdir } from "fs/promises";
import { ResolvedConfig, Plugin } from "vite";

// constant
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

// helper
const isSupportExt = (fileName: string) => {
  let res = false;
  supportImageExt.forEach((item) => {
    if (fileName.includes(item)) {
      res = true;
    }
  });
  supportMediaExt.forEach((item) => {
    if (fileName.includes(item)) {
      res = true;
    }
  });
  return res;
};
const isFileName = (str: string) => str.includes(".");
const getFileNameNotExt = (str: string) => str.split(".").shift() || "";

export default function vitePluginDir2Json(): Plugin {
  let root: string;
  let realImporter: string;
  let realSource: string;
  let importStr = "";
  const replaceTag = "¥¥";
  let pluginContext: any;

  // Recursively traverse directory and assemble json data
  const traverseDir = async (
    dirPath: string,
    record: { [key: string]: any }
  ) => {
    let dirData = await readdir(dirPath);
    for (let j = 0; j < dirData.length; j++) {
      const name = dirData[j];

      if (isFileName(name)) {
        // file
        if (isSupportExt(name)) {
          const fullPath = path.join(dirPath, name);
          // remove root path
          const absolutePath = fullPath.replace(root, "");

          // import variable's name
          const importVarName = absolutePath
            .replaceAll(path.sep, "_")
            .replace(".", "_");

          importStr += `import ${importVarName} from "${absolutePath}";`;
          const keyName = getFileNameNotExt(name);

          // check duplicate names of files and directories
          if (record[keyName]) {
            pluginContext.error(
              `files and directories with the same name are not allowed in the same directory：${absolutePath}`
            );
          }

          // Add replaceTag, and remove the " " character from the variable in the final code string.
          record[keyName] = `${replaceTag}${importVarName}${replaceTag}`;
        }
      } else {
        // directory
        const subDirPath = path.join(dirPath, name);
        record[name] = {};
        await traverseDir(subDirPath, record[name]);
      }
    }
  };

  return {
    name: "vite-plugin-dir2json",
    configResolved(resolvedConfig: ResolvedConfig) {
      root = resolvedConfig.root;
    },
    resolveId: {
      order: "post",
      handler(source: string, importer: string | undefined) {
        if (source.includes("?dir2json")) {
          // importer/source will change in dev mode, here just take first value
          if (!realImporter) {
            realImporter = importer!;
            realSource = source;
          }

          // resolve
          let absolutePath;
          // source will resolve by import-analysis plugin when config alias, if so, just use the result
          if (source.includes(root)) {
            absolutePath = source;
          } else {
            absolutePath = path.join(path.dirname(realImporter), source);
          }
          return absolutePath;
        }
        return null; // other
      },
    },
    async load(id: string) {
      pluginContext = this;

      if (id.includes("?dir2json")) {
        // 1. Check if directory exists
        const dir = id.replace("?dir2json", "");
        if (!existsSync(dir)) {
          pluginContext.error(
            `the directory "${realSource}" from "${realImporter.replace(
              root,
              ""
            )}" not exist`
          );
        }

        // 2. Recursively traverse directory and assemble json data
        const res = {};
        await traverseDir(dir, res);

        // 3. return string
        let code = `${importStr}
        export default ${JSON.stringify(res)}`;
        code = code.replaceAll(`"${replaceTag}`, "");
        code = code.replaceAll(`${replaceTag}"`, "");

        return code;
      }
      return null; // other
    },
  };
}
