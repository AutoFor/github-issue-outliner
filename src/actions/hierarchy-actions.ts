"use server";  // Server Action

import { createOctokit } from "@/lib/github/client";  // Octokit 生成
import {
  addSubIssue,
  removeSubIssue,
  fetchSubIssues,
  reprioritizeSubIssue,
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
  issueId: IssueId,
  oldParentIssueNumber: number | null,
  newParentIssueNumber: number | null,
  afterId?: IssueId,
  beforeId?: IssueId
): Promise<void> {
  const octokit = await createOctokit();

  // 旧親から削除
  if (oldParentIssueNumber !== null) {
    await removeSubIssue(octokit, owner, repo, oldParentIssueNumber, issueId);
  }

  // 新親に追加
  if (newParentIssueNumber !== null) {
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
