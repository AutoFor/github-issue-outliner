/** GitHub Issue の DB ID（Sub-Issues API で使用） */
export type IssueId = number;  // データベースID（numberプロパティとは異なる）

/** GitHub Issue の表示番号 */
export type IssueNumber = number;  // #123 のような表示番号

/** Issue の状態 */
export type IssueState = "open" | "closed";

/** GitHub Issue（アプリ内で使用する形式） */
export interface GitHubIssue {
  id: IssueId;  // DB ID（Sub-Issues API 用）
  number: IssueNumber;  // 表示番号（#123）
  title: string;  // Issue タイトル
  state: IssueState;  // open または closed
  body: string | null;  // 本文（マークダウン）
  labels: GitHubLabel[];  // ラベル一覧
  assignees: GitHubUser[];  // アサインされたユーザー
  user: GitHubUser | null;  // 作成者
  created_at: string;  // 作成日時
  updated_at: string;  // 更新日時
  html_url: string;  // GitHub 上の URL
  sub_issues_summary?: {  // 子 Issue のサマリー
    total: number;  // 子 Issue 総数
    completed: number;  // 完了した子 Issue 数
  };
}

/** GitHub ラベル */
export interface GitHubLabel {
  id: number;  // ラベル ID
  name: string;  // ラベル名
  color: string;  // カラーコード（# なし）
}

/** GitHub ユーザー */
export interface GitHubUser {
  login: string;  // ユーザー名
  avatar_url: string;  // アバター URL
}

/** GitHub リポジトリ（選択画面用） */
export interface GitHubRepo {
  id: number;  // リポジトリ ID
  name: string;  // リポジトリ名
  full_name: string;  // owner/repo 形式
  owner: GitHubUser;  // オーナー
  description: string | null;  // 説明
  private: boolean;  // プライベートかどうか
  open_issues_count: number;  // オープン Issue 数
  html_url: string;  // GitHub URL
  updated_at: string;  // 最終更新日時
}

/** Sub-Issue の関係（API レスポンス） */
export interface SubIssueRelation {
  id: IssueId;  // 子 Issue の DB ID
  number: IssueNumber;  // 子 Issue の番号
  title: string;  // 子 Issue のタイトル
  state: IssueState;  // 状態
}
