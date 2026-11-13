# CLAUDE.md

## プロジェクト概要

スマートフォンのブラウザですぐ遊べる、保護フィルム貼りゲーム。1プレイ約90秒、5工程（拭く → 埃取り → 位置合わせ → 仮固定 → 気泡抜き）の仕上がり品質と残り時間で評価する。

- 企画・仕様の正本は [docs/game-plan.md](docs/game-plan.md)。仕様に関わる変更はここも合わせて更新する。
- リモート: `ueno000/hogofilm`（GitHub）

## 技術スタックと制約

- Vite + TypeScript（strict）。静的サイトとしてビルドする。
- 描画は SVG / HTML / CSS、入力は Pointer Events（タッチ・マウス両対応）。PC はキーボード操作にも対応する。
- ゲーム操作領域には `touch-action` を設定し、ドラッグ中のスクロールや拡大を防ぐ。
- React、ゲームエンジン、物理演算ライブラリ、音声ライブラリは入れない。新しい依存を追加する場合は事前に相談する。

## コマンド

```bash
npm run dev     # 開発サーバー（.claude/launch.json の "dev" はポート 5173 固定）
npm test        # Vitest（tests/**/*.test.ts）
npm run build   # tsc --noEmit による型チェック + vite build
```

## ディレクトリ構成

- `src/main.ts` — エントリポイント。`src/dom.ts` は DOM ヘルパー
- `src/scenes/` — タイトル、遊び方、プレイ、結果の各画面
- `src/game/` — 状態、タイマー、スコア、称号、シェア文（DOM 非依存）
- `src/stages/` — 各工程の UI。`Stage` インターフェース（`stage.ts`）を実装し、`index.ts` に登録する
- `src/stages/logic/` — 各工程の判定ロジック（DOM 非依存の純粋関数）
- `tests/` — `src` と対応する配置で Vitest のテストを置く

## コーディング規約

- TypeScript strict。未使用の変数・引数は残さない（tsconfig でエラーになる）。
- シングルクォート、セミコロンあり、インデント 2 スペース。既存コードの書き方に合わせる。
- 型だけの import は `import type` を使う。
- 判定・計算ロジックは `src/stages/logic/` や `src/game/` に DOM 非依存の純粋関数として置く。UI 側（`src/stages/*.ts`, `src/scenes/*.ts`）は描画と入力処理に専念する。
- 調整用の数値はマジックナンバーにせず、名前付き定数（例: `WIPE_RADIUS`）にして単位や意味をコメントで書く。
- コメント・JSDoc は日本語で簡潔に。UI 文言も日本語。
- 工程を追加するときは `Stage` インターフェースに従い、`game/types.ts` の `StageId` / `STAGE_ORDER` と `stages/index.ts` に登録する。
- `mount` が返す後片付け関数で、イベントリスナー・タイマー・アニメーションを必ず解除する。

## テスト・動作確認

- ロジックを追加・変更したら `tests/` に Vitest のテストを追加・更新する。テスト名（`it`）は日本語で振る舞いを書く。
- UI の変更は dev サーバーをブラウザで開いて確認する。スマホ幅（375px 程度）とタッチ操作も確認する。

## ブランチ運用

- `main` — 最終（リリース）ブランチ。直接コミットしない。`develop` からの PR でのみ更新する。
- `develop` — 開発の統合ブランチ。直接コミットしない。作業ブランチからの PR で更新する。
- 作業ブランチ — 最新の `develop` から切り、`develop` 向けに PR を出す。
  - 名前は `種別/内容` の英小文字・ハイフン区切り
  - `feat/` 機能追加、`fix/` バグ修正、`refactor/` リファクタリング、`docs/` ドキュメント、`chore/` 設定・依存など
  - 例: `feat/sound-effects`, `fix/tack-timing`

```bash
git switch develop
git pull
git switch -c feat/xxx
```

- リリース時は `develop` → `main` の PR を作る。マージ後、`main` の内容が最終版になる。

## コミット

- コミット前に `npm test` と `npm run build` が通ることを確認する。
- メッセージは英語。1行目は命令形の短い要約（50字程度、末尾ピリオドなし）、空行を挟んで本文に「何を・なぜ」を書く。
  - 例: `Implement the five film stages as playable mechanics`
- 1コミット1目的。無関係な変更を混ぜない。
- push はユーザーの指示があってから行う。

## プルリクエスト

- 作業ブランチの PR は `develop` 向け（`gh pr create --base develop`）。`main` 向けは `develop` からのリリース PR だけ。
- タイトルは英語の短い要約。本文は以下の構成で書く。
  - **概要**: 何のための変更か
  - **変更点**: 主な変更の箇条書き
  - **動作確認**: 実行したテスト・ビルド、ブラウザでの確認内容（UI 変更はスクリーンショットを添える）
- テストとビルドが通っていること。マージはユーザーが判断する。
