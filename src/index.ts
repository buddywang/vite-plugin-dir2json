import { existsSync } from "node:fs";
import path from "path";
import { writeFile } from "node:fs/promises";
import type { PluginOption } from "vite";
// todo(replace): too large bundle after 'isPackageExists' imported
import { isPackageExists } from "local-pkg";
import { decodeQuery, getRelativePath, setObject, traverseDir } from "./utils";
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
        const importNameInterfaceMap: { [key: string]: string } = {};
        // 自增的数字，用于生成合法唯一的变量名
        let selfIncreasingNum = 0;
        await traverseDir(dirPath, extFilter, (filePath, rootDirPath) => {
          // assemble import statements
          const absolutePath = filePath.replace(root, "");
          // The name of the imported variable
          // fix bug: 为了保证 importVarName 合法且唯一，这里采用自增数字作为标识
          // fix bug: importVarName带上文件ext信息， setObject 里可能会用到
          const fileExt = absolutePath.split(".").pop();
          const importVarName = `__${selfIncreasingNum++}__${fileExt}__`;

          if (param.lazy) {
            importStr += `const ${importVarName} = () => import("${absolutePath}");\n`;
            // 获取相对路径，方便跳转对应的文件
            let relativePath = getRelativePath(dtsFilePath, filePath);
            importNameInterfaceMap[importVarName] = relativePath;
          } else {
            importStr += `import ${importVarName} from "${absolutePath}";\n`;
          }

          // assemble json data
          setObject(
            res,
            filePath.replace(rootDirPath, ""),
            `${replaceTag}${importVarName}${replaceTag}`
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
          const reg = new RegExp(`"${replaceTag}(.*?)${replaceTag}",?`, "g");
          let jsonInterface: string;
          if (param.lazy) {
            jsonInterface = dataCode.replaceAll(reg, (...args) => {
              return `() => Promise<typeof import("${
                importNameInterfaceMap[args[1]]
              }")>;`;
            });
          } else {
            jsonInterface = dataCode.replaceAll(reg, "string;");
          }
          dtsContext[moduleTag] = {
            moduleTag,
            jsonInterface,
          };

          // generate dts file
          let str = dtsFileHeader;
          // 优化: sort 保证 dtsContent 数组有序，保证dts文件结构稳定
          const dtsContent = Object.keys(dtsContext)
            .sort((a: string, b: string) => {
              return a > b ? -1 : 1;
            })
            .map((key) => {
              return dtsContext[key];
            });

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
          // fix bug: 注释的行不用生成对应的类型声明
          // fix bug: 更新正则
          // (?<!\/\/\s*) 后行断言: 过滤注释行
          // ['"];? 兼容不同格式的代码
          // .*? 最小匹配（非贪婪）
          const dir2jsonImportList = [
            ...code.matchAll(
              /(?<!\/\/\s*)import\s(.*?)\sfrom.*?dir2json.*?['"];?/g
            ),
          ];

          // 如果注释了 ?dir2josn 行，那么 dir2jsonImportList 数组有可能为空
          if (dir2jsonImportList.length) {
            const importNameList = dir2jsonImportList.map((item) => item[1]);
            // fix bug: 加入try catch，用并联的方式注入 effectcode，防止报错卡死
            let sideEffectCode = ``;
            importNameList.map((item) => {
              sideEffectCode += `\ntry {
                window.dir2jsonSideEffect = ${item}
              } catch (error) {};\n`;
            });
            const last = dir2jsonImportList[dir2jsonImportList.length - 1];
            code = code.replace(last[0], `${last[0]}${sideEffectCode}`);
          }
        }
        return { code };
      },
    },
  };
}

export default dir2json;
