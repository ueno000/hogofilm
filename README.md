# hogofilm — 保護フィルム貼りゲーム

スマートフォンのブラウザで URL を開くだけで遊べる、保護フィルム貼りゲームです。1プレイ約90秒。5つの工程を手早く丁寧にこなして、スマホに保護フィルムをきれいに貼ります。

## 遊び方

| # | 工程 | 操作 |
|---|---|---|
| 1 | ウェットシートで拭く | 画面をドラッグして汚れを拭き取る。しつこい汚れは何度かこする。止めどきは自分で決める |
| 2 | 埃を取る | 残った埃をタップして取り除く |
| 3 | 位置を合わせる | 方向ボタンでフィルムの位置を調整する |
| 4 | 仮固定する | タイミングを見て4隅を順にタップする |
| 5 | 気泡を抜く | フィルム上をドラッグして気泡を端へ押し出す |

仕上がりと残り時間で評価され、結果に応じた称号が出ます。結果は X でシェアできます。

- スマートフォンはタッチ、PC はマウスとキーボードで操作します。
- 評価のしかた（点数の軸と称号）は現在見直し中です。最新の仕様は下の「仕様と工程管理」を参照してください。

## 開発の始め方

Node.js（LTS）が必要です。

```bash
npm install
npm run dev     # 開発サーバー（http://localhost:5173）
npm test        # テスト（Vitest）
npm run build   # 型チェック + 本番ビルド（dist/）
```

スマホ実機で試すときは `npm run dev -- --host` で起動し、同じネットワークから表示された URL を開きます。

## 技術スタック

- Vite + TypeScript（strict）の静的サイト
- 描画は SVG / HTML / CSS、入力は Pointer Events
- React・ゲームエンジン・物理演算・音声ライブラリは使わない

## ディレクトリ構成

```
src/
  main.ts          エントリポイント
  scenes/          タイトル・遊び方・プレイ・結果の各画面
  game/            状態・タイマー・スコア・称号・シェア文（DOM 非依存）
  stages/          各工程の画面（Stage インターフェースを実装）
    logic/         各工程の判定ロジック（DOM 非依存の純粋関数）
tests/             Vitest のテスト（src と対応する配置）
docs/
  game-plan.md     企画・ルール・受け入れ条件
  management.md    工程管理の運用手順
```

## 仕様と工程管理

| 何を | どこで |
|---|---|
| ルール・流れ・文言・受け入れ条件 | [docs/game-plan.md](docs/game-plan.md) |
| 数値（調整パラメータ・配点・称号の判定表） | Google スプレッドシート「保護フィルム貼りゲーム 企画管理シート」 |
| 作業の単位・仕様変更の経緯 | [Issues](https://github.com/ueno000/hogofilm/issues) |
| 進捗（Status / Track） | [Project「development」](https://github.com/users/ueno000/projects/1) |

仕様シートの変更を Issue と Project に反映する手順は [docs/management.md](docs/management.md) にあります。

## ブランチと PR

- `main` — リリース版。`develop` からの PR でのみ更新する
- `develop` — 開発の統合ブランチ（既定のブランチ）
- 作業ブランチ — `develop` から `種別/Issue番号-内容`（例: `feat/14-wipe-stubborn-dirt`）で切り、`develop` 向けに PR を出す。PR 本文に `Closes #番号` を書く

コーディング規約・テスト・コミットの決まりは [CLAUDE.md](CLAUDE.md) にまとめています。
