"use client";  // クライアントフック

import { useEffect, useCallback } from "react";  // React フック
import { useTreeStore } from "@/stores/tree-store";  // ツリー状態
import { SHORTCUTS, matchesShortcut } from "./shortcuts";  // ショートカット定義
import { getIndentTarget, getOutdentTarget, getSwapTarget, getParentIssueNumber } from "@/lib/tree/operations";  // ツリー操作
import type { FlattenedItem } from "@/lib/tree/types";  // 型
import type { IssueId } from "@/lib/github/types";  // 型

interface Params {
  owner: string;  // リポジトリオーナー
  repo: string;  // リポジトリ名
  flatItems: FlattenedItem[];  // フラット化されたアイテム
  create: (title: string, parentNumber?: number) => Promise<unknown>;  // Issue 作成
  updateTitle: (number: number, title: string) => Promise<void>;  // タイトル更新
  toggleState: (number: number, state: "open" | "closed") => Promise<void>;  // 状態切り替え
  moveToParent: (
    id: IssueId,
    oldParent: number | null,
    newParent: number | null,
    afterId?: IssueId,
    beforeId?: IssueId
  ) => Promise<void>;  // 階層移動
  reorder: (
    parentNumber: number,
    childId: IssueId,
    afterId?: IssueId,
    beforeId?: IssueId
  ) => Promise<void>;  // 並び替え
}

export function useKeyboardShortcuts({
  flatItems,
  create,
  toggleState,
  moveToParent,
}: Params) {
  const {
    focusedId,
    editingId,
    zoomId,
    setFocusedId,
    setEditingId,
    toggleCollapsed,
    setZoomId,
    undo,
    redo,
    pushSnapshot,
  } = useTreeStore();

  /** フォーカスを上下に移動 */
  const moveFocus = useCallback(
    (direction: "up" | "down") => {
      if (flatItems.length === 0) return;

      if (focusedId === null) {
        setFocusedId(flatItems[0].issue.id);  // フォーカスなし → 最初のアイテム
        return;
      }

      const currentIndex = flatItems.findIndex((i) => i.issue.id === focusedId);
      if (currentIndex === -1) return;

      const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < flatItems.length) {
        setFocusedId(flatItems[nextIndex].issue.id);
      }
    },
    [flatItems, focusedId, setFocusedId]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 編集中は Escape と Enter のみ処理
      if (editingId !== null) {
        if (e.key === "Escape") {
          setEditingId(null);
        }
        return;
      }

      // 入力フィールド内では無視
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      // フォーカス移動: ↑/↓
      if (matchesShortcut(e, SHORTCUTS.focusUp)) {
        e.preventDefault();
        moveFocus("up");
        return;
      }
      if (matchesShortcut(e, SHORTCUTS.focusDown)) {
        e.preventDefault();
        moveFocus("down");
        return;
      }

      // フォーカス中のアイテムがない場合は以降の操作をスキップ
      if (focusedId === null) return;
      const focusedItem = flatItems.find((i) => i.issue.id === focusedId);
      if (!focusedItem) return;

      // インデント: Tab
      if (matchesShortcut(e, SHORTCUTS.indent)) {
        e.preventDefault();
        const target = getIndentTarget(flatItems, focusedId);
        if (target) {
          pushSnapshot();
          const oldParentNumber = getParentIssueNumber(flatItems, target.oldParentId);
          const newParent = flatItems.find((i) => i.issue.id === target.newParentId);
          if (newParent) {
            moveToParent(focusedId, oldParentNumber, newParent.issue.number);
          }
        }
        return;
      }

      // アウトデント: Shift+Tab
      if (matchesShortcut(e, SHORTCUTS.outdent)) {
        e.preventDefault();
        const target = getOutdentTarget(flatItems, focusedId);
        if (target) {
          pushSnapshot();
          const oldParent = flatItems.find((i) => i.issue.id === target.oldParentId);
          const newParentNumber = getParentIssueNumber(flatItems, target.newParentId);
          if (oldParent) {
            moveToParent(focusedId, oldParent.issue.number, newParentNumber);
          }
        }
        return;
      }

      // 新規兄弟 Issue: Enter
      if (matchesShortcut(e, SHORTCUTS.newSibling)) {
        e.preventDefault();
        const parentNumber = getParentIssueNumber(flatItems, focusedItem.parentId);
        create("新しい Issue", parentNumber ?? undefined);
        return;
      }

      // ズームイン: Alt+→
      if (matchesShortcut(e, SHORTCUTS.zoomIn)) {
        e.preventDefault();
        if (focusedItem.childCount > 0) {
          setZoomId(focusedId);
        }
        return;
      }

      // ズームアウト: Alt+←
      if (matchesShortcut(e, SHORTCUTS.zoomOut)) {
        e.preventDefault();
        setZoomId(null);
        return;
      }

      // 並び替え: Alt+Shift+↑/↓
      if (matchesShortcut(e, SHORTCUTS.moveUp)) {
        e.preventDefault();
        const target = getSwapTarget(flatItems, focusedId, "up");
        if (target && focusedItem.parentId !== null) {
          pushSnapshot();
          const parentNumber = getParentIssueNumber(flatItems, focusedItem.parentId);
          if (parentNumber !== null) {
            // beforeId = 前の兄弟のさらに前の兄弟（あれば）、もしくは最初に移動
            const prevOfTarget = getSwapTarget(flatItems, target.issue.id, "up");
            moveToParent(
              focusedId,
              parentNumber,
              parentNumber,
              prevOfTarget?.issue.id,
              target.issue.id
            );
          }
        }
        return;
      }
      if (matchesShortcut(e, SHORTCUTS.moveDown)) {
        e.preventDefault();
        const target = getSwapTarget(flatItems, focusedId, "down");
        if (target && focusedItem.parentId !== null) {
          pushSnapshot();
          const parentNumber = getParentIssueNumber(flatItems, focusedItem.parentId);
          if (parentNumber !== null) {
            moveToParent(
              focusedId,
              parentNumber,
              parentNumber,
              target.issue.id
            );
          }
        }
        return;
      }

      // クローズ/再オープン: Ctrl+Enter
      if (matchesShortcut(e, SHORTCUTS.toggleState)) {
        e.preventDefault();
        toggleState(focusedItem.issue.number, focusedItem.issue.state);
        return;
      }

      // 折りたたみ/展開: Ctrl+↑
      if (matchesShortcut(e, SHORTCUTS.collapseExpand)) {
        e.preventDefault();
        toggleCollapsed(focusedId);
        return;
      }

      // Undo: Ctrl+Z
      if (matchesShortcut(e, SHORTCUTS.undo)) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z
      if (matchesShortcut(e, SHORTCUTS.redo)) {
        e.preventDefault();
        redo();
        return;
      }

      // ダブルクリック代わりに F2 で編集
      if (e.key === "F2") {
        e.preventDefault();
        setEditingId(focusedId);
        return;
      }
    },
    [
      editingId,
      flatItems,
      focusedId,
      moveFocus,
      setEditingId,
      toggleCollapsed,
      setZoomId,
      pushSnapshot,
      moveToParent,
      create,
      toggleState,
      undo,
      redo,
    ]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
