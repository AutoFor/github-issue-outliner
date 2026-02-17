import { Octokit } from "@octokit/rest";  // GitHub REST API クライアント
import { auth } from "@/auth";  // セッション取得

/** 認証済み Octokit インスタンスを生成 */
export async function createOctokit(): Promise<Octokit> {
  const session = await auth();  // 現在のセッションを取得

  if (!session?.accessToken) {
    throw new Error("認証されていません");  // 未認証エラー
  }

  return new Octokit({
    auth: session.accessToken,  // GitHub アクセストークンで認証
  });
}

/** クライアントサイド用: トークンを直接渡して Octokit を生成 */
export function createOctokitWithToken(token: string): Octokit {
  return new Octokit({ auth: token });  // トークン指定で生成
}
