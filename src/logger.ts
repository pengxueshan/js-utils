import { isBrowser } from './core';

enum LogLevel {
  error,
  warning,
  info,
  debug,
}

class Logger {
  constructor() {
    if (isBrowser()) {
      window.addEventListener('error', this.handleSystemError);
    }
  }

  theme = {
    success: '#72c140',
    fail: '#ed5b56',
    warning: '#f0af41',
    info: '#408ff7'
  };
  disabled = false;
  level = LogLevel.info;
  cacheSize = 1000;
  protected cache: Array<any> = [];

  protected handleSystemError(error: ErrorEvent) {
    this.pushLog(JSON.stringify(error), this.theme.fail, true);
  }

  protected log(data: string, color: string) {
    this.pushLog(data, color);
    if (this.disabled) return;
    console.log(`%c ${data}`, `color:${color};`);
  }

  protected pushLog(data: string, color: string, isSystem: boolean = false) {
    this.cache.push({
      timestamp: Date.now(),
      data,
      color,
    });
    if (this.cache.length > this.cacheSize) {
      this.cache.shift();
    }
  }

  success(data: any) {
    if (this.level < LogLevel.debug) return;
    this.log(JSON.stringify(data), this.theme.success);
  }

  warning(data: any) {
    if (this.level < LogLevel.warning) return;
    this.log(JSON.stringify(data), this.theme.warning);
  }

  error(data: any) {
    this.log(JSON.stringify(data), this.theme.fail);
  }

  info(data: any, color: string = this.theme.info) {
    if (this.level < LogLevel.info) return;
    this.log(JSON.stringify(data), color);
  }

  dispose() {
    this.cache = [];
    if (isBrowser()) {
      window.removeEventListener('error', this.handleSystemError);
    }
  }
}

export default Logger;
