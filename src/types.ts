import { AxiosRequestConfig } from 'axios';

export interface ObjectMap {
  [key: string]: any;
  [key: number]: any;
}
export interface SearchAndSortParams {
  data: Array<string | ObjectMap>;
  keywords: string;
  keys?: Array<string>;
  ignoreCase?: boolean;
}
export interface InitRequestParams extends AxiosRequestConfig {
  retry?: Boolean;
  maxRetry?: number;
}
export interface SendRequestParams extends AxiosRequestConfig {
  onSuccess?: Function;
  onError?: Function;
  ignoreBefore?: boolean;
  __id?: number;
}