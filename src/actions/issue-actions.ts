"use server";  // Server Action

import { createOctokit } from "@/lib/github/client";  // Octokit 生成
import { createIssue, updateIssue, fetchIssues, fetchRepos } from "@/lib/github/issues";  // Issue 操作
import type { GitHubIssue, GitHubRepo, IssueNumber } from "@/lib/github/types";  // 型

/** リポジトリ一覧を取得する Server Action */
export async function getRepos(): Promise<GitHubRepo[]> {
  const octokit = await createOctokit();  // 認証済みクライアント
  return fetchRepos(octokit);
}

/** Issue 一覧を取得する Server Action */
export async function getIssues(
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubIssue[]> {
  const octokit = await createOctokit();
  return fetchIssues(octokit, owner, repo, state);
}

/** Issue を作成する Server Action */
export async function createNewIssue(
  owner: string,
  repo: string,
  title: string,
  body?: string
): Promise<GitHubIssue> {
  const octokit = await createOctokit();
  return createIssue(octokit, owner, repo, title, body);
}

/** Issue を更新する Server Action */
export async function updateExistingIssue(
  owner: string,
  repo: string,
  issueNumber: IssueNumber,
  updates: { title?: string; state?: "open" | "closed"; body?: string }
): Promise<GitHubIssue> {
  const octokit = await createOctokit();
  return updateIssue(octokit, owner, repo, issueNumber, updates);
}
