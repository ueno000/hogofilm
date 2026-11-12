import { h } from '../dom';
import { GameState, TIME_LIMIT_MS } from '../game/state';
import { CountdownTimer } from '../game/timer';
import { formatSeconds } from '../game/share';
import { STAGE_ORDER, type EndReason } from '../game/types';
import { getStage } from '../stages';
import type { Scene } from './scene';

export const playScene: Scene = (root, nav) => {
  const state = new GameState();
  const stepLabel = h('span', { class: 'hud__step' });
  const stageName = h('span', { class: 'hud__name' });
  const timeLabel = h('span', { class: 'hud__time' });
  const timeBar = h('div', { class: 'hud__bar-fill' });
  const stageArea = h('section', { class: 'stage-area' });

  root.append(
    h('main', { class: 'screen screen--play' },
      h('header', { class: 'hud' },
        h('div', { class: 'hud__row' }, stepLabel, stageName, timeLabel),
        h('div', { class: 'hud__bar' }, timeBar),
      ),
      stageArea,
    ),
  );

  let unmountStage: (() => void) | void;
  let ended = false;

  const timer = new CountdownTimer(
    TIME_LIMIT_MS,
    (left) => {
      timeLabel.textContent = `${formatSeconds(left)}秒`;
      timeBar.style.transform = `scaleX(${left / TIME_LIMIT_MS})`;
      timeLabel.classList.toggle('is-danger', left < 15_000);
    },
    () => end('timeout'),
  );

  function end(reason: EndReason): void {
    if (ended) return;
    ended = true;
    const remaining = timer.stop();
    unmountStage?.();
    nav.toResult(state.finish(reason, remaining));
  }

  function mountCurrent(): void {
    unmountStage?.();
    stageArea.replaceChildren();
    const id = state.currentStage;
    if (!id) return end('completed');
    const stage = getStage(id);
    stepLabel.textContent = `${state.stageNumber}/${STAGE_ORDER.length}`;
    stageName.textContent = stage.name;
    unmountStage = stage.mount(stageArea, {
      complete: (quality) => {
        if (ended) return;
        state.completeStage(quality);
        mountCurrent();
      },
      drop: () => end('dropped'),
    });
  }

  mountCurrent();
  timer.start();

  return () => {
    ended = true;
    timer.stop();
    unmountStage?.();
  };
};
