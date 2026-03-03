"use server";  // Server Action

import { createOctokit } from "@/lib/github/client";  // Octokit 生成
import {
  addSubIssue,
  removeSubIssue,
  fetchSubIssues,
  reprioritizeSubIssue,
  fetchParentIssueNumber,
} from "@/lib/github/sub-issues";  // Sub-Issue 操作
import type { GitHubIssue, IssueId } from "@/lib/github/types";  // 型

/** 子 Issue 一覧を取得する Server Action */
export async function getSubIssues(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssue[]> {
  const octokit = await createOctokit();
  return fetchSubIssues(octokit, owner, repo, issueNumber);
}

/** 子 Issue を追加する Server Action */
export async function addChildIssue(
  owner: string,
  repo: string,
  parentIssueNumber: number,
  childIssueId: IssueId
): Promise<void> {
  const octokit = await createOctokit();
  await addSubIssue(octokit, owner, repo, parentIssueNumber, childIssueId);
}

/** 子 Issue を削除（親子関係の解除）する Server Action */
export async function removeChildIssue(
  owner: string,
  repo: string,
  parentIssueNumber: number,
  childIssueId: IssueId
): Promise<void> {
  const octokit = await createOctokit();
  await removeSubIssue(octokit, owner, repo, parentIssueNumber, childIssueId);
}

/** 子 Issue の並び順を変更する Server Action */
export async function reorderSubIssue(
  owner: string,
  repo: string,
  parentIssueNumber: number,
  childIssueId: IssueId,
  afterId?: IssueId,
  beforeId?: IssueId
): Promise<void> {
  const octokit = await createOctokit();
  await reprioritizeSubIssue(
    octokit,
    owner,
    repo,
    parentIssueNumber,
    childIssueId,
    afterId,
    beforeId
  );
}

/** Issue の親を変更する Server Action（outdent/indent 用） */
export async function moveIssueToParent(
  owner: string,
  repo: string,
  issueNumber: number,
  issueId: IssueId,
  oldParentIssueNumber: number | null,
  newParentIssueNumber: number | null,
  afterId?: IssueId,
  beforeId?: IssueId
): Promise<void> {
  const octokit = await createOctokit();
  const actualParentNumber = await fetchParentIssueNumber(
    octokit,
    owner,
    repo,
    issueNumber
  );

  // 旧親から削除（実親を優先。取得不可時のみ oldParent をフォールバック）
  const parentToDetach =
    actualParentNumber ?? oldParentIssueNumber;

  if (
    parentToDetach !== null &&
    (newParentIssueNumber === null || parentToDetach !== newParentIssueNumber)
  ) {
    try {
      await removeSubIssue(octokit, owner, repo, parentToDetach, issueId);
    } catch (error) {
      // 連続操作の圧縮時は既に外れている場合があるため 404 は許容
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any)?.status;
      if (status !== 404) throw error;
    }
  }

  // 新親に追加
  if (newParentIssueNumber !== null && actualParentNumber !== newParentIssueNumber) {
    await addSubIssue(octokit, owner, repo, newParentIssueNumber, issueId);

    // 位置指定がある場合は並び替え
    if (afterId !== undefined || beforeId !== undefined) {
      await reprioritizeSubIssue(
        octokit,
        owner,
        repo,
        newParentIssueNumber,
        issueId,
        afterId,
        beforeId
      );
    }
  }
}
