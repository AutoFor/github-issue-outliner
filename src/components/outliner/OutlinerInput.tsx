"use client";  // クライアントコンポーネント

import { useState, useRef, useEffect, useCallback } from "react";  // React フック
import { useTreeStore } from "@/stores/tree-store";  // ツリー状態
import { useMutateIssue } from "@/hooks/useMutateIssue";  // Issue 操作
import type { IssueId, IssueNumber } from "@/lib/github/types";  // 型

interface Props {
  issueId: IssueId;  // Issue DB ID
  issueNumber: IssueNumber;  // Issue 番号
  initialTitle: string;  // 現在のタイトル
  owner: string;  // リポジトリオーナー
  repo: string;  // リポジトリ名
}

export function OutlinerInput({ issueId, issueNumber, initialTitle, owner, repo }: Props) {
  const [title, setTitle] = useState(initialTitle);  // 編集中のタイトル
  const inputRef = useRef<HTMLInputElement>(null);  // input DOM 参照
  const { setEditingId } = useTreeStore();  // 編集状態管理
  const { updateTitle } = useMutateIssue(owner, repo);  // タイトル更新

  // マウント時に自動フォーカス + 全選択
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  /** 保存して編集終了 */
  const handleSave = useCallback(async () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== initialTitle) {
      await updateTitle(issueNumber, trimmed);  // API 更新
    }
    setEditingId(null);  // 編集モード終了
  }, [title, initialTitle, issueNumber, updateTitle, setEditingId]);

  /** キー操作 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();  // Enter で保存
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditingId(null);  // Escape でキャンセル
      }
    },
    [handleSave, setEditingId]
  );

  return (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className="w-full bg-transparent text-sm outline-none"
      aria-label="Issue タイトルを編集"
    />
  );
}
