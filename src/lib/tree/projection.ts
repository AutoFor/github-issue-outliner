import type { IssueId } from "@/lib/github/types";  // 型
import type { FlattenedItem, Projection } from "./types";  // ツリー型
import { MAX_DEPTH } from "./types";  // 最大階層数

/**
 * ドラッグ中のアイテムのドロップ位置を計算
 * マウスの水平オフセットからインデントレベルを推定する
 */
export function getProjection(
  flatItems: FlattenedItem[],
  activeId: IssueId,
  overId: IssueId,
  dragOffset: number,
  indentationWidth: number = 28
): Projection | null {
  const activeIndex = flatItems.findIndex((i) => i.issue.id === activeId);  // ドラッグ中のアイテム
  const overIndex = flatItems.findIndex((i) => i.issue.id === overId);  // ドロップ先のアイテム

  if (activeIndex === -1 || overIndex === -1) return null;  // 見つからない場合

  const activeItem = flatItems[activeIndex];
  const overItem = flatItems[overIndex];

  // ドラッグオフセットからインデント数を計算
  const projectedDepth = activeItem.depth + Math.round(dragOffset / indentationWidth);

  // 最小・最大深さを計算
  const minDepth = 0;
  const maxDepth = Math.min(overItem.depth + 1, MAX_DEPTH);  // 8階層制限

  // 深さをクランプ
  const depth = Math.max(minDepth, Math.min(projectedDepth, maxDepth));

  // 深さに基づいて親を特定
  const parentId = findParentAtDepth(flatItems, overIndex, depth);

  return {
    depth,
    parentId,
    overId,
    position: depth > overItem.depth ? "child" : "after",
  };
}

/** 指定深さに対応する親 Issue ID を検索 */
function findParentAtDepth(
  flatItems: FlattenedItem[],
  overIndex: number,
  targetDepth: number
): IssueId | null {
  if (targetDepth === 0) return null;  // ルートレベル

  // overIndex から逆方向に探索し、targetDepth - 1 の深さを持つアイテムを見つける
  for (let i = overIndex; i >= 0; i--) {
    if (flatItems[i].depth === targetDepth - 1) {
      return flatItems[i].issue.id;  // 親候補
    }
    // 深さが targetDepth - 1 より小さい場合は探索を打ち切り
    if (flatItems[i].depth < targetDepth - 1) break;
  }

  return null;  // 親が見つからない
}

/** アイテムの子孫数を数える（ドラッグ時に一緒に移動する数の計算用） */
export function getDescendantCount(
  flatItems: FlattenedItem[],
  issueId: IssueId
): number {
  const index = flatItems.findIndex((i) => i.issue.id === issueId);
  if (index === -1) return 0;

  const depth = flatItems[index].depth;
  let count = 0;

  // 次のアイテムから、深さが元のアイテムより大きい間カウント
  for (let i = index + 1; i < flatItems.length; i++) {
    if (flatItems[i].depth <= depth) break;  // 同レベルか上位に到達
    count++;
  }

  return count;
}
