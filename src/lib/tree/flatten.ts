import type { GitHubIssue, IssueId } from "@/lib/github/types";  // 型
import type { TreeItem, FlattenedItem } from "./types";  // ツリー型

/**
 * ツリーをフラット配列に変換（レンダリング用）
 * 折りたたまれたノードの子はスキップする
 */
export function flattenTree(
  items: TreeItem[],
  parentId: IssueId | null = null,
  depth: number = 0
): FlattenedItem[] {
  const result: FlattenedItem[] = [];  // 結果配列
  let index = 0;  // グローバルインデックス

  function flatten(items: TreeItem[], parentId: IssueId | null, depth: number) {
    for (const item of items) {
      result.push({
        issue: item.issue,
        depth,
        index: index++,
        parentId,
        collapsed: item.collapsed,
        childCount: item.children.length,
      });

      // 折りたたまれていない場合のみ子を展開
      if (!item.collapsed && item.children.length > 0) {
        flatten(item.children, item.issue.id, depth + 1);
      }
    }
  }

  flatten(items, parentId, depth);
  return result;
}

/**
 * GitHub Issue 一覧 + 子 Issue マップからツリーを構築
 * rootIssues: 最上位の Issue（親を持たない Issue）
 * childrenMap: 親 Issue 番号 → 子 Issue 配列のマップ
 */
export function buildTree(
  rootIssues: GitHubIssue[],
  childrenMap: Map<number, GitHubIssue[]>,
  collapsedIds: Set<IssueId> = new Set()
): TreeItem[] {
  function buildNode(issue: GitHubIssue): TreeItem {
    const children = childrenMap.get(issue.number) ?? [];  // 子 Issue を取得
    return {
      issue,
      collapsed: collapsedIds.has(issue.id),  // 折りたたみ状態を復元
      children: children.map(buildNode),  // 再帰的に子ノードを構築
    };
  }

  return rootIssues.map(buildNode);
}

/** フラット配列から特定の Issue を ID で検索 */
export function findFlattenedItem(
  items: FlattenedItem[],
  issueId: IssueId
): FlattenedItem | undefined {
  return items.find((item) => item.issue.id === issueId);
}

/** ツリーから特定の Issue を ID で検索 */
export function findTreeItem(
  items: TreeItem[],
  issueId: IssueId
): TreeItem | undefined {
  for (const item of items) {
    if (item.issue.id === issueId) return item;
    const found = findTreeItem(item.children, issueId);
    if (found) return found;
  }
  return undefined;
}

/** Issue の祖先チェーンを取得（ズームパス用） */
export function getAncestors(
  flatItems: FlattenedItem[],
  issueId: IssueId
): FlattenedItem[] {
  const ancestors: FlattenedItem[] = [];  // 祖先リスト
  let current = flatItems.find((i) => i.issue.id === issueId);

  while (current?.parentId !== null && current?.parentId !== undefined) {
    const parent = flatItems.find((i) => i.issue.id === current!.parentId);
    if (!parent) break;
    ancestors.unshift(parent);  // 先頭に追加（ルートから順に）
    current = parent;
  }

  return ancestors;
}
