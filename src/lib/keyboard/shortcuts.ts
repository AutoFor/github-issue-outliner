/** キーボードショートカット定義 */
export interface ShortcutDef {
  key: string;  // キー名
  ctrl?: boolean;  // Ctrl キー
  shift?: boolean;  // Shift キー
  alt?: boolean;  // Alt キー
  description: string;  // 説明
}

/** ショートカット一覧（ヘルプ表示用） */
export const SHORTCUTS: Record<string, ShortcutDef> = {
  focusUp: { key: "ArrowUp", description: "フォーカスを上に移動" },
  focusDown: { key: "ArrowDown", description: "フォーカスを下に移動" },
  indent: { key: "Tab", description: "インデント（子 Issue 化）" },
  outdent: { key: "Tab", shift: true, description: "アウトデント（親の階層に移動）" },
  newSibling: { key: "Enter", description: "新しい兄弟 Issue 作成" },
  zoomIn: { key: "ArrowRight", alt: true, description: "ズームイン" },
  zoomOut: { key: "ArrowLeft", alt: true, description: "ズームアウト" },
  moveUp: { key: "ArrowUp", alt: true, shift: true, description: "上に並び替え" },
  moveDown: { key: "ArrowDown", alt: true, shift: true, description: "下に並び替え" },
  toggleState: { key: "Enter", ctrl: true, description: "クローズ/再オープン" },
  collapseExpand: { key: "ArrowUp", ctrl: true, description: "折りたたみ/展開" },
  undo: { key: "z", ctrl: true, description: "Undo" },
  redo: { key: "z", ctrl: true, shift: true, description: "Redo" },
  escape: { key: "Escape", description: "編集キャンセル" },
};

/** ショートカットが一致するか判定 */
export function matchesShortcut(
  e: KeyboardEvent,
  shortcut: ShortcutDef
): boolean {
  return (
    e.key === shortcut.key &&
    !!e.ctrlKey === !!shortcut.ctrl &&
    !!e.shiftKey === !!shortcut.shift &&
    !!e.altKey === !!shortcut.alt
  );
}
