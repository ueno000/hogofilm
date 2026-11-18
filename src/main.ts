import './style.css';
import { h } from './dom';
import { PARAM_ERRORS } from './game/params';
import { TITLE_ERRORS } from './game/titles';
import type { Scene, SceneNav } from './scenes/scene';
import { titleScene } from './scenes/title';
import { howToScene } from './scenes/howto';
import { playScene } from './scenes/play';
import { resultScene } from './scenes/result';
import { installButtonSound } from './audio/buttons';

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

/** 調整値・称号の CSV に問題があるときは、ゲームを始めずに内容を表示する */
function showCsvErrors(file: string, label: string, errors: readonly string[]): void {
  console.error(`${file} に問題があります:\n${errors.join('\n')}`);
  root.append(
    h('main', { class: 'screen screen--error' },
      h('h2', {}, `${label}（${file}）に問題があります`),
      h('ul', { class: 'param-errors' }, ...errors.map((e) => h('li', {}, e))),
      h('p', { class: 'note' }, 'CSV を直して保存すると、自動で読み直します。'),
    ),
  );
}

if (PARAM_ERRORS.length > 0) {
  showCsvErrors('src/params.csv', '調整値', PARAM_ERRORS);
} else if (TITLE_ERRORS.length > 0) {
  showCsvErrors('src/titles.csv', '称号', TITLE_ERRORS);
} else {
  // どの画面のボタンでも「ポッ」を鳴らし、最初の操作で音の準備をする（S-1, S-3）
  installButtonSound(root);
  nav.toTitle();
}
