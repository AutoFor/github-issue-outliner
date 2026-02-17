import { Octokit } from "@octokit/rest";  // GitHub REST API クライアント
import { isDevMode, getDevToken } from "@/lib/auth-mode";  // Dev モード判定

/** 認証済み Octokit インスタンスを生成 */
export async function createOctokit(): Promise<Octokit> {
  // Dev モード: 環境変数の PAT を直接使用
  if (isDevMode()) {
    return new Octokit({ auth: getDevToken() });
  }

  // Prod モード: Auth.js セッションからトークンを取得
  const { auth } = await import("@/auth");
  const session = await auth();

  if (!session?.accessToken) {
    throw new Error("認証されていません");
  }

  return new Octokit({ auth: session.accessToken });
}

/** クライアントサイド用: トークンを直接渡して Octokit を生成 */
export function createOctokitWithToken(token: string): Octokit {
  return new Octokit({ auth: token });
}
