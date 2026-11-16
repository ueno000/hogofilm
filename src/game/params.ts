/**
 * 調整値（企画管理シートの「パラメータCSV」タブから出力した src/params.csv）を読み込む。
 * ビルド時に CSV を取り込み、開発中は CSV を書き換えると自動で読み直される。
 */
import csvText from '../params.csv?raw';

/** コードが使う調整値の名前。CSV にすべてそろっていないと起動しない */
export const PARAM_NAMES = [
  'TIME_LIMIT_MS',
  'TIME_WARN_RATIO',
  'TIME_DANGER_MS',
  'TIME_NOTICE_MS',
  'DROP_AUTO_STAGE_MS',
  'WIPE_COLS',
  'WIPE_ROWS',
  'WIPE_RADIUS',
  'WIPE_DONE',
  'WIPE_MAX_DIRT',
  'WIPE_SCRATCH_RUBS',
  'WIPE_DAMAGE_PENALTY',
  'WIPE_EXPOSE_LIMIT',
  'WIPE_SHEET_DRY_MS',
  'DUST_COUNT',
  'DUST_HIT_MARGIN',
  'DUST_SPAWN_START',
  'DUST_SPAWN_MIN',
  'DUST_SPAWN_RAMP_MS',
  'DUST_PENALTY',
  'ALIGN_TAP_STEP',
  'ALIGN_HOLD_DELAY_MS',
  'ALIGN_HOLD_SPEED_START',
  'ALIGN_HOLD_SPEED_MAX',
  'ALIGN_HOLD_ACCEL_MS',
  'ALIGN_START_MAX',
  'ALIGN_LIMIT',
  'ALIGN_TOLERANCE',
  'ALIGN_SHAKE_VISUAL',
  'RING_START',
  'RING_DURATION',
  'RING_TARGET',
  'JUDGE_PERFECT',
  'JUDGE_GOOD',
  'JUDGE_BAD',
  'MAX_MISSES',
  'TAP_RANGE',
  'FIRST_DELAY',
  'BETWEEN_DELAY',
  'BUBBLE_COUNT',
  'FINGER_RADIUS',
  'BUBBLE_SPLIT_SPEED',
  'BUBBLE_SPLIT_MIN_R',
  'BUBBLE_RETURN_DIST',
  'BUBBLE_RETURN_MS',
  'SPEED_FULL_REMAIN_MS',
  'RANK_HIGH_MIN',
  'RANK_MID_MIN',
  'SHARE_COPIED_MS',
] as const;

export type ParamName = (typeof PARAM_NAMES)[number];

/**
 * CSV を行と列に分ける。引用符で囲んだ値（中のカンマ・改行・"" を含む）と、
 * CRLF・LF どちらの改行にも対応する。
 */
export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export interface ParsedParams {
  values: Map<string, number>;
  /** 値が数値でなかった名前 */
  invalid: Set<string>;
  /** 数値でない値・ヘッダーの不足など */
  errors: string[];
}

/** 調整値の CSV を読む。ヘッダー名で `name` と `value` の列を探し、ほかの列と空行は無視する。 */
export function parseParamsCsv(text: string): ParsedParams {
  const values = new Map<string, number>();
  const invalid = new Set<string>();
  const errors: string[] = [];
  const [header, ...rows] = parseCsvRows(text);
  const cols = (header ?? []).map((h) => h.trim().toLowerCase());
  const nameCol = cols.indexOf('name');
  const valueCol = cols.indexOf('value');
  if (nameCol < 0 || valueCol < 0) {
    errors.push('CSV の1行目に name と value の列がありません');
    return { values, invalid, errors };
  }
  for (const row of rows) {
    const name = (row[nameCol] ?? '').trim();
    if (!name) continue;
    const raw = (row[valueCol] ?? '').trim();
    const num = Number(raw);
    if (raw === '' || !Number.isFinite(num)) {
      invalid.add(name);
      errors.push(`${name} の値「${raw}」が数値ではありません`);
      continue;
    }
    values.set(name, num);
  }
  return { values, invalid, errors };
}

/** コードが使う名前と照らし合わせる。足りない名前はエラー、使わない名前は警告にする */
export function checkParams(parsed: ParsedParams, names: readonly string[]): { errors: string[]; unused: string[] } {
  const known = new Set(names);
  const missing = names.filter((n) => !parsed.values.has(n) && !parsed.invalid.has(n));
  return {
    errors: [...parsed.errors, ...missing.map((n) => `${n} が CSV にありません`)],
    unused: [...parsed.values.keys()].filter((n) => !known.has(n)),
  };
}

const parsed = parseParamsCsv(csvText);
const checked = checkParams(parsed, PARAM_NAMES);

/** 起動時に見つかった CSV の問題。空でなければゲームを始めず、画面に出す */
export const PARAM_ERRORS: readonly string[] = checked.errors;

if (checked.unused.length > 0) {
  console.warn(`src/params.csv の次の名前はコードで使っていません: ${checked.unused.join(', ')}`);
}

/** 調整値を引く。CSV に問題があるときは NaN（起動時に PARAM_ERRORS で止める） */
export function param(name: ParamName): number {
  return parsed.values.get(name) ?? Number.NaN;
}
