# 仕様書

## 目的

GitHub Issue を階層構造で扱い、タスク分解と進行管理をしやすくする。

## 機能一覧

- GitHub 認証（NextAuth）
- リポジトリ選択
- Issue 一覧取得
- サブ Issue（親子関係）取得
- アウトライナー表示（ツリー表示）
- ドラッグ＆ドロップで並び替え
- 階層変更（親子付け替え）
- キーボードショートカット操作

## システム全体像

![システム全体像](./images/system-overview.svg)

## 画面仕様（ワークフロー）

### 1. ログイン画面

- GitHub アカウントでサインインする
- サインイン後、リポジトリ選択画面へ遷移する

### 2. リポジトリ選択画面

- 対象の `owner/repo` を選ぶ
- 選択したリポジトリの Issue アウトライナー画面へ遷移する

### 3. Issue アウトライナー画面

- Issue をツリー構造で表示する
- 行クリックでフォーカス、ダブルクリックまたは `F2` でタイトル編集
- `Enter` で同階層の新規 Issue を追加
- `Tab` で1つ右にインデントして、直前の兄弟 Issue の子 Issue にする
- `Shift + Tab` で1つ左にアウトデントして、親の階層へ戻す
- `Alt + Shift + ↑/↓` で同じ親配下の並び順を変更
- `Ctrl + Enter` で open/closed を切り替える
- `Alt + →` で子階層へズームイン、`Alt + ←` でズームアウト

### 4. 操作ボタン仕様（追加予定）

- `更新` ボタン:
  - 押下時に最新の Issue / サブ Issue を再取得し、画面のツリーを再構築する
  - 目的: 他ユーザー更新や GitHub 側変更を即時反映する
- `インポート` ボタン:
  - 押下時に対象リポジトリの Issue 一覧を取り込み、未表示の Issue をアウトライナーに反映する
  - 目的: 初回読み込み後に増えた Issue を手動で取り込めるようにする

### 代表的な操作フロー（親子関係の作成）

1. 親にしたい Issue の直下に、子にしたい Issue を並べる
2. 子にしたい Issue 行にフォーカスを当てる
3. `Tab` キーを押す
4. その Issue が1段深い階層に移動し、親子関係（子 Issue）になる

## 技術構成

- フロントエンド: Next.js (App Router), React, TypeScript
- UI: Tailwind CSS, Radix UI, dnd-kit, Zustand
- 認証: next-auth
- GitHub 連携: Octokit / GitHub REST API
- テスト: Vitest

## 主要ディレクトリ

- `src/app`: 画面とルーティング
- `src/components`: UI コンポーネント
- `src/lib/github`: GitHub API 連携層
- `src/lib/tree`: ツリー操作ロジック
- `src/hooks`: データ取得・更新フック
- `src/actions`: サーバーアクション

## 想定ユースケース

- 大きな Issue を子 Issue に分割して管理したい
- 優先度変更に合わせて階層と順序を素早く調整したい
- Issue の進捗を構造的に把握したい
