import { describe, it, expect } from "vitest";  // テストフレームワーク
import { getIndentTarget, getOutdentTarget, getSwapTarget } from "../operations";  // テスト対象
import type { FlattenedItem } from "../types";  // 型
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

/** テスト用フラットアイテム */
function makeFlat(
  id: number,
  number: number,
  depth: number,
  parentId: number | null
): FlattenedItem {
  return {
    issue: makeIssue(id, number, `Issue ${number}`),
    depth,
    index: 0,
    parentId,
    collapsed: false,
    childCount: 0,
  };
}

describe("getIndentTarget", () => {
  it("前の兄弟を親として返す", () => {
    const items: FlattenedItem[] = [
      makeFlat(1, 1, 0, null),
      makeFlat(2, 2, 0, null),
    ];

    const result = getIndentTarget(items, 2);

    expect(result).not.toBeNull();
    expect(result!.newParentId).toBe(1);  // Issue 1 が新しい親
    expect(result!.oldParentId).toBeNull();  // 元は親なし
  });

  it("最初のアイテムはインデント不可", () => {
    const items: FlattenedItem[] = [makeFlat(1, 1, 0, null)];
    expect(getIndentTarget(items, 1)).toBeNull();
  });

  it("最大深さに達している場合はインデント不可", () => {
    const items: FlattenedItem[] = [
      makeFlat(1, 1, 6, null),
      makeFlat(2, 2, 7, 1),  // depth 7 = MAX_DEPTH
    ];
    expect(getIndentTarget(items, 2)).toBeNull();
  });
});

describe("getOutdentTarget", () => {
  it("祖父母を新しい親として返す", () => {
    const items: FlattenedItem[] = [
      makeFlat(1, 1, 0, null),
      makeFlat(2, 2, 1, 1),
    ];

    const result = getOutdentTarget(items, 2);

    expect(result).not.toBeNull();
    expect(result!.newParentId).toBeNull();  // ルートに移動
    expect(result!.oldParentId).toBe(1);
  });

  it("ルートレベルはアウトデント不可", () => {
    const items: FlattenedItem[] = [makeFlat(1, 1, 0, null)];
    expect(getOutdentTarget(items, 1)).toBeNull();
  });
});

describe("getSwapTarget", () => {
  it("上方向で前の兄弟を返す", () => {
    const items: FlattenedItem[] = [
      makeFlat(1, 1, 0, null),
      makeFlat(2, 2, 0, null),
    ];

    const target = getSwapTarget(items, 2, "up");
    expect(target?.issue.id).toBe(1);
  });

  it("下方向で次の兄弟を返す", () => {
    const items: FlattenedItem[] = [
      makeFlat(1, 1, 0, null),
      makeFlat(2, 2, 0, null),
    ];

    const target = getSwapTarget(items, 1, "down");
    expect(target?.issue.id).toBe(2);
  });

  it("兄弟がいない場合は null を返す", () => {
    const items: FlattenedItem[] = [makeFlat(1, 1, 0, null)];
    expect(getSwapTarget(items, 1, "up")).toBeNull();
    expect(getSwapTarget(items, 1, "down")).toBeNull();
  });
});
