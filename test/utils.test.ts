import { describe, expect, it } from "vitest";
import {
  decodeQuery,
  getFileNameNotExt,
  isFileName,
  isSupportExt,
  setObject,
  traverseDir,
} from "../src/utils";
import path from "path";

describe("utils", () => {
  it("isFileName", () => {
    expect(isFileName("abc")).toBe(false);
    expect(isFileName("abc.xxx")).toBe(true);
    expect(isFileName("abc.test.ts")).toBe(true);
  });

  it("getFileNameNotExt", () => {
    expect(getFileNameNotExt("xxx.png")).toBe("xxx");
  });

  it("isSupportExt", () => {
    expect(isSupportExt("xx.png", [".png"])).toBe(true);
    expect(isSupportExt("xx.png", [".jpeg"])).toBe(false);
    expect(isSupportExt("aa.test.ts", [".ts"])).toBe(true);
  });

  it("setObject", () => {
    const obj = {};
    setObject(obj, "/aa/bb/11.png", "val1", () => {});
    setObject(obj, "/22.webp", "val2", () => {});
    setObject(obj, "/22.webp", "val3", () => {});
    const expectObj = { aa: { bb: { "11": "val1" } }, "22": "val3" };
    expect(obj).toEqual(expectObj);
  });

  it("traverseDir", async () => {
    const rootDir = path.resolve("");
    const testDirPath = path.join(rootDir, "./test");

    let path1 = "",
      path2 = "";
    const expectPath1 = path.join(rootDir, "./test/utils.test.ts");
    const expectPath2 = testDirPath;

    await traverseDir(testDirPath, [".ts"], (filePath, rootDirPath) => {
      if (filePath.includes("utils.test.ts")) {
        path1 = filePath;
        path2 = rootDirPath;
      }
    });
    expect(path1).toBe(expectPath1);
    expect(path2).toBe(expectPath2);
  });

  it("decodeQuery", () => {
    const queryObj = decodeQuery("dir2json&lazy&ext=.vue,.ts");
    const expectObj = { dir2json: true, lazy: true, ext: [".vue", ".ts"] };
    expect(queryObj).toEqual(expectObj);

    const queryObj2 = decodeQuery("dir2json&lazy&extg=a");
    const expectObj2 = { dir2json: true, lazy: true, extg: ["a"] };
    expect(queryObj2).toEqual(expectObj2);
  });
});
