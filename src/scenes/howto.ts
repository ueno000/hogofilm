import { h } from '../dom';
import { STAGES } from '../stages';
import type { Scene } from './scene';

export const howToScene: Scene = (root, nav) => {
  root.append(
    h('main', { class: 'screen screen--howto' },
      h('h2', {}, '遊び方'),
      h('p', {}, '90秒以内に5つの工程を終わらせて、きれいに保護フィルムを貼ろう。'),
      h('ol', { class: 'howto-list' },
        ...STAGES.map((s) => h('li', {}, h('strong', {}, s.name), h('span', {}, s.hint))),
      ),
      h('p', { class: 'note' }, '仮固定で大きく失敗すると、フィルムを床に落としてゲーム終了！'),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--primary', onclick: () => nav.toPlay() }, 'スタート'),
        h('button', { class: 'btn', onclick: () => nav.toTitle() }, 'もどる'),
      ),
    ),
  );
};
