import { existsSync } from "node:fs";
import path from "path";
import { writeFile } from "node:fs/promises";
import type { ResolvedConfig, PluginOption } from "vite";
// todo(replace): too large bundle after 'isPackageExists' imported
import { isPackageExists } from "local-pkg";
import {
  isSupportExt,
  replaceTag,
  setObject,
  supportImageExt,
  supportMediaExt,
  traverseDir,
} from "./utils";

export interface Dir2jsonOptions {
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

export function dir2json(options: Dir2jsonOptions = {}): PluginOption {
  let root: string;
  let mode: string;
  let pluginContext: any;
  const suportFileExtList = [
    ...supportImageExt,
    ...supportMediaExt,
    ...(options.ext || []),
  ];

  // dts
  const dtsContext: {
    [key: string]: {
      moduleTag: string;
      dataCode: string;
    };
  } = {};
  const { dts = isPackageExists("typescript") } = options;
  let dtsFilePath: string;
  const dtsFileHeader = `/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// Auto generated by vite-plugin-dir2json`;
  const dtsFileFooter = `
declare module "*dir2json" {
  const json: any;
  export default json;
}`;

  return {
    name: "vite-plugin-dir2json",
    configResolved(resolvedConfig: ResolvedConfig) {
      root = resolvedConfig.root;
      mode = resolvedConfig.mode;

      // Automatically initialize dts files
      if (!!dts) {
        dtsFilePath =
          typeof dts == "string"
            ? path.join(root, dts)
            : path.join(root, "dir2json.d.ts");
        writeFile(dtsFilePath, dtsFileHeader + dtsFileFooter);
      }
    },
    resolveId: {
      order: "post",
      async handler(source: string, importer: string | undefined) {
        pluginContext = this;
        if (source.includes("?dir2json")) {
          // resolve
          let absolutePath;
          // source will resolve by import-analysis plugin when config alias, if so, just use the result
          if (source.includes(root)) {
            absolutePath = source;
          } else {
            absolutePath = path.join(path.dirname(importer || ""), source);
          }

          // Check if directory exists
          const dirPath = absolutePath.split("?").shift()!;
          if (!existsSync(dirPath)) {
            pluginContext.error(
              `the directory "${source}" from "${importer?.replace(
                root,
                ""
              )}" not exist`
            );
          }

          return absolutePath;
        }
        return null; // other
      },
    },
    async load(id: string) {
      if (id.includes("?dir2json")) {
        const dirPath = id.split("?").shift()!;

        // Recursively traverse directory and assemble json data
        const res = {};
        let importStr = "";
        await traverseDir(dirPath, (filePath, rootDirPath) => {
          if (isSupportExt(filePath, suportFileExtList)) {
            // assemble import statements
            const absolutePath = filePath.replace(root, "");
            // The name of the imported variable
            const importVarName = absolutePath
              .replaceAll(path.sep, "_")
              .replace(".", "_");

            importStr += `import ${importVarName} from "${absolutePath}";\n`;

            // assemble json data
            setObject(
              res,
              filePath.replace(rootDirPath, ""),
              `${replaceTag}${importVarName}${replaceTag}`,
              () => {
                pluginContext.error(
                  `files and directories with the same name are not allowed in the same directory：${absolutePath}`
                );
              }
            );
          }
        });

        // return code string
        const dataCode = `${JSON.stringify(res, null, "  ")}`;
        const finalDataCode = dataCode
          .replaceAll(`"${replaceTag}`, "")
          .replaceAll(`${replaceTag}"`, "");
        let code = `${importStr} 
export default ${finalDataCode}`;

        // refresh dts file
        if (!!dts) {
          // the last-level directory name and query parameter will be used as the module name
          const moduleTag = id.split(path.sep).pop()!;
          dtsContext[moduleTag] = {
            moduleTag,
            dataCode,
          };

          // generate dts file
          let str = dtsFileHeader;
          const dtsContent = Object.values(dtsContext);
          dtsContent.forEach((item) => {
            const reg = new RegExp(`"${replaceTag}.*?${replaceTag}"(,)?`, "g");
            const dataInterface = item.dataCode.replaceAll(reg, "string;");
            str += `
declare module "*${item.moduleTag}" {
  const json: ${dataInterface};
  export default json;
}
`;
          });
          str += dtsFileFooter;
          writeFile(dtsFilePath, str);
        }

        return code;
      }

      return null; // other
    },
    transform: {
      order: "pre",
      handler(code) {
        // Add sideEffectCode in files using dir2json-import to avoid tree-shaking in development mode
        // For dts files generated in development mode
        if (mode == "development" && !!dts && code.includes("?dir2json")) {
          const dir2jsonImportList = [
            ...code.matchAll(/import\s(.*?)\sfrom.*?dir2json.*?;/g),
          ];

          const importNameList = dir2jsonImportList.map((item) => item[1]);
          const sideEffectCode = `\nwindow.dir2jsonSideEffect = [${importNameList.join(
            ","
          )}];`;
          const last = dir2jsonImportList[dir2jsonImportList.length - 1];
          code = code.replace(last[0], `${last[0]}${sideEffectCode}`);
        }
        return { code };
      },
    },
  };
}

export default dir2json;
