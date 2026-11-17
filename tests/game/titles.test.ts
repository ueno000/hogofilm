import { describe, expect, it } from 'vitest';
import { checkTitles, COMMENT_KEYS, parseTitlesCsv, TITLE_ERRORS, WORD_KEYS } from '../../src/game/titles';

describe('称号の CSV（R-9）', () => {
  it('src/titles.csv は必要な単語20・ひとこと39（単独の称号 R-13 を含む）がそろっていて、エラーがない', () => {
    expect(WORD_KEYS).toHaveLength(20);
    expect(COMMENT_KEYS).toHaveLength(39);
    expect(TITLE_ERRORS).toEqual([]);
  });

  it('「称号CSV」タブから出力した形（type,key,text,image）を読める。空欄の単語は空文字', () => {
    const p = parseTitlesCsv(
      'type,key,text,image\r\n' +
        'word,speed.high,早業！,\r\n' +
        'word,speed.mid,,\r\n' +
        'comment,高高高,"埃もズレも気泡も、悟りの彼方へ。",後光が差す完璧なスマホ\r\n',
    );
    expect(p.errors).toEqual([]);
    expect(p.words.get('speed.high')).toBe('早業！');
    expect(p.words.get('speed.mid')).toBe('');
    expect(p.comments.get('高高高')).toEqual({ text: '埃もズレも気泡も、悟りの彼方へ。', image: '後光が差す完璧なスマホ' });
  });

  it('必要な key が欠けていたらエラーにする（単語・ひとこと）', () => {
    const p = parseTitlesCsv('type,key,text,image\nword,speed.high,早業！,\ncomment,高高高,ひとこと,\n');
    const errors = checkTitles(p, ['speed.high', 'speed.low'], ['高高高', '低低低']);
    expect(errors).toEqual(['単語 speed.low が CSV にありません', 'ひとこと 低低低 が CSV にありません']);
  });

  it('ひとことの text が空ならエラー。単語の text は空でもよい', () => {
    const p = parseTitlesCsv('type,key,text,image\nword,speed.mid,,\ncomment,高高高,,\n');
    expect(checkTitles(p, ['speed.mid'], ['高高高'])).toEqual(['ひとこと 高高高 の text が空です']);
  });

  it('列が足りない・type がおかしいときはエラー', () => {
    expect(parseTitlesCsv('name,value\nx,1\n').errors).toEqual(['CSV の1行目に type・key・text の列がありません']);
    expect(parseTitlesCsv('type,key,text\nfoo,speed.high,早業！\n').errors).toEqual([
      'speed.high の type「foo」が word でも comment でもありません',
    ]);
  });
});
