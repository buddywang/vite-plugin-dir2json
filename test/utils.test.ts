import { describe, expect, it } from "vitest";
import {
  decodeQuery,
  getFileNameWithoutExt,
  getFileNameWithExt,
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

  it("getFileNameWithoutExt", () => {
    expect(getFileNameWithoutExt("xxx.png")).toBe("xxx");
  });

  it("getFileNameWithExt", () => {
    expect(getFileNameWithExt("xxx.png")).toBe("xxxPNG");
  });

  it("isSupportExt", () => {
    expect(isSupportExt("xx.png", [".png"])).toBe(true);
    expect(isSupportExt("xx.png", [".jpeg"])).toBe(false);
    expect(isSupportExt("aa.test.ts", [".ts"])).toBe(true);
  });

  it("setObject", () => {
    let obj = {};
    setObject(obj, "/aa/bb/11.png", "$$__1__png__$$");
    setObject(obj, "/aa/bb/11.jpg", "$$__2__jpg__$$");
    setObject(obj, "/aa/bb/22.png", "$$__3__png__$$");
    setObject(obj, "/aa.png", "$$__4__png__$$");
    // 去掉 symbol 值
    obj = JSON.parse(JSON.stringify(obj));
    const expectObj = {
      aa: {
        bb: {
          "11PNG": "$$__1__png__$$",
          "11JPG": "$$__2__jpg__$$",
          "22": "$$__3__png__$$",
        },
      },
      aaPNG: "$$__4__png__$$",
    };
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
