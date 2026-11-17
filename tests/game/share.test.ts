import { describe, expect, it } from 'vitest';
import { buildCopyText, buildShareText, gameUrl } from '../../src/game/share';
import type { GameOutcome } from '../../src/game/types';

const outcome: GameOutcome = {
  reason: 'completed',
  results: [],
  remainingMs: 20_000,
  picture: {},
  scores: { speed: 67, screen: 90, film: 85 },
  tiers: { speed: 'mid', screen: 'high', film: 'high' },
  bubbleTier: 'mid',
  incidents: { dropped: true, overPolished: false, tilted: false },
};

describe('ゲームのURL', () => {
  it('http(s) で開いているときは、# より前のページの URL を返す', () => {
    expect(gameUrl('https://example.com/game/#result', 'https:')).toBe('https://example.com/game/');
    expect(gameUrl('http://localhost:5173/', 'http:')).toBe('http://localhost:5173/');
  });

  it('ローカルのファイルなど、他の人が開けない URL は付けない', () => {
    expect(gameUrl('file:///C:/game/index.html', 'file:')).toBeUndefined();
  });
});

describe('コピーする文（R-7）', () => {
  it('X に投稿する文と同じシェア文に、ゲームのURLを付ける', () => {
    const url = 'https://example.com/game/';
    const text = buildCopyText(outcome, url);
    expect(text).toBe(buildShareText(outcome, url));
    expect(text).toContain('手早さ 67点');
    expect(text).toContain('やらかし：落下');
    expect(text.split('\n').at(-1)).toBe(url);
  });

  it('URL がないときは、シェア文だけ', () => {
    const text = buildCopyText(outcome);
    expect(text).toBe(buildShareText(outcome));
    expect(text).not.toContain('http');
  });
});
