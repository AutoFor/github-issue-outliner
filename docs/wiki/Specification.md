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
