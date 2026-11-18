import { h } from '../dom';
import type { Scene } from './scene';
import { phoneSvg } from '../stages/phone';
import { speakerButton } from '../audio/buttons';

export const titleScene: Scene = (root, nav) => {
  const speaker = speakerButton('speaker--corner');
  root.append(
    h('main', { class: 'screen screen--title' },
      speaker.el,
      h('p', { class: 'eyebrow' }, '90秒チャレンジ'),
      h('h1', { class: 'logo' }, 'フィルム', h('br'), '貼り職人'),
      h('div', { class: 'title-phone' }, phoneSvg()),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--primary', onclick: () => nav.toPlay() }, 'スタート'),
        h('button', { class: 'btn', onclick: () => nav.toHowTo() }, '遊び方'),
      ),
    ),
  );
  return speaker.destroy;
};
