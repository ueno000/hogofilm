import './style.css';
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

nav.toTitle();
