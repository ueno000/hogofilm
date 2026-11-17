import { describe, expect, it } from 'vitest';
import csvText from '../../src/params.csv?raw';
import {
  checkParams,
  param,
  PARAM_ERRORS,
  PARAM_NAMES,
  parseCsvRows,
  parseParamsCsv,
} from '../../src/game/params';

describe('CSV の行と列', () => {
  it('引用符で囲んだ値（カンマ・改行・"" を含む）をそのまま読む', () => {
    expect(parseCsvRows('a,"b,c","d ""e""",\n"x\ny",z\n')).toEqual([
      ['a', 'b,c', 'd "e"', ''],
      ['x\ny', 'z'],
    ]);
  });

  it('CRLF の改行と、先頭の BOM に対応する', () => {
    expect(parseCsvRows('﻿name,value\r\nA,1\r\n')).toEqual([['name', 'value'], ['A', '1']]);
  });

  it('末尾に改行がなくても最後の行を読む', () => {
    expect(parseCsvRows('name,value\nA,1')).toEqual([['name', 'value'], ['A', '1']]);
  });
});

describe('調整値の CSV', () => {
  it('ヘッダー名で name と value の列を探し、ほかの列は無視する', () => {
    const { values, errors } = parseParamsCsv('unit,value,name,memo\nms,90000,TIME_LIMIT_MS,制限時間\n');
    expect(errors).toEqual([]);
    expect(values.get('TIME_LIMIT_MS')).toBe(90000);
  });

  it('Google スプレッドシートの出力のような、引用符付きの値と空行を読める', () => {
    const csv = '"name","value","unit","stage","description"\r\n"WIPE_DONE","0.95","割合","拭く","この割合で完了, とする"\r\n\r\n,,,,\r\n';
    const { values, errors } = parseParamsCsv(csv);
    expect(errors).toEqual([]);
    expect([...values]).toEqual([['WIPE_DONE', 0.95]]);
  });

  it('数値でない値はエラーにする', () => {
    const { values, errors } = parseParamsCsv('name,value\nWIPE_RADIUS,大きめ\nWIPE_DONE,\nWIPE_COLS,10\n');
    expect(values.has('WIPE_RADIUS')).toBe(false);
    expect(errors).toEqual([
      'WIPE_RADIUS の値「大きめ」が数値ではありません',
      'WIPE_DONE の値「」が数値ではありません',
    ]);
  });

  it('name と value の列がなければエラーにする', () => {
    expect(parseParamsCsv('a,b\n1,2\n').errors).toHaveLength(1);
  });

  it('コードが使う名前が足りなければエラー、使わない名前は警告用に返す', () => {
    const parsed = parseParamsCsv('name,value\nA,1\nEXTRA,2\nBAD,x\n');
    const { errors, unused } = checkParams(parsed, ['A', 'B', 'BAD']);
    expect(errors).toEqual(['BAD の値「x」が数値ではありません', 'B が CSV にありません']);
    expect(unused).toEqual(['EXTRA']);
  });
});

describe('src/params.csv', () => {
  it('コードが使う名前がすべてあり、問題がない', () => {
    expect(PARAM_ERRORS).toEqual([]);
    const { values } = parseParamsCsv(csvText);
    for (const name of PARAM_NAMES) expect(values.has(name), name).toBe(true);
  });

  it('param() で値を引ける', () => {
    expect(param('TIME_LIMIT_MS')).toBe(90000);
    // 調整値は企画が変えて試すので、CSV に書いた値と同じかだけを確かめる
    expect(param('WIPE_SCRATCH_RUBS')).toBe(parseParamsCsv(csvText).values.get('WIPE_SCRATCH_RUBS'));
  });
});
