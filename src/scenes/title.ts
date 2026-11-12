import { h } from '../dom';
import type { Scene } from './scene';
import { phoneSvg } from '../stages/phone';

export const titleScene: Scene = (root, nav) => {
  root.append(
    h('main', { class: 'screen screen--title' },
      h('p', { class: 'eyebrow' }, '90秒チャレンジ'),
      h('h1', { class: 'logo' }, 'フィルム', h('br'), '貼り職人'),
      h('div', { class: 'title-phone' }, phoneSvg()),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--primary', onclick: () => nav.toPlay() }, 'スタート'),
        h('button', { class: 'btn', onclick: () => nav.toHowTo() }, '遊び方'),
      ),
    ),
  );
};
