import axios, { AxiosRequestConfig } from 'axios';
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

/// 基于axios实现的request封装
/// 支持请求前拦截、失败重试
/// 或者直接调用axios发送请求: requestAxios
/// 获取当前axios实例: getInstance
class Request {
  constructor(options: InitRequestParams) {
    const [picked, unpicked] = pick(options, axiosOpts);
    this.instance = axios.create({
      baseURL: '/',
      timeout: 5000,
      ...picked
    });
    this.retry = unpicked.retry ?? false;
    this.maxRetry = unpicked.maxRetry ?? 1;
  }

  protected instance;
  protected sendQueue: Array<any> = [];
  protected reqId: number = 0;
  protected isBeforeSendLoading: boolean = false;
  protected beforeSendPendings: Array<any> = [];
  protected requestInfo: ObjectMap = {};

  retry: boolean;
  maxRetry: number;

  /// 发请求前的操作
  /// 如：先完成登录，才能调接口
  /// 如：获取数据加密的公钥
  /// 如果此方法传入的函数是异步的，且以来本实例发送请求
  /// 则需要传入参数ignoreBefore: true
  beforeSend: Function | undefined;

  onSuccess: Function | undefined;
  onError: Function | undefined;

  /// 判断响应数据是否成功
  validateResponse: Function | undefined;

  async send(params: SendRequestParams) {
    let id;
    /// 如果参数有__id参数
    /// 表示是重试的请求
    if (!params.__id) {
      id = ++this.reqId;
      this.requestInfo[id] = {
        retryCount: 0,
        params,
      };
    } else {
      id = params.__id;
    }
    if (!params.ignoreBefore) {
      await this.callBeforeSend();
    }
    let res;
    try {
      const [requestParams] = pick(params, axiosOpts);
      res = await this.instance.request(requestParams);
      if (!this.validateResponse?.(res)) {
        throw res;
      } else {
        this.onSuccess?.(res, params);
        delete this.requestInfo[id];
        return res;
      }
    } catch (error) {
      if (this.retry && this.requestInfo[id]?.retryCount < this.maxRetry) {
        return await this.retryRequest(id);
      } else {
        this.onError?.(error, params);
      }
    }
  }

  protected async retryRequest(id: number): Promise<any> {
    if (!this.requestInfo[id]) {
      throw 'request id can not be found';
    }
    const count = this.requestInfo[id].retryCount ?? 0;
    this.requestInfo[id].retryCount = count + 1;
    return await this.send({
      ...this.requestInfo[id].params,
      __id: id,
    });
  }

  protected callBeforeSend() {
    return new Promise((resolve, reject) => {
      if (this.isBeforeSendLoading) {
        this.beforeSendPendings.push([resolve, reject]);
      } else {
        this.isBeforeSendLoading = true;
        const req = this.beforeSend?.();
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

  requestAxios(opts: AxiosRequestConfig) {
    return axios.request(opts);
  }

  getInstance() {
    return this.instance;
  }
}

export default Request;
