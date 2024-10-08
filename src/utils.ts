import path from "path";
import { readdir } from "node:fs/promises";
import { IQueryParam } from "./type";

// helper
export const isFileName = (str: string) => str.includes(".");
export const getFileNameWithoutExt = (str: string) =>
  str.split(".").shift() || "";
export const getFileNameWithExt = (str: string) => {
  const [fileName, ext] = str.split(".");
  return fileName + ext.toLocaleUpperCase();
};
export const isSupportExt = (fileName: string, supportExtList: string[]) => {
  let res = false;
  supportExtList.forEach((item) => {
    if (fileName.includes(item)) {
      res = true;
    }
  });
  return res;
};

/**
 * eg: normally, when call setObject(obj, '/h5/home/home1.png', value), it will get `obj.h5.home.home1 = value`
 * @param obj obj
 * @param keyPathInfo absolute path
 * @param value obj key's value
 */
export const setObject = (obj: any, keyPathInfo: string, value: string) => {
  const temp = keyPathInfo.split(path.sep).filter((item: string) => !!item);
  let tempObj = obj;
  while (temp.length) {
    const item = temp.shift()!;
    if (isFileName(item)) {
      // file
      // fix bug:
      // 一般情况下，keyname不带文件后缀信息，当同一目录下存在同名但不同后缀的文件时，这时文件对应的keyname会带上文件后缀做唯一标识
      let keyName = getFileNameWithoutExt(item);

      if (tempObj[keyName]) {
        if (typeof tempObj[keyName] == "string") {
          // 已有keyName是文件，把 keyName 转成带后缀形式
          const prevExt = tempObj[keyName].split("__")[2];
          const prevNewKey = keyName + prevExt.toLocaleUpperCase();
          tempObj[prevNewKey] = tempObj[keyName];
          tempObj[keyName] = Symbol("not use"); // strigify 时会去掉 value为symbol的值
        } else {
          // 已有keyName是目录，不做处理
        }

        // keyName 带上文件后缀做唯一标识
        keyName = getFileNameWithExt(item);
      }

      tempObj[keyName] = value;
    } else {
      // dir
      if (!tempObj[item]) {
        tempObj[item] = {};
      }
      tempObj = tempObj[item];
    }
  }
};

/**
 * Recursively traverse directory, call cb to every file
 * @param dirPath directory Path
 * @param extFilter trigger callback when file's ext in extFilter
 * @param cb callback func
 * @param rootDirPath root directory path
 */
export const traverseDir = async (
  dirPath: string,
  extFilter: string[],
  cb: (filePath: string, rootDirPath: string) => void,
  rootDirPath?: string
) => {
  if (!rootDirPath) {
    rootDirPath = dirPath;
  }

  let dirData = await readdir(dirPath);
  for (let j = 0; j < dirData.length; j++) {
    const name = dirData[j];

    if (isFileName(name)) {
      // file
      const filePath = path.join(dirPath, name);
      if (isSupportExt(filePath, extFilter)) {
        cb(filePath, rootDirPath);
      }
    } else {
      // directory
      const subDirPath = path.join(dirPath, name);
      await traverseDir(subDirPath, extFilter, cb, rootDirPath);
    }
  }
};

/**
 * decode queryStr, eg: input `dir2json&lazy&ext=.vue` return {dir2json: true, lazy:true, ext: ['.vue']}
 * @param queryStr eg: `dir2json&lazy&ext=.vue`
 * @returns param object
 */
export const decodeQuery = (queryStr: string) => {
  const paramArr = queryStr.split("&");
  let param: IQueryParam = {};
  paramArr.forEach((item) => {
    if (item.includes("=")) {
      const [key, val] = item.split("=");
      param[key] = val.split(",");
    } else {
      param[item] = true;
    }
  });
  return param;
};

/**
 * 返回 toFilePath 相对 fromFilePath 的相对路径，
 * @param fromFilePath 相对的文件路径
 * @param toFilePath 要计算的文件路径
 * @returns toFilePath 相对 fromFilePath 的相对路径
 */
export const getRelativePath = (fromFilePath: string, toFilePath: string) => {
  const fromDirName = path.dirname(fromFilePath);
  const toDirName = path.dirname(toFilePath);
  const toFileName = path.basename(toFilePath);
  let relativeDirPath = path.relative(fromDirName, toDirName);
  let relativePath = path.join(relativeDirPath, toFileName);

  if (!relativePath.startsWith(".")) {
    // 为了能触发 按住command + 点击 跳转文件
    relativePath = "./" + relativePath;
  }

  return relativePath;
};

/**
 * debounce
 * @param func func
 * @param wait debounce gap
 * @returns debounce func
 */
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    // @ts-ignore
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};
