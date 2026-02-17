import { Octokit } from "@octokit/rest";  // Octokit 型
import type { GitHubIssue, IssueId } from "./types";  // 型インポート

/**
 * Sub-Issues API: 子 Issue 一覧を取得
 * GitHub Sub-Issues API は Issue の DB ID を使用する（number ではない）
 */
export async function fetchSubIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];  // 結果を格納
  let page = 1;

  while (true) {
    // Sub-Issues API（REST エンドポイント）
    const { data } = await octokit.request(
      "GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues",
      {
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100,  // 最大100件/ページ
        page,
      }
    );

    if (!Array.isArray(data) || data.length === 0) break;

    issues.push(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...data.map((item: any) => ({
        id: item.id as IssueId,
        number: item.number,
        title: item.title,
        state: item.state as "open" | "closed",
        body: item.body ?? null,
        labels: (item.labels ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((l: any) => typeof l === "object")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((l: any) => ({ id: l.id, name: l.name, color: l.color })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assignees: (item.assignees ?? []).map((a: any) => ({
          login: a.login,
          avatar_url: a.avatar_url,
        })),
        user: item.user
          ? { login: item.user.login, avatar_url: item.user.avatar_url }
          : null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        html_url: item.html_url,
        sub_issues_summary: item.sub_issues_summary,
      }))
    );

    if (data.length < 100) break;
    page++;
  }

  return issues;
}

/** Sub-Issues API: 子 Issue を追加 */
export async function addSubIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  parentIssueNumber: number,
  childIssueId: IssueId
): Promise<void> {
  await octokit.request(
    "POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues",
    {
      owner,
      repo,
      issue_number: parentIssueNumber,
      sub_issue_id: childIssueId,  // DB ID を指定
    }
  );
}

/** Sub-Issues API: 子 Issue を削除（親子関係の解除） */
export async function removeSubIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  parentIssueNumber: number,
  childIssueId: IssueId
): Promise<void> {
  await octokit.request(
    "DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issues",
    {
      owner,
      repo,
      issue_number: parentIssueNumber,
      sub_issue_id: childIssueId,  // 解除する子 Issue の DB ID
    }
  );
}

/** Sub-Issues API: 子 Issue の並び順を変更 */
export async function reprioritizeSubIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  parentIssueNumber: number,
  childIssueId: IssueId,
  afterId?: IssueId,
  beforeId?: IssueId
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    sub_issue_id: childIssueId,  // 移動する子 Issue
  };

  if (afterId !== undefined) body.after_id = afterId;  // この Issue の後に配置
  if (beforeId !== undefined) body.before_id = beforeId;  // この Issue の前に配置

  await octokit.request(
    "PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority",
    {
      owner,
      repo,
      issue_number: parentIssueNumber,
      ...body,
    }
  );
}
