export interface objectMap {
  [key: string]: any;
}
export interface searchAndSortParams {
  data: Array<string | objectMap>;
  keywords: string;
  keys?: Array<string>;
}