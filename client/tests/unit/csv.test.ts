import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../../src/utils/csv.ts';

test('FE-CSV-P-01 plain values are joined with commas and CRLF', () => {
  assert.equal(toCsv(['A', 'B'], [[1, 'x'], [2, 'y']]), 'A,B\r\n1,x\r\n2,y');
});

test('FE-CSV-E-01 commas, quotes and newlines are quoted', () => {
  assert.equal(toCsv(['N'], [['Smith, J'], ['say "hi"'], ['two\nlines']]),
    'N\r\n"Smith, J"\r\n"say ""hi"""\r\n"two\nlines"');
});

test('FE-CSV-N-01 spreadsheet formulas are neutralised (CSV injection)', () => {
  const csv = toCsv(['X'], [['=SUM(A1)'], ['+1+1'], ['@cmd'], ['-2+3']]);
  assert.equal(csv, "X\r\n'=SUM(A1)\r\n'+1+1\r\n'@cmd\r\n'-2+3");
});

test('FE-CSV-E-02 negative numbers, null and undefined are kept/blank', () => {
  assert.equal(toCsv(['A', 'B', 'C'], [[-5, null, undefined]]), 'A,B,C\r\n-5,,');
});
