export { auth as middleware } from "@/auth";  // Auth.js ミドルウェアをエクスポート

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",  // 認証不要パスを除外
  ],
};
