import { NextResponse } from "next/server";  // レスポンス
import type { NextRequest } from "next/server";  // リクエスト型

export async function middleware(request: NextRequest) {
  // Dev モード: GITHUB_TOKEN があれば認証チェックをスキップ
  if (process.env.GITHUB_TOKEN) {
    return NextResponse.next();
  }

  // Prod モード: Auth.js ミドルウェアで認証チェック
  const { auth } = await import("@/auth");
  // @ts-expect-error auth middleware signature
  return auth(request);
}

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",  // 認証不要パスを除外
  ],
};
