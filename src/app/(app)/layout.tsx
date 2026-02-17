import { redirect } from "next/navigation";  // リダイレクト
import { isDevMode } from "@/lib/auth-mode";  // Dev モード判定
import { Header } from "@/components/layout/Header";  // 共通ヘッダー
import type { Session } from "next-auth";  // セッション型

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session: Session | null = null;

  if (isDevMode()) {
    // Dev モード: ダミーセッションを生成（認証スキップ）
    session = {
      user: { name: "Dev User", email: "dev@localhost", image: "" },
      expires: "9999-12-31T23:59:59.999Z",
      accessToken: process.env.GITHUB_TOKEN!,
    };
  } else {
    // Prod モード: Auth.js セッションを取得
    const { auth } = await import("@/auth");
    session = await auth();
    if (!session) {
      redirect("/login");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header session={session!} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
