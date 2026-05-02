declare namespace PinyinLite {
  interface Options {
    keepUnrecognized?: boolean;
  }

  type PinyinResult = string[][];
}

declare function pinyinlite(str: string, options?: PinyinLite.Options): PinyinLite.PinyinResult;

export = pinyinlite;
