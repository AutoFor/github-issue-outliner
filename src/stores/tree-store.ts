import { create } from "zustand";  // 状態管理ライブラリ
import type { IssueId } from "@/lib/github/types";  // 型
import type { TreeItem, FlattenedItem } from "@/lib/tree/types";  // ツリー型
import { flattenTree } from "@/lib/tree/flatten";  // フラット化

/** Undo/Redo 用のスナップショット */
interface TreeSnapshot {
  tree: TreeItem[];  // ツリー状態
  collapsedIds: Set<IssueId>;  // 折りたたみ状態
}

interface TreeState {
  tree: TreeItem[];  // ツリーデータ
  flatItems: FlattenedItem[];  // フラット化された表示データ
  collapsedIds: Set<IssueId>;  // 折りたたまれた Issue ID
  focusedId: IssueId | null;  // フォーカス中の Issue ID
  editingId: IssueId | null;  // 編集中の Issue ID
  zoomId: IssueId | null;  // ズーム中の Issue ID（サブツリー表示）
  undoStack: TreeSnapshot[];  // Undo 用スタック
  redoStack: TreeSnapshot[];  // Redo 用スタック

  // アクション
  setTree: (tree: TreeItem[]) => void;  // ツリーをセット
  toggleCollapsed: (issueId: IssueId) => void;  // 折りたたみ切り替え
  setFocusedId: (id: IssueId | null) => void;  // フォーカス設定
  setEditingId: (id: IssueId | null) => void;  // 編集状態設定
  setZoomId: (id: IssueId | null) => void;  // ズーム設定
  undo: () => void;  // Undo
  redo: () => void;  // Redo
  pushSnapshot: () => void;  // スナップショットを保存
}

export const useTreeStore = create<TreeState>((set, get) => ({
  tree: [],
  flatItems: [],
  collapsedIds: new Set(),
  focusedId: null,
  editingId: null,
  zoomId: null,
  undoStack: [],
  redoStack: [],

  setTree: (tree) => {
    const { collapsedIds, zoomId } = get();  // 現在の状態

    // ズーム中の場合はサブツリーのみ表示
    let displayTree = tree;
    if (zoomId !== null) {
      const findSubtree = (items: TreeItem[]): TreeItem[] => {
        for (const item of items) {
          if (item.issue.id === zoomId) return [item];
          const found = findSubtree(item.children);
          if (found.length > 0) return found;
        }
        return [];
      };
      displayTree = findSubtree(tree);
    }

    // 折りたたみ状態を反映
    const applyCollapsed = (items: TreeItem[]): TreeItem[] =>
      items.map((item) => ({
        ...item,
        collapsed: collapsedIds.has(item.issue.id),
        children: applyCollapsed(item.children),
      }));

    const collapsedTree = applyCollapsed(displayTree);
    const flatItems = flattenTree(collapsedTree);

    set({ tree, flatItems });
  },

  toggleCollapsed: (issueId) => {
    const { collapsedIds, tree } = get();
    const newCollapsed = new Set(collapsedIds);

    if (newCollapsed.has(issueId)) {
      newCollapsed.delete(issueId);  // 展開
    } else {
      newCollapsed.add(issueId);  // 折りたたみ
    }

    set({ collapsedIds: newCollapsed });

    // flatItems を再計算
    get().setTree(tree);
  },

  setFocusedId: (id) => set({ focusedId: id }),

  setEditingId: (id) => set({ editingId: id }),

  setZoomId: (id) => {
    set({ zoomId: id });
    get().setTree(get().tree);  // ツリーを再計算
  },

  pushSnapshot: () => {
    const { tree, collapsedIds, undoStack } = get();
    const snapshot: TreeSnapshot = {
      tree: structuredClone(tree),  // ディープコピー
      collapsedIds: new Set(collapsedIds),
    };
    set({
      undoStack: [...undoStack.slice(-49), snapshot],  // 最大50件
      redoStack: [],  // Redo スタックをクリア
    });
  },

  undo: () => {
    const { undoStack, tree, collapsedIds, redoStack } = get();
    if (undoStack.length === 0) return;  // Undo 不可

    const currentSnapshot: TreeSnapshot = {
      tree: structuredClone(tree),
      collapsedIds: new Set(collapsedIds),
    };

    const prevSnapshot = undoStack[undoStack.length - 1];
    set({
      tree: prevSnapshot.tree,
      collapsedIds: prevSnapshot.collapsedIds,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, currentSnapshot],
    });

    get().setTree(prevSnapshot.tree);
  },

  redo: () => {
    const { redoStack, tree, collapsedIds, undoStack } = get();
    if (redoStack.length === 0) return;  // Redo 不可

    const currentSnapshot: TreeSnapshot = {
      tree: structuredClone(tree),
      collapsedIds: new Set(collapsedIds),
    };

    const nextSnapshot = redoStack[redoStack.length - 1];
    set({
      tree: nextSnapshot.tree,
      collapsedIds: nextSnapshot.collapsedIds,
      redoStack: redoStack.slice(0, -1),
      undoStack: [...undoStack, currentSnapshot],
    });

    get().setTree(nextSnapshot.tree);
  },
}));
