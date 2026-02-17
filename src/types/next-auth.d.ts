import "next-auth";  // 型拡張のためインポート

declare module "next-auth" {
  interface Session {
    accessToken: string;  // GitHub API 用アクセストークン
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;  // JWT にアクセストークンを追加
  }
}
