import type { GitHubIssue, IssueId } from "@/lib/github/types";  // GitHub 型

/** ツリー構造のノード（再帰的） */
export interface TreeItem {
  issue: GitHubIssue;  // GitHub Issue データ
  children: TreeItem[];  // 子ノード
  collapsed: boolean;  // 折りたたみ状態
}

/** フラット化されたツリーアイテム（レンダリング用） */
export interface FlattenedItem {
  issue: GitHubIssue;  // GitHub Issue データ
  depth: number;  // インデント深さ（0〜7、最大8階層）
  index: number;  // フラットリスト内のインデックス
  parentId: IssueId | null;  // 親 Issue の DB ID
  collapsed: boolean;  // 折りたたみ状態
  childCount: number;  // 子 Issue の数
}

/** ドロップ位置の投影結果 */
export interface Projection {
  depth: number;  // ドロップ後の深さ
  parentId: IssueId | null;  // 新しい親 Issue の ID
  overId: IssueId;  // ドロップ先の Issue ID
  position: "before" | "after" | "child";  // 挿入位置
}

/** 最大階層数（GitHub Sub-Issues API の制限） */
export const MAX_DEPTH = 7;  // 0-indexed で 8 階層
