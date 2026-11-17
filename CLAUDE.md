# CLAUDE.md

## プロジェクト概要

スマートフォンのブラウザですぐ遊べる、保護フィルム貼りゲーム。1プレイ約90秒、5工程（拭く → 埃取り → 位置合わせ → 仮固定 → 気泡抜き）の仕上がり品質と残り時間で評価する。

- 仕様の正本は2つある。
  - **ルール・流れ・文言・受け入れ条件**: [docs/game-plan.md](docs/game-plan.md)。仕様に関わる変更はここも合わせて更新する。
  - **数値（調整パラメータ・配点・目安時間・称号のスコア帯）**: Google スプレッドシート「保護フィルム貼りゲーム 企画管理シート」。シートの仕様タブ（工程設計・調整パラメータ・称号）は開発セッションから編集しない。
- 工程管理は GitHub Project「development」（https://github.com/users/ueno000/projects/1）で行う。管理の手順は [docs/management.md](docs/management.md)。
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
- `src/game/` — 状態、タイマー、スコア、称号、シェア文、調整値の読み込み（DOM 非依存）
- `src/params.csv` — 調整値。企画管理シートの「パラメータCSV」タブから出力したものを置く
- `src/titles.csv` — 称号の言葉とひとこと。企画管理シートの「称号CSV」タブから出力したものを置く（`src/game/titles.ts` で読む）
- `src/stages/` — 各工程の UI。`Stage` インターフェース（`stage.ts`）を実装し、`index.ts` に登録する
- `src/stages/logic/` — 各工程の判定ロジック（DOM 非依存の純粋関数）
- `tests/` — `src` と対応する配置で Vitest のテストを置く

## コーディング規約

- TypeScript strict。未使用の変数・引数は残さない（tsconfig でエラーになる）。
- シングルクォート、セミコロンあり、インデント 2 スペース。既存コードの書き方に合わせる。
- 型だけの import は `import type` を使う。
- 判定・計算ロジックは `src/stages/logic/` や `src/game/` に DOM 非依存の純粋関数として置く。UI 側（`src/stages/*.ts`, `src/scenes/*.ts`）は描画と入力処理に専念する。
- 調整用の数値（企画が変えて試す値）は `src/params.csv` に置き、`src/game/params.ts` の `param()` で引く。定数として受けて使う（例: `export const WIPE_RADIUS = param('WIPE_RADIUS');`）。
  - CSV の列は `name,value,unit,stage,description`。企画管理シートの「パラメータCSV」タブから出力した形と同じにする。
  - 調整値を追加するときは、`src/params.csv` に行を足し、`params.ts` の `PARAM_NAMES` にも名前を足す。CSV に無い名前や数値でない値があると、ゲームは起動せずに画面へエラーを出す。
  - シートの「パラメータCSV」タブにまだ無い名前を足したときは、Issue コメントで企画にシートへの追加を頼む（シートは編集しない）。
- 称号の言葉とひとことは `src/titles.csv`（列は `type,key,text,image`）に置き、`src/game/titles.ts` で読む。コードに直接書かない。
  - 必要な key は `titles.ts` の `WORD_KEYS`（言葉）と `COMMENT_KEYS`（ひとことの判定キー）。足りない key や空のひとことがあると、ゲームは起動せずに画面へエラーを出す。
  - 描画用の固定値（`SCREEN` など）や配点・称号表は CSV に入れず、名前付き定数にして単位や意味をコメントで書く。
- コメント・JSDoc は日本語で簡潔に。UI 文言も日本語。
- 工程を追加するときは `Stage` インターフェースに従い、`game/types.ts` の `StageId` / `STAGE_ORDER` と `stages/index.ts` に登録する。
- `mount` が返す後片付け関数で、イベントリスナー・タイマー・アニメーションを必ず解除する。

## テスト・動作確認

- ロジックを追加・変更したら `tests/` に Vitest のテストを追加・更新する。テスト名（`it`）は日本語で振る舞いを書く。
- UI の変更は dev サーバーをブラウザで開いて確認する。スマホ幅（375px 程度）とタッチ操作も確認する。

## チケット（GitHub Issue）運用

作業は GitHub Issue（`ueno000/hogofilm`）を単位に進める。

### 作業開始時（毎回）

1. `gh issue list` で未完了のチケットを確認し、今回の作業に対応する Issue を特定する。
2. `gh issue view <番号> --comments` で本文とコメント履歴を読み、最新の仕様・決定事項を把握してから着手する。
3. 対応する Issue がない作業は、着手前に Issue を作る（ラベル: `stage` / `ui` / `game-logic` / `test` / `release` / `bug` / `documentation` など）。
4. Issue の内容と `docs/game-plan.md`・企画管理シートが食い違う場合は、作業前にユーザーに確認する。

### Project（development）

- Issue はすべて Project「development」に載せる。新しく起票したら `gh project item-add 1 --owner ueno000 --url <IssueのURL>` で追加する。
- **Status**（Todo / In Progress / Done）が進捗の正。着手したら In Progress、PR がマージされたら Done にする。
- **Track** で種類を分ける: `Spec`（仕様の実装）/ `Tech`（基盤・描画・テスト・リファクタリング）/ `Release`（公開・配信）。
- シートの「進捗」タブは Project の写し。マネージャーが同期するので、開発セッションは書き換えない。

### 仕様が変わったとき

仕様変更は必ず Issue コメントに残し、履歴を追えるようにする。Issue 本文は書き換えず、コメントで追記する。

- 該当 Issue に `gh issue comment <番号>` で以下を書く。
  - **変更内容**: 何がどう変わったか（変更前 → 変更後）
  - **理由**: なぜ変えたか（ユーザーの指示・プレイ確認の結果など）
  - **影響範囲**: 関係するファイル・工程・他の Issue
- ルール・文言の変更は、仕様の正本である `docs/game-plan.md` も同じ変更で更新する。
- 調整パラメータなど数値を変えた場合は、シートを直接書き換えず、Issue コメントに変更前 → 変更後を書く。シートへの反映はユーザー（企画）とマネージャーが行う。`src/params.csv` の値とシートがずれる場合は、その旨もコメントに書く。
- シート側で仕様が変わったときは、マネージャーが Issue にコメントまたは起票する（手順は [docs/management.md](docs/management.md)）。
- 複数の Issue にまたがる変更は、それぞれの Issue にコメントし相互にリンクする（`#番号`）。

### 作業ブランチ・PR との紐付け

PR の Development 欄には、対応する Issue を**必ず**設定する。

- リポジトリのデフォルトブランチは `develop`。`develop` 向け PR の本文に `Closes #番号` を書くと、Development 欄に Issue が入り、マージ時に Issue が自動でクローズされる。
- Issue を完了させる PR は、本文に必ず `Closes #番号` を書く。
- 一部対応の PR は `Refs #番号` を書く。ただし `Refs` では Development 欄に入らないので、PR 作成後に PR 画面の Development から Issue を手動で設定する。
- ブランチ名に Issue 番号を入れる（例: `feat/1-wipe-stage`, `fix/4-tack-timing`）。
- PR 作成後、Development 欄に Issue が入っていることを確認する。

```bash
gh pr view <PR番号> --json closingIssuesReferences --jq '[.closingIssuesReferences[].number]'
```

## ブランチ運用

- `main` — 最終（リリース）ブランチ。直接コミットしない。`develop` からの PR でのみ更新する。
- `develop` — 開発の統合ブランチで、リポジトリのデフォルトブランチ。直接コミットしない。作業ブランチからの PR で更新する。
- 作業ブランチ — 最新の `develop` から切り、`develop` 向けに PR を出す。
  - 名前は `種別/内容` の英小文字・ハイフン区切り
  - `feat/` 機能追加、`fix/` バグ修正、`refactor/` リファクタリング、`docs/` ドキュメント、`chore/` 設定・依存など
  - Issue がある場合は番号を入れる。例: `feat/5-bubbles-stage`, `fix/4-tack-timing`

```bash
git switch develop
git pull
git switch -c feat/<番号>-xxx
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
  - **概要**: 何のための変更か。関連 Issue を `Closes #番号`（完了）/ `Refs #番号`（一部対応）で書く
  - **変更点**: 主な変更の箇条書き
  - **動作確認**: 実行したテスト・ビルド、ブラウザでの確認内容（UI 変更はスクリーンショットを添える）
- Development 欄に対応 Issue が設定されていること（上記「作業ブランチ・PR との紐付け」）。
- テストとビルドが通っていること。マージはユーザーが判断する。
