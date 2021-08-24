import { ObjectMap } from './types';

export function isStringOrNumber(v: any) {
  const vType = typeof v;
  return vType === 'string' || vType === 'number';
}

export function pick(source: ObjectMap = {}, keys: Array<string> = []) {
  const picked: ObjectMap = {};
  const unpicked: ObjectMap = {};
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const e = source[key];
      if (keys.includes(key)) {
        picked[key] = e;
      } else {
        unpicked[key] = e;
      }
    }
  }
  return [picked, unpicked];
}