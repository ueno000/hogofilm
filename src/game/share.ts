import { getTitle } from './ranks';
import type { GameOutcome, Incidents, ScoreAxis, Tier } from './types';

export const AXIS_ORDER: readonly ScoreAxis[] = ['speed', 'screen', 'film'];

export const AXIS_LABEL: Record<ScoreAxis, string> = {
  speed: '手早さ',
  screen: '画面の綺麗さ',
  film: 'フィルムの貼り方',
};

export const TIER_LABEL: Record<Tier, string> = { high: '高', mid: '中', low: '低' };

export const INCIDENT_LABEL: Record<keyof Incidents, string> = {
  dropped: '落下',
  overPolished: '研磨しすぎ',
};

/** ついたやらかしの名前（なければ空） */
export function incidentNames(incidents: Incidents): string[] {
  return (Object.keys(INCIDENT_LABEL) as (keyof Incidents)[])
    .filter((k) => incidents[k])
    .map((k) => INCIDENT_LABEL[k]);
}

export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1);
}

/**
 * 結果画面の見出し。時間切れを優先し、次にフィルムを落としたまま最後まで進んだ場合。
 * 落下はやらかしの行でも別に伝える。
 */
export function resultHeading(outcome: Pick<GameOutcome, 'reason' | 'incidents'>): string {
  if (outcome.reason === 'timeout') return '時間切れ！';
  if (outcome.incidents.dropped) return 'フィルムなしで完走…';
  return '貼り付け完了！';
}

export function buildShareText(outcome: GameOutcome, url?: string): string {
  const rank = getTitle(outcome.tiers, outcome.incidents);
  const incidents = incidentNames(outcome.incidents);
  const lines = [
    '保護フィルム貼りの結果！',
    AXIS_ORDER.map((a) => `${AXIS_LABEL[a]} ${outcome.scores[a]}点`).join('／'),
    incidents.length ? `やらかし：${incidents.join('・')}` : null,
    `称号「${rank.title}」`,
    '#フィルム貼り職人',
  ].filter((l): l is string => l !== null);
  if (url) lines.push(url);
  return lines.join('\n');
}

export function buildXIntentUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}
