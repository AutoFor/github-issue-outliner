import NextAuth from "next-auth";  // Auth.js v5 をインポート
import GitHub from "next-auth/providers/github";  // GitHub OAuth プロバイダー

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      authorization: {
        params: {
          scope: "read:user repo",  // リポジトリ操作に必要なスコープ
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;  // GitHub アクセストークンを保存
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;  // セッションにトークンを公開
      return session;
    },
  },
  pages: {
    signIn: "/login",  // カスタムログインページ
  },
});
