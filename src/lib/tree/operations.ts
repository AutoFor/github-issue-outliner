import type { IssueId } from "@/lib/github/types";  // 型
import type { FlattenedItem } from "./types";  // ツリー型
import { MAX_DEPTH } from "./types";  // 最大階層数

/** インデント（Tab）: 現在のアイテムを前の兄弟の子にする */
export function getIndentTarget(
  flatItems: FlattenedItem[],
  issueId: IssueId
): { newParentId: IssueId; oldParentId: IssueId | null } | null {
  const index = flatItems.findIndex((i) => i.issue.id === issueId);
  if (index <= 0) return null;  // 最初のアイテムはインデント不可

  const item = flatItems[index];

  // 8階層制限チェック
  if (item.depth >= MAX_DEPTH) return null;

  // 前の兄弟（同じ深さの直前のアイテム）を探す
  for (let i = index - 1; i >= 0; i--) {
    if (flatItems[i].depth === item.depth) {
      return {
        newParentId: flatItems[i].issue.id,  // 前の兄弟が新しい親
        oldParentId: item.parentId,
      };
    }
    if (flatItems[i].depth < item.depth) break;  // 上位に到達したら中止
  }

  return null;  // インデント不可
}

/** アウトデント（Shift+Tab）: 現在のアイテムを親の兄弟にする */
export function getOutdentTarget(
  flatItems: FlattenedItem[],
  issueId: IssueId
): { newParentId: IssueId | null; oldParentId: IssueId } | null {
  const index = flatItems.findIndex((i) => i.issue.id === issueId);
  if (index === -1) return null;

  const item = flatItems[index];
  if (item.depth === 0 || item.parentId === null) return null;  // ルートレベルはアウトデント不可

  // 親の parentId を探す（祖父母）
  const parent = flatItems.find((i) => i.issue.id === item.parentId);
  if (!parent) return null;

  return {
    newParentId: parent.parentId,  // 祖父母が新しい親（null = ルート）
    oldParentId: item.parentId,
  };
}

/** 前の兄弟を取得（並び替え時の afterId 計算用） */
export function getPreviousSibling(
  flatItems: FlattenedItem[],
  issueId: IssueId
): FlattenedItem | null {
  const index = flatItems.findIndex((i) => i.issue.id === issueId);
  if (index <= 0) return null;

  const item = flatItems[index];

  for (let i = index - 1; i >= 0; i--) {
    if (flatItems[i].depth === item.depth && flatItems[i].parentId === item.parentId) {
      return flatItems[i];  // 同じ親の前の兄弟
    }
    if (flatItems[i].depth < item.depth) break;
  }

  return null;
}

/** 次の兄弟を取得 */
export function getNextSibling(
  flatItems: FlattenedItem[],
  issueId: IssueId
): FlattenedItem | null {
  const index = flatItems.findIndex((i) => i.issue.id === issueId);
  if (index === -1) return null;

  const item = flatItems[index];

  for (let i = index + 1; i < flatItems.length; i++) {
    if (flatItems[i].depth === item.depth && flatItems[i].parentId === item.parentId) {
      return flatItems[i];  // 同じ親の次の兄弟
    }
    if (flatItems[i].depth < item.depth) break;
  }

  return null;
}

/** 兄弟間でのスワップ（Alt+Shift+↑/↓ 用）のターゲットを取得 */
export function getSwapTarget(
  flatItems: FlattenedItem[],
  issueId: IssueId,
  direction: "up" | "down"
): FlattenedItem | null {
  return direction === "up"
    ? getPreviousSibling(flatItems, issueId)
    : getNextSibling(flatItems, issueId);
}

/**
 * Issue Number からフラットアイテムの親の Issue Number を取得
 * Sub-Issues API は issue_number を使うため
 */
export function getParentIssueNumber(
  flatItems: FlattenedItem[],
  parentId: IssueId | null
): number | null {
  if (parentId === null) return null;
  const parent = flatItems.find((i) => i.issue.id === parentId);
  return parent?.issue.number ?? null;
}
