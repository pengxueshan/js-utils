import axios, { AxiosResponse } from 'axios';
import { pick } from './core';
import { ObjectMap, SendRequestParams, InitRequestParams } from './types';

const axiosOpts = [
  'url',
  'method',
  'baseURL',
  'transformRequest',
  'transformResponse',
  'headers',
  'params',
  'paramsSerializer',
  'data',
  'timeout',
  'withCredentials',
  'adapter',
  'auth',
  'responseType',
  'responseEncoding',
  'xsrfCookieName',
  'xsrfHeaderName',
  'onUploadProgress',
  'onDownloadProgress',
  'maxContentLength',
  'maxBodyLength',
  'validateStatus',
  'maxRedirects',
  'socketPath',
  'httpAgent',
  'httpsAgent',
  'proxy',
  'cancelToken',
  'decompress',
];

class Request {
  constructor(options: InitRequestParams) {
    const [picked, unpicked] = pick(options, axiosOpts);
    this.instance = axios.create({
      baseURL: '/',
      timeout: 5000,
      ...picked
    });
    this.sendQueue = [];
    this.beforeSendFn = Promise.resolve;
    this.reqId = 0;
    this.isBeforeSendLoading = false;
    this.beforeSendPendings = [];
    this.retryCount = {};
    this.retry = unpicked.retry ?? true;
    this.validateResponseFn = () => true;
    this.maxRetry = unpicked.maxRetry ?? 1;
  }

  protected instance;
  protected sendQueue: Array<any>;
  protected beforeSendFn: Function;
  protected reqId: number;
  protected isBeforeSendLoading: boolean;
  protected beforeSendPendings: Array<any>;
  protected retryCount: ObjectMap;
  protected retry: boolean;
  protected validateResponseFn: Function;
  protected maxRetry: number;

  /// 发请求前的操作
  /// 如：先完成登录，才能调接口
  /// 如：获取数据加密的公钥
  beforeSend(fn: Function) {
    this.beforeSendFn = fn;
  }

  send(params: SendRequestParams) {
    const task = this.createTask({
      ...params,
      __requestID: ++this.reqId,
    });
    this.sendQueue.push(task);
    this._send();
  }

  /// 判断响应数据是否成功
  validateResponse(fn: Function) {
    this.validateResponseFn = fn;
  }

  protected _validateResponse(data: AxiosResponse) {
    return this.validateResponseFn?.(data);
  }

  protected createTask(opts: ObjectMap) {
    const task = () => {
      const [reqOpts, extraOpts] = pick(opts, axiosOpts);
      this.instance.request(reqOpts).then(res => {
        if (!this._validateResponse(res)) {
          throw res;
        } else {
          //todo: add default success handle
          if (typeof extraOpts.onSuccess === 'function') {
            extraOpts.onSuccess(res);
          }
        }
      }).catch(error => {
        const retryCount = this.retryCount[extraOpts.__requestID] ?? 0;
        if (this.retry && retryCount < this.maxRetry) {
          this.sendQueue.push(task);
          this.retryCount[extraOpts.__requestID] = retryCount + 1;
          this._send();
        } else {
          if (typeof extraOpts.onError === 'function') {
            extraOpts.onError(error);
          }
        }
      });
    };
    return task;
  }

  protected async _send() {
    if (this.sendQueue.length < 1) return;
    await this.callBeforeSend();
    const task = this.sendQueue.shift();
    if (typeof task === 'function') {
      task();
    }
    this._send();
  }

  protected callBeforeSend() {
    return new Promise((resolve, reject) => {
      if (this.isBeforeSendLoading) {
        this.beforeSendPendings.push([resolve, reject]);
      } else {
        this.isBeforeSendLoading = true;
        const req = this.beforeSendFn();
        if (typeof req.then === 'function') {
          req.then(() => {
            this.resolveBeforePending();
          }).catch(() => {
            this.rejectBeforePending();
          }).finally(() => {
            this.isBeforeSendLoading = false;
          });
        } else {
          this.resolveBeforePending();
          this.isBeforeSendLoading = false;
        }
      }
    });
  }

  protected resolveBeforePending() {
    this.beforeSendPendings.forEach(d => {
      d[0]?.();
    });
  }

  protected rejectBeforePending() {
    this.beforeSendPendings.forEach(d => {
      d[1]?.();
    });
  }
}

export { Request };