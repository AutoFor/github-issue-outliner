import { create } from "zustand";  // 状態管理ライブラリ

interface UIState {
  isSyncing: boolean;  // API 同期中フラグ
  dragActiveId: number | null;  // ドラッグ中の Issue ID
  showClosedIssues: boolean;  // クローズ Issue 表示フラグ

  setIsSyncing: (syncing: boolean) => void;
  setDragActiveId: (id: number | null) => void;
  toggleShowClosedIssues: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSyncing: false,
  dragActiveId: null,
  showClosedIssues: false,

  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
  setDragActiveId: (id) => set({ dragActiveId: id }),
  toggleShowClosedIssues: () =>
    set((state) => ({ showClosedIssues: !state.showClosedIssues })),
}));
