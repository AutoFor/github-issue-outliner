import { redirect } from "next/navigation";  // リダイレクト
import { auth } from "@/auth";  // 認証チェック
import { Header } from "@/components/layout/Header";  // 共通ヘッダー

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();  // セッション取得

  if (!session) {
    redirect("/login");  // 未認証ならログインへ
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header session={session} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
