import { h } from '../dom';
import { filmGroup } from './film';
import { handsGroup } from './hands';
import { createStageView } from './shell';
import type { Stage } from './stage';
import { alignQuality, createAlign, holdDistance, moveFilm, shakeOffset, type AlignState, type Direction } from './logic/align';

const KEY_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** 押している最中の方向ボタン（または矢印キー） */
interface Hold {
  dir: Direction;
  origin: AlignState;
  startedAt: number;
  /** 押し始めたもの（キー名かポインター ID）。離したときに照合する */
  source: string;
}

export const alignStage: Stage = {
  id: 'align',
  name: '位置を合わせる',
  hint: '方向ボタンで、フィルムの端とカメラ穴を合わせよう。長押しで速く動く。',
  mount(container, ctx) {
    const view = createStageView(container, 'align', this.hint);
    let state = createAlign(Math.random);
    let hold: Hold | undefined;
    let raf = 0;
    let done = false;

    const film = filmGroup();
    // 手でつまんで持っている絵。フィルムの中に入れて、一緒に動かし一緒に揺らす（A-3）
    film.append(handsGroup());
    view.layer.append(film);

    // ずれの表示や「ぴったり」の演出は出さない。合っているかは結果画面で分かる（A-4）
    // 描く位置にだけ手ブレを足す。state（本当の位置）は揺らさない（A-3）
    const render = () => {
      const shake = shakeOffset(performance.now());
      film.setAttribute('transform', `translate(${state.x + shake.x} ${state.y + shake.y})`);
    };

    const step = () => {
      if (!hold) return;
      state = moveFilm(hold.origin, hold.dir, holdDistance(performance.now() - hold.startedAt));
    };
    // 手ブレのため、工程中はずっと毎フレーム描き直す
    const loop = () => {
      step();
      render();
      raf = done ? 0 : requestAnimationFrame(loop);
    };

    // 短く押すとタップ1回分、長押しすると待ってから動き出して加速する（A-1）
    const press = (dir: Direction, source: string) => {
      if (done) return;
      release();
      hold = { dir, origin: state, startedAt: performance.now(), source };
      step();
      render();
    };
    const release = (source?: string) => {
      if (!hold || (source !== undefined && hold.source !== source)) return;
      step();
      hold = undefined;
      render();
    };

    const confirm = () => {
      if (done) return;
      release();
      done = true;
      // 品質は決定を押したときの本当の位置で決める（A-5）
      ctx.complete(alignQuality(state));
    };

    const dirBtn = (dir: Direction, label: string, aria: string) => {
      const src = (e: PointerEvent) => `pointer:${e.pointerId}`;
      const btn = h('button', { class: `btn btn--pad pad-${dir}`, 'aria-label': aria }, label);
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        press(dir, src(e));
        // 指がボタンの外へずれても、離すまで押している扱いにする
        try {
          btn.setPointerCapture(e.pointerId);
        } catch {
          // 取れないときは pointerup だけで判定する
        }
      });
      btn.addEventListener('pointerup', (e) => release(src(e)));
      btn.addEventListener('pointercancel', (e) => release(src(e)));
      btn.addEventListener('lostpointercapture', (e) => release(src(e)));
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
      return btn;
    };

    view.controls.append(
      h('div', { class: 'align-controls' },
        h('div', { class: 'dpad' },
          dirBtn('up', '▲', '上へ'),
          dirBtn('left', '◀', '左へ'),
          dirBtn('right', '▶', '右へ'),
          dirBtn('down', '▼', '下へ'),
        ),
        h('button', { class: 'btn btn--primary', onclick: confirm }, '決定'),
      ),
    );

    const onKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key];
      if (dir) {
        e.preventDefault();
        if (!e.repeat) press(dir, `key:${e.key}`);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (KEY_DIR[e.key]) release(`key:${e.key}`);
    };
    const onBlur = () => release();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    render();
    raf = requestAnimationFrame(loop);

    return () => {
      done = true;
      hold = undefined;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  },
};
