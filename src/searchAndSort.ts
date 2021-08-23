import { objectMap } from './types';
import { isStringOrNumber } from './core';

/**
 * array里可以是纯字符串，也可以是对象
 * 如果是对象，keys参数可以传入要搜索的key
 * keys越靠前的字段，优先级越高
 * 匹配的优先级按：
 * keys的优先级 + 匹配到的位置 + 匹配到的字符串占总字符串百分比
 * 计算得出
 * @export
 * @param {array} [array=[]]
 * @param {array} [keys=[]]
 * @param {string} [keywords='']
 * @return {array}
 */
export function searchAndSort(array: Array<string | objectMap> = [], keywords: string = '', keys: Array<string> = []) {
  if (!keywords) return array;
  keywords = keywords.toUpperCase();
  const results = [];
  function calcScore(v: string, keyIndex: number = -1) {
    let score = 0;
    let index = v.indexOf(keywords);
    if (index > -1) {
      let matchPercent = Math.round((keywords.length / v.length) * 9);
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
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    let currentWeight = 0;
    if (!item) continue;
    if (isStringOrNumber(item)) {
      currentWeight = calcScore(`${item}`.toUpperCase());
    } else {
      for (let j = 0; j < keys.length; j++) {
        let v = (item as objectMap)[keys[j]] ?? '';
        if (!v || !isStringOrNumber(v)) continue;
        v = `${v}`.toUpperCase();
        currentWeight += calcScore(v, j);
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
