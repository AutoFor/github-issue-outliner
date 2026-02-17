import { Octokit } from "@octokit/rest";  // Octokit 型
import type { GitHubIssue, GitHubRepo, IssueNumber } from "./types";  // 型インポート

/** リポジトリ一覧を取得（認証ユーザーがアクセス可能なもの） */
export async function fetchRepos(octokit: Octokit): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];  // 結果を格納
  let page = 1;  // ページネーション

  while (true) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",  // 更新日順
      per_page: 100,  // 1ページ100件
      page,
      type: "all",  // すべての種別
    });

    if (data.length === 0) break;  // データがなければ終了

    repos.push(
      ...data
        .filter((r) => r.has_issues)  // Issues が有効なリポジトリのみ
        .map((r) => ({
          id: r.id,
          name: r.name,
          full_name: r.full_name,
          owner: { login: r.owner.login, avatar_url: r.owner.avatar_url },
          description: r.description,
          private: r.private,
          open_issues_count: r.open_issues_count,
          html_url: r.html_url,
          updated_at: r.updated_at ?? "",
        }))
    );

    if (data.length < 100) break;  // 最後のページ
    page++;
  }

  return repos;
}

/** リポジトリの Issue 一覧を取得 */
export async function fetchIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];  // 結果を格納
  let page = 1;

  while (true) {
    const { data } = await octokit.issues.listForRepo({
      owner,
      repo,
      state,
      per_page: 100,  // 最大100件/ページ
      page,
    });

    if (data.length === 0) break;

    issues.push(
      ...data
        .filter((i) => !i.pull_request)  // PR を除外
        .map(mapIssue)
    );

    if (data.length < 100) break;
    page++;
  }

  return issues;
}

/** 単一 Issue を取得 */
export async function fetchIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: IssueNumber
): Promise<GitHubIssue> {
  const { data } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  return mapIssue(data);
}

/** Issue を作成 */
export async function createIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body?: string
): Promise<GitHubIssue> {
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
  });

  return mapIssue(data);
}

/** Issue タイトルを更新 */
export async function updateIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: IssueNumber,
  updates: { title?: string; state?: "open" | "closed"; body?: string }
): Promise<GitHubIssue> {
  const { data } = await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    ...updates,
  });

  return mapIssue(data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapIssue(data: any): GitHubIssue {
  return {
    id: data.id,
    number: data.number,
    title: data.title,
    state: data.state as "open" | "closed",
    body: data.body ?? null,
    labels: (data.labels ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((l: any) => typeof l === "object")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((l: any) => ({
        id: l.id,
        name: l.name,
        color: l.color,
      })),
    assignees: (data.assignees ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => ({
        login: a.login,
        avatar_url: a.avatar_url,
      })),
    user: data.user
      ? { login: data.user.login, avatar_url: data.user.avatar_url }
      : null,
    created_at: data.created_at,
    updated_at: data.updated_at,
    html_url: data.html_url,
    sub_issues_summary: data.sub_issues_summary,
  };
}
