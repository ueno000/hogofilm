import './style.css';
import { h } from './dom';
import { PARAM_ERRORS } from './game/params';
import type { Scene, SceneNav } from './scenes/scene';
import { titleScene } from './scenes/title';
import { howToScene } from './scenes/howto';
import { playScene } from './scenes/play';
import { resultScene } from './scenes/result';

const root = document.querySelector<HTMLElement>('#app')!;
let cleanup: (() => void) | void;

function show(scene: Scene): void {
  cleanup?.();
  root.replaceChildren();
  cleanup = scene(root, nav);
}

const nav: SceneNav = {
  toTitle: () => show(titleScene),
  toHowTo: () => show(howToScene),
  toPlay: () => show(playScene),
  toResult: (outcome) => show(resultScene(outcome)),
};

/** 調整値の CSV に問題があるときは、ゲームを始めずに内容を表示する */
function showParamErrors(errors: readonly string[]): void {
  console.error(`src/params.csv に問題があります:\n${errors.join('\n')}`);
  root.append(
    h('main', { class: 'screen screen--error' },
      h('h2', {}, '調整値（src/params.csv）に問題があります'),
      h('ul', { class: 'param-errors' }, ...errors.map((e) => h('li', {}, e))),
      h('p', { class: 'note' }, 'CSV を直して保存すると、自動で読み直します。'),
    ),
  );
}

if (PARAM_ERRORS.length > 0) {
  showParamErrors(PARAM_ERRORS);
} else {
  nav.toTitle();
}
