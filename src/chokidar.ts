import chokidar from "chokidar";
import { debounce, isFileName, isSupportExt } from "./utils";

const existWatcherMap: { [key: string]: boolean } = {};
const debounceGap = 500;
export const watchDir = (
  dirPath: string,
  extFilter: string[],
  cb: Function
) => {
  const existWatcherKey = `${dirPath}${extFilter.sort().toString()}`;
  if (!existWatcherMap[existWatcherKey]) {
    const watcher = chokidar.watch(dirPath, {
      ignoreInitial: true,
      ignored: (path) => {
        if (isFileName(path)) {
          // 文件
          if (isSupportExt(path, extFilter)) {
            return false;
          } else {
            return true;
          }
        } else {
          // 目录
          return false;
        }
      },
    });
    // 批量add/unlink文件时防抖
    const realCb = debounce(cb, debounceGap);
    watcher
      .on("add", (path) => {
        realCb();
      })
      .on("unlink", (path) => {
        realCb();
      });
    existWatcherMap[existWatcherKey] = true;
  }
};
