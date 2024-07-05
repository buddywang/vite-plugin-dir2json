import { existsSync } from "node:fs";
import path from "path";
import { writeFile } from "node:fs/promises";
import type { PluginOption } from "vite";
// todo(replace): too large bundle after 'isPackageExists' imported
import { isPackageExists } from "local-pkg";
import { decodeQuery, setObject, traverseDir } from "./utils";
import {
  dtsFileFooter,
  dtsFileHeader,
  replaceTag,
  defalutExtList,
} from "./constant";
import { Dir2jsonOptions, IDtsContext, IQueryParam } from "./type";

function dir2json(options: Dir2jsonOptions = {}): PluginOption {
  let root = path.resolve("");
  let mode = process.env.NODE_ENV;
  let pluginContext: any;

  // dts
  const dtsContext: IDtsContext = {};
  const { dts = isPackageExists("typescript") } = options;
  let dtsFilePath: string;
  // initialize dts files
  if (!!dts) {
    dtsFilePath =
      typeof dts == "string"
        ? path.join(root, dts)
        : path.join(root, "dir2json.d.ts");

    // 不存在dts文件时，初始化dts文件
    // init dts file when not exist dts file
    if (!existsSync(dtsFilePath)) {
      writeFile(dtsFilePath, dtsFileHeader + dtsFileFooter);
    }
  }

  return {
    name: "vite-plugin-dir2json",
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
        const [dirPath, queryStr] = id.split("?");
        const param: IQueryParam = decodeQuery(queryStr);

        // extFilter
        let extFilter = defalutExtList;
        if (param.ext) {
          extFilter = param.ext;
        } else if (param.extg) {
          const temp: string[] = [];
          param.extg.forEach((groupKey) => {
            if (options.extGroup && options.extGroup[groupKey]) {
              temp.push(...options.extGroup[groupKey]);
            }
          });
          extFilter = temp;
        }

        // Recursively traverse directory and assemble json data
        const res = {};
        let importStr = "";
        await traverseDir(dirPath, extFilter, (filePath, rootDirPath) => {
          // assemble import statements
          const absolutePath = filePath.replace(root, "");
          // The name of the imported variable
          const importVarName = absolutePath
            .replaceAll(path.sep, "_")
            .replace(".", "_");

          if (param.lazy) {
            importStr += `const ${importVarName} = () => import("${absolutePath}");\n`;
          } else {
            importStr += `import ${importVarName} from "${absolutePath}";\n`;
          }

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
          const reg = new RegExp(`"${replaceTag}.*?${replaceTag}"(,)?`, "g");
          let jsonInterface: string;
          if (param.lazy) {
            jsonInterface = dataCode.replaceAll(reg, `() => Promise<any>;`);
          } else {
            jsonInterface = dataCode.replaceAll(reg, "string;");
          }
          dtsContext[moduleTag] = {
            moduleTag,
            jsonInterface,
          };

          // generate dts file
          let str = dtsFileHeader;
          const dtsContent = Object.values(dtsContext);
          dtsContent.forEach(({ moduleTag, jsonInterface }) => {
            str += `
declare module "*${moduleTag}" {
  const json: ${jsonInterface};
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
