"use client";  // クライアントフック

import { useCallback, useRef } from "react";  // コールバック最適化
import { useSWRConfig } from "swr";  // SWR グローバルミュータ
import { createNewIssue, updateExistingIssue } from "@/actions/issue-actions";  // Issue CRUD
import {
  addChildIssue,
  moveIssueToParent,
  reorderSubIssue,
} from "@/actions/hierarchy-actions";  // 階層操作
import type { GitHubIssue, IssueId, IssueNumber } from "@/lib/github/types";  // 型
import type { TreeItem } from "@/lib/tree/types";  // ツリー型
import { useTreeStore } from "@/stores/tree-store";  // ツリーストア
import { toast } from "sonner";  // トースト通知

function insertByAnchor(
  items: TreeItem[],
  node: TreeItem,
  afterId?: IssueId,
  beforeId?: IssueId
): TreeItem[] {
  const next = [...items];

  if (beforeId !== undefined) {
    const index = next.findIndex((item) => item.issue.id === beforeId);
    if (index >= 0) {
      next.splice(index, 0, node);
      return next;
    }
  }

  if (afterId !== undefined) {
    const index = next.findIndex((item) => item.issue.id === afterId);
    if (index >= 0) {
      next.splice(index + 1, 0, node);
      return next;
    }
  }

  next.push(node);
  return next;
}

function detachNode(
  items: TreeItem[],
  issueId: IssueId
): { items: TreeItem[]; node: TreeItem | null } {
  let removed: TreeItem | null = null;

  const next = items
    .map((item) => {
      if (item.issue.id === issueId) {
        removed = item;
        return null;
      }

      const detached = detachNode(item.children, issueId);
      if (detached.node) {
        removed = detached.node;
        return { ...item, children: detached.items };
      }

      return item;
    })
    .filter((item): item is TreeItem => item !== null);

  return { items: next, node: removed };
}

function insertIntoParentByNumber(
  items: TreeItem[],
  parentIssueNumber: number,
  node: TreeItem,
  afterId?: IssueId,
  beforeId?: IssueId
): { items: TreeItem[]; inserted: boolean } {
  let inserted = false;

  const next = items.map((item) => {
    if (item.issue.number === parentIssueNumber) {
      inserted = true;
      return {
        ...item,
        children: insertByAnchor(item.children, node, afterId, beforeId),
      };
    }

    const nested = insertIntoParentByNumber(
      item.children,
      parentIssueNumber,
      node,
      afterId,
      beforeId
    );
    if (nested.inserted) {
      inserted = true;
      return { ...item, children: nested.items };
    }

    return item;
  });

  return { items: next, inserted };
}

type PendingHierarchyOp =
  | {
      type: "move";
      issueId: IssueId;
      issueNumber: IssueNumber;
      oldParentNumber: number | null;
      newParentNumber: number | null;
      afterId?: IssueId;
      beforeId?: IssueId;
    }
  | {
      type: "reorder";
      parentIssueNumber: number;
      childIssueId: IssueId;
      afterId?: IssueId;
      beforeId?: IssueId;
    };

/** Issue 操作用ミューテーションフック */
export function useMutateIssue(owner: string, repo: string) {
  const { mutate } = useSWRConfig();  // グローバルミュータ
  const pendingHierarchyOpsRef = useRef<Map<IssueId, PendingHierarchyOp>>(new Map());
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);

  /** 全 Issue キャッシュを再検証 */
  const revalidateAll = useCallback(() => {
    mutate((key: unknown) => typeof key === "string" && key.startsWith(`issues:${owner}/${repo}`), undefined, { revalidate: true });
    mutate((key: unknown) => typeof key === "string" && key.startsWith(`sub-issues:${owner}/${repo}`), undefined, { revalidate: true });
  }, [mutate, owner, repo]);

  /** ローカルツリーを移動結果で更新（再取得なし） */
  const applyLocalMove = useCallback(
    (
      issueId: IssueId,
      newParentNumber: number | null,
      afterId?: IssueId,
      beforeId?: IssueId
    ) => {
      const { tree, setTree } = useTreeStore.getState();
      const detached = detachNode(tree, issueId);
      if (!detached.node) return;

      if (newParentNumber === null) {
        setTree(insertByAnchor(detached.items, detached.node, afterId, beforeId));
        return;
      }

      const inserted = insertIntoParentByNumber(
        detached.items,
        newParentNumber,
        detached.node,
        afterId,
        beforeId
      );
      setTree(inserted.inserted ? inserted.items : detached.items);
    },
    []
  );

  /** 階層変更のサーバー同期（キューは issue 単位で最新状態に圧縮） */
  const flushHierarchyQueue = useCallback(async () => {
    if (isSyncingRef.current) return;
    if (pendingHierarchyOpsRef.current.size === 0) return;

    isSyncingRef.current = true;
    const batch = Array.from(pendingHierarchyOpsRef.current.values());
    pendingHierarchyOpsRef.current.clear();

    try {
      for (const op of batch) {
        if (op.type === "move") {
          await moveIssueToParent(
            owner,
            repo,
            op.issueNumber,
            op.issueId,
            op.oldParentNumber,
            op.newParentNumber,
            op.afterId,
            op.beforeId
          );
        } else {
          await reorderSubIssue(
            owner,
            repo,
            op.parentIssueNumber,
            op.childIssueId,
            op.afterId,
            op.beforeId
          );
        }
      }
    } catch (error) {
      toast.error("同期に失敗しました。更新を押して再同期してください");
      console.error(error);
      revalidateAll();
    } finally {
      isSyncingRef.current = false;
      if (pendingHierarchyOpsRef.current.size > 0) {
        void flushHierarchyQueue();
      }
    }
  }, [owner, repo, revalidateAll]);

  /** 階層変更をキューに積み、短時間で圧縮して同期 */
  const enqueueHierarchyOp = useCallback(
    (op: PendingHierarchyOp) => {
      const key = op.type === "move" ? op.issueId : op.childIssueId;
      const prev = pendingHierarchyOpsRef.current.get(key);

      if (!prev) {
        pendingHierarchyOpsRef.current.set(key, op);
      } else if (prev.type === "move" && op.type === "move") {
        // 連続 move は「最初の oldParent」と「最後の行き先」を合成
        pendingHierarchyOpsRef.current.set(key, {
          ...op,
          oldParentNumber: prev.oldParentNumber,
        });
      } else if (prev.type === "move" && op.type === "reorder") {
        // move 後の reorder は move の最終配置として吸収
        pendingHierarchyOpsRef.current.set(key, {
          type: "move",
          issueId: prev.issueId,
          issueNumber: prev.issueNumber,
          oldParentNumber: prev.oldParentNumber,
          newParentNumber: op.parentIssueNumber,
          afterId: op.afterId,
          beforeId: op.beforeId,
        });
      } else {
        // reorder -> move, reorder -> reorder は新しい操作を優先
        pendingHierarchyOpsRef.current.set(key, op);
      }

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        void flushHierarchyQueue();
      }, 250);
    },
    [flushHierarchyQueue]
  );

  /** Issue を作成 */
  const create = useCallback(
    async (title: string, parentIssueNumber?: number): Promise<GitHubIssue | null> => {
      try {
        const issue = await createNewIssue(owner, repo, title);  // Issue 作成

        // 親が指定されている場合は子として追加
        if (parentIssueNumber) {
          await addChildIssue(owner, repo, parentIssueNumber, issue.id);
        }

        revalidateAll();  // キャッシュ再検証
        return issue;
      } catch (error) {
        toast.error("Issue の作成に失敗しました");  // エラー通知
        console.error(error);
        return null;
      }
    },
    [owner, repo, revalidateAll]
  );

  /** Issue タイトルを更新 */
  const updateTitle = useCallback(
    async (issueNumber: IssueNumber, title: string) => {
      try {
        await updateExistingIssue(owner, repo, issueNumber, { title });
        revalidateAll();
      } catch (error) {
        toast.error("タイトルの更新に失敗しました");
        console.error(error);
      }
    },
    [owner, repo, revalidateAll]
  );

  /** Issue の状態を切り替え（open ↔ closed） */
  const toggleState = useCallback(
    async (issueNumber: IssueNumber, currentState: "open" | "closed") => {
      const newState = currentState === "open" ? "closed" : "open";
      try {
        await updateExistingIssue(owner, repo, issueNumber, { state: newState });
        revalidateAll();
        toast.success(newState === "closed" ? "Issue をクローズしました" : "Issue を再オープンしました");
      } catch (error) {
        toast.error("状態の変更に失敗しました");
        console.error(error);
      }
    },
    [owner, repo, revalidateAll]
  );

  /** Issue の親を変更（indent/outdent/ドラッグ） */
  const moveToParent = useCallback(
    async (
      issueId: IssueId,
      issueNumber: IssueNumber,
      oldParentNumber: number | null,
      newParentNumber: number | null,
      afterId?: IssueId,
      beforeId?: IssueId
    ) => {
      try {
        // 体感速度優先: 先にローカル反映
        applyLocalMove(issueId, newParentNumber, afterId, beforeId);
        enqueueHierarchyOp({
          type: "move",
          issueId,
          issueNumber,
          oldParentNumber,
          newParentNumber,
          afterId,
          beforeId,
        });
      } catch (error) {
        toast.error("階層の変更に失敗しました");
        console.error(error);
      }
    },
    [applyLocalMove, enqueueHierarchyOp]
  );

  /** 同一親内で並び替え */
  const reorder = useCallback(
    async (
      parentIssueNumber: number,
      childIssueId: IssueId,
      afterId?: IssueId,
      beforeId?: IssueId
    ) => {
      try {
        // 体感速度優先: 先にローカル反映
        applyLocalMove(childIssueId, parentIssueNumber, afterId, beforeId);
        enqueueHierarchyOp({
          type: "reorder",
          parentIssueNumber,
          childIssueId,
          afterId,
          beforeId,
        });
      } catch (error) {
        toast.error("並び替えに失敗しました");
        console.error(error);
      }
    },
    [applyLocalMove, enqueueHierarchyOp]
  );

  return { create, updateTitle, toggleState, moveToParent, reorder, revalidateAll };
}
