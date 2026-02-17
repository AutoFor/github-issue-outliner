import { redirect } from "next/navigation";  // サーバーサイドリダイレクト
import { isDevMode } from "@/lib/auth-mode";  // Dev モード判定

export default async function Home() {
  // Dev モード: 常にリポジトリ選択へ
  if (isDevMode()) {
    redirect("/repos");
  }

  // Prod モード: セッションに応じてリダイレクト
  const { auth } = await import("@/auth");
  const session = await auth();

  if (session) {
    redirect("/repos");
  } else {
    redirect("/login");
  }
}
