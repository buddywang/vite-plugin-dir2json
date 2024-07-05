export interface Dir2jsonOptions {
  /**
   * Additional support for file extensions, use the key as `extg` query
   */
  extGroup?: { [key: string]: string[] };
  /**
   * Filepath to generate corresponding .d.ts file.
   * Defaults to './dir2json.d.ts' when `typescript` is installed locally.
   * Set `false` to disable.
   */
  dts?: boolean | string;
  /**
   * @deprecated use 'ext' query or 'extg' query with 'option.extGroup'
   * Additional support for file extensions
   */
  ext?: string[];
}

export interface IQueryParam {
  dir2json?: boolean;
  lazy?: boolean;
  ext?: string[];
  extg?: string[];
  [key: string]: any;
}

export interface IDtsContext {
  [key: string]: {
    moduleTag: string;
    jsonInterface: string;
  };
}
