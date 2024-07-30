import path from "path";
import { readdir } from "node:fs/promises";
import { IQueryParam } from "./type";

// helper
export const isFileName = (str: string) => str.includes(".");
export const getFileNameNotExt = (str: string) => str.split(".").shift() || "";
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
 * eg: when call setObject(obj, '/h5/home/home1.png', value), it will get `obj.h5.home.home1 = value`
 * @param obj obj
 * @param keyPathInfo absolute path
 * @param value obj key's value
 */
export const setObject = (
  obj: any,
  keyPathInfo: string,
  value: string,
  onError: () => void
) => {
  const temp = keyPathInfo.split(path.sep).filter((item: string) => !!item);
  let tempObj = obj;
  while (temp.length) {
    const item = temp.shift()!;
    if (isFileName(item)) {
      // file
      const keyName = getFileNameNotExt(item);

      // check duplicate names of files and directories
      if (tempObj[keyName]) {
        onError();
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
