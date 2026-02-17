"use client";  // クライアントフック

import { useCallback } from "react";  // コールバック最適化
import { useSWRConfig } from "swr";  // SWR グローバルミュータ
import { createNewIssue, updateExistingIssue } from "@/actions/issue-actions";  // Issue CRUD
import {
  addChildIssue,
  removeChildIssue,
  moveIssueToParent,
  reorderSubIssue,
} from "@/actions/hierarchy-actions";  // 階層操作
import type { GitHubIssue, IssueId, IssueNumber } from "@/lib/github/types";  // 型
import { toast } from "sonner";  // トースト通知

/** Issue 操作用ミューテーションフック */
export function useMutateIssue(owner: string, repo: string) {
  const { mutate } = useSWRConfig();  // グローバルミュータ

  /** 全 Issue キャッシュを再検証 */
  const revalidateAll = useCallback(() => {
    mutate((key: unknown) => typeof key === "string" && key.startsWith(`issues:${owner}/${repo}`), undefined, { revalidate: true });
    mutate((key: unknown) => typeof key === "string" && key.startsWith(`sub-issues:${owner}/${repo}`), undefined, { revalidate: true });
  }, [mutate, owner, repo]);

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
      oldParentNumber: number | null,
      newParentNumber: number | null,
      afterId?: IssueId,
      beforeId?: IssueId
    ) => {
      try {
        await moveIssueToParent(
          owner,
          repo,
          issueId,
          oldParentNumber,
          newParentNumber,
          afterId,
          beforeId
        );
        revalidateAll();
      } catch (error) {
        toast.error("階層の変更に失敗しました");
        console.error(error);
      }
    },
    [owner, repo, revalidateAll]
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
        await reorderSubIssue(
          owner,
          repo,
          parentIssueNumber,
          childIssueId,
          afterId,
          beforeId
        );
        revalidateAll();
      } catch (error) {
        toast.error("並び替えに失敗しました");
        console.error(error);
      }
    },
    [owner, repo, revalidateAll]
  );

  return { create, updateTitle, toggleState, moveToParent, reorder, revalidateAll };
}
