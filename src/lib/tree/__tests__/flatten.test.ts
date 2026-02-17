import { describe, it, expect } from "vitest";  // テストフレームワーク
import { flattenTree, buildTree, findTreeItem, getAncestors } from "../flatten";  // テスト対象
import type { TreeItem, FlattenedItem } from "../types";  // 型
import type { GitHubIssue } from "@/lib/github/types";

/** テスト用 Issue ファクトリ */
function makeIssue(id: number, number: number, title: string): GitHubIssue {
  return {
    id,
    number,
    title,
    state: "open",
    body: null,
    labels: [],
    assignees: [],
    user: null,
    created_at: "",
    updated_at: "",
    html_url: "",
  };
}

describe("flattenTree", () => {
  it("空のツリーで空配列を返す", () => {
    expect(flattenTree([])).toEqual([]);
  });

  it("フラットなリストを正しくフラット化する", () => {
    const tree: TreeItem[] = [
      { issue: makeIssue(1, 1, "Issue 1"), children: [], collapsed: false },
      { issue: makeIssue(2, 2, "Issue 2"), children: [], collapsed: false },
    ];

    const result = flattenTree(tree);

    expect(result).toHaveLength(2);
    expect(result[0].depth).toBe(0);
    expect(result[0].parentId).toBeNull();
    expect(result[1].index).toBe(1);
  });

  it("ネストされたツリーを正しくフラット化する", () => {
    const tree: TreeItem[] = [
      {
        issue: makeIssue(1, 1, "Parent"),
        collapsed: false,
        children: [
          {
            issue: makeIssue(2, 2, "Child"),
            collapsed: false,
            children: [
              { issue: makeIssue(3, 3, "Grandchild"), children: [], collapsed: false },
            ],
          },
        ],
      },
    ];

    const result = flattenTree(tree);

    expect(result).toHaveLength(3);
    expect(result[0].depth).toBe(0);  // Parent
    expect(result[1].depth).toBe(1);  // Child
    expect(result[1].parentId).toBe(1);
    expect(result[2].depth).toBe(2);  // Grandchild
    expect(result[2].parentId).toBe(2);
  });

  it("折りたたまれたノードの子をスキップする", () => {
    const tree: TreeItem[] = [
      {
        issue: makeIssue(1, 1, "Parent"),
        collapsed: true,  // 折りたたみ
        children: [
          { issue: makeIssue(2, 2, "Hidden Child"), children: [], collapsed: false },
        ],
      },
    ];

    const result = flattenTree(tree);

    expect(result).toHaveLength(1);  // 子はスキップ
    expect(result[0].childCount).toBe(1);  // 子の数は保持
  });
});

describe("buildTree", () => {
  it("ルート Issue のみのツリーを構築する", () => {
    const roots = [makeIssue(1, 1, "Root 1"), makeIssue(2, 2, "Root 2")];
    const childrenMap = new Map();

    const tree = buildTree(roots, childrenMap);

    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(0);
  });

  it("親子関係のあるツリーを構築する", () => {
    const roots = [makeIssue(1, 1, "Root")];
    const childrenMap = new Map([[1, [makeIssue(2, 2, "Child")]]]);

    const tree = buildTree(roots, childrenMap);

    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].issue.title).toBe("Child");
  });

  it("折りたたみ状態を復元する", () => {
    const roots = [makeIssue(1, 1, "Root")];
    const childrenMap = new Map();
    const collapsedIds = new Set([1]);

    const tree = buildTree(roots, childrenMap, collapsedIds);

    expect(tree[0].collapsed).toBe(true);
  });
});

describe("findTreeItem", () => {
  it("ネストされたアイテムを検索できる", () => {
    const tree: TreeItem[] = [
      {
        issue: makeIssue(1, 1, "Parent"),
        collapsed: false,
        children: [
          { issue: makeIssue(2, 2, "Child"), children: [], collapsed: false },
        ],
      },
    ];

    const found = findTreeItem(tree, 2);
    expect(found?.issue.title).toBe("Child");
  });

  it("存在しない ID で undefined を返す", () => {
    expect(findTreeItem([], 999)).toBeUndefined();
  });
});

describe("getAncestors", () => {
  it("祖先チェーンを正しく取得する", () => {
    const flat: FlattenedItem[] = [
      { issue: makeIssue(1, 1, "Root"), depth: 0, index: 0, parentId: null, collapsed: false, childCount: 1 },
      { issue: makeIssue(2, 2, "Child"), depth: 1, index: 1, parentId: 1, collapsed: false, childCount: 1 },
      { issue: makeIssue(3, 3, "Grandchild"), depth: 2, index: 2, parentId: 2, collapsed: false, childCount: 0 },
    ];

    const ancestors = getAncestors(flat, 3);

    expect(ancestors).toHaveLength(2);
    expect(ancestors[0].issue.title).toBe("Root");
    expect(ancestors[1].issue.title).toBe("Child");
  });
});
