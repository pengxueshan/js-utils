import { objectMap, searchAndSortParams } from './types';
import { isStringOrNumber } from './core';

/**
 * array里可以是纯字符串，也可以是对象
 * 如果是对象，keys参数可以传入要搜索的key
 * keys越靠前的字段，优先级越高
 * 匹配的优先级按：
 * keys的优先级 + 匹配到的位置 + 匹配到的字符串占总字符串百分比
 * 计算得出
 * @export
 * @param {array} [data=[]]
 * @param {string} [keywords='']
 * @param {array} [keys=[]]
 * @return {array}
 */
export function searchAndSort({ data, keywords, keys = [], ignoreCase = true }: searchAndSortParams) {
  if (!keywords) return data;
  const results = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let currentWeight = 0;
    if (!item) continue;
    if (isStringOrNumber(item)) {
      currentWeight = calcScore({ value: item, keywords, ignoreCase });
    } else {
      for (let j = 0; j < keys.length; j++) {
        let v = (item as objectMap)[keys[j]] ?? '';
        if (!v || !isStringOrNumber(v)) continue;
        currentWeight += calcScore({ value: v, keywords, keyIndex: j, keys, ignoreCase });
      }
    }
    if (currentWeight > 0) {
      results.push({
        data: item,
        weight: currentWeight,
      });
    }
  }
  results.sort((a, b) => {
    return b.weight - a.weight;
  });
  return results.map((d) => d.data);
}

interface calcScoreParams {
  value: any;
  keywords: string;
  keyIndex?: number;
  keys?: Array<string>;
  ignoreCase?: boolean;
}
function calcScore({ value, keyIndex = -1, keywords, keys = [], ignoreCase }: calcScoreParams) {
  value = `${value}`;
  if (ignoreCase) {
    value = value.toUpperCase();
    keywords = keywords.toUpperCase();
  }
  let score = 0;
  let index = value.indexOf(keywords);
  if (index > -1) {
    let matchPercent = Math.round((keywords.length / value.length) * 9);
    if (keyIndex > -1) {
      let keyWeightArr = new Array(keys.length).fill('000');
      keyWeightArr[keyIndex] = 100;
      keyWeightArr[keyIndex] += (9 - index) * 10;
      keyWeightArr[keyIndex] += matchPercent;
      score = +keyWeightArr.join('');
    } else {
      score += (9 - index) * 10;
      score += matchPercent;
    }
  }
  return score;
}
