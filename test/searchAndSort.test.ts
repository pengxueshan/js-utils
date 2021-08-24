import { searchAndSort } from '../src/searchAndSort';

const stringArr = ['vnabc', 'vabc', 'bcabd', 'bcab'];
test(`search and sort ${stringArr}`, () => {
  expect(searchAndSort({ data: stringArr, keywords: 'ab' })).toStrictEqual(['vabc', 'bcab', 'vnabc', 'bcabd']);
});

const objArr = [{ name: 'vnabc' }, { name: 'vabc' }, { name: 'bcabd' }, { name: 'bcab' }];
test(`search and sort ${objArr}`, () => {
  expect(searchAndSort({ data: objArr, keywords: 'ab', keys: ['name'] })).toStrictEqual([{ name: 'vabc' }, { name: 'bcab' }, { name: 'vnabc' }, { name: 'bcabd' }]);
});
