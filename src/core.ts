export function isStringOrNumber(v: any) {
  const vType = typeof v;
  return vType === 'string' || vType === 'number';
}