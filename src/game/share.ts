import { getRank } from './ranks';
import type { GameOutcome } from './types';

export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1);
}

export function buildShareText(outcome: GameOutcome, url?: string): string {
  const rank = getRank(outcome.score);
  const lines = [
    `保護フィルム貼りで品質${outcome.score}点！`,
    `称号「${rank.title}」`,
    outcome.reason === 'dropped'
      ? 'フィルムを床に落としました…'
      : `残り時間 ${formatSeconds(outcome.remainingMs)}秒`,
    '#フィルム貼り職人',
  ];
  if (url) lines.push(url);
  return lines.join('\n');
}

export function buildXIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}
