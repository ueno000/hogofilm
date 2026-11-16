import { h } from '../dom';
import { GameState, TIME_LIMIT_MS } from '../game/state';
import { CountdownTimer } from '../game/timer';
import { formatSeconds } from '../game/share';
import { phaseNotice, secondMark, timePhase, TIME_NOTICE_MS, type TimePhase } from '../game/timePhase';
import { STAGE_ORDER, type EndReason, type FinishPicture } from '../game/types';
import { getStage } from '../stages';
import { mountSkippedStage } from '../stages/skipped';
import type { Scene } from './scene';

export const playScene: Scene = (root, nav) => {
  const state = new GameState();
  const stepLabel = h('span', { class: 'hud__step' });
  const stageName = h('span', { class: 'hud__name' });
  const timeLabel = h('span', { class: 'hud__time' });
  const timeBar = h('div', { class: 'hud__bar-fill' });
  const bar = h('div', { class: 'hud__bar' }, timeBar);
  const notice = h('p', { class: 'hud__notice', 'aria-live': 'polite' });
  const hud = h('header', { class: 'hud', 'data-phase': 'normal' },
    h('div', { class: 'hud__row' }, stepLabel, stageName, timeLabel),
    bar,
    notice,
  );
  const stageArea = h('section', { class: 'stage-area' });
  const screen = h('main', { class: 'screen screen--play' }, hud, stageArea);
  root.append(screen);

  let unmountStage: (() => void) | void;
  let ended = false;
  /** 今の工程の状態を返す関数（結果画面の絵に使う） */
  let currentPicture: (() => FinishPicture) | undefined;
  /** 今の工程の状態を残す。工程を終えたとき・落としたとき・時間切れの瞬間に呼ぶ（R-5） */
  const savePicture = () => {
    if (currentPicture) state.recordPicture(currentPicture());
    currentPicture = undefined;
  };

  // 時間演出（U-1〜U-4）。段階は残り時間の割合と秒数で決まる
  let phase: TimePhase = 'normal';
  let lastSecond = Infinity;
  let noticeTimer = 0;
  /** CSS アニメーションを最初からかけ直す */
  const replay = (el: Element, cls: string) => {
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
  };
  const showNotice = (text: string) => {
    notice.textContent = text;
    replay(notice, 'is-shown');
    clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => notice.classList.remove('is-shown'), TIME_NOTICE_MS);
  };

  const timer = new CountdownTimer(
    TIME_LIMIT_MS,
    (left) => {
      timeLabel.textContent = `${formatSeconds(left)}秒`;
      timeBar.style.transform = `scaleX(${left / TIME_LIMIT_MS})`;

      const next = timePhase(left, TIME_LIMIT_MS);
      const text = phaseNotice(phase, next);
      if (next !== phase) {
        phase = next;
        hud.dataset.phase = next;
        timeLabel.classList.toggle('is-danger', next === 'danger');
        screen.classList.toggle('is-danger', next === 'danger');
        // 半分を過ぎた瞬間に、ゲージが一度ぴょんと跳ねる
        if (next === 'warn') replay(bar, 'is-hop');
      }
      if (text) showNotice(text);
      // 残りわずかの間は、表示の秒数が変わるたびにゲージと秒数が脈打つ
      const second = secondMark(left);
      if (phase === 'danger' && second !== lastSecond) {
        replay(bar, 'is-pulse');
        replay(timeLabel, 'is-pulse');
      }
      lastSecond = second;
    },
    () => end('timeout'),
  );

  function end(reason: EndReason): void {
    if (ended) return;
    ended = true;
    const remaining = timer.stop();
    clearTimeout(noticeTimer);
    savePicture();
    unmountStage?.();
    nav.toResult(state.finish(reason, remaining));
  }

  function mountCurrent(): void {
    currentPicture = undefined;
    unmountStage?.();
    stageArea.replaceChildren();
    const id = state.currentStage;
    if (!id) return end('completed');
    const stage = getStage(id);
    stepLabel.textContent = `${state.stageNumber}/${STAGE_ORDER.length}`;
    stageName.textContent = stage.name;

    // フィルムを落としたあとの工程は、操作なしで自動で進める
    if (state.dropped) {
      unmountStage = mountSkippedStage(stageArea, id, () => {
        if (ended) return;
        state.completeStage(0);
        mountCurrent();
      });
      return;
    }

    unmountStage = stage.mount(stageArea, {
      picture: (get) => {
        currentPicture = get;
      },
      complete: (quality, detail) => {
        if (ended) return;
        savePicture();
        state.completeStage(quality, detail);
        mountCurrent();
      },
      drop: () => {
        if (ended) return;
        savePicture();
        state.dropFilm();
        mountCurrent();
      },
    });
  }

  mountCurrent();
  timer.start();

  return () => {
    ended = true;
    timer.stop();
    clearTimeout(noticeTimer);
    unmountStage?.();
  };
};
