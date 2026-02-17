import { redirect } from "next/navigation";  // サーバーサイドリダイレクト
import { auth } from "@/auth";  // セッション取得

export default async function Home() {
  const session = await auth();  // 現在のセッションを確認

  if (session) {
    redirect("/repos");  // ログイン済み → リポジトリ選択へ
  } else {
    redirect("/login");  // 未ログイン → ログインページへ
  }
}
