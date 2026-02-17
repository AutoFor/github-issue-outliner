"use client";  // クライアントコンポーネント

import { Session } from "next-auth";  // セッション型
import { signOut } from "next-auth/react";  // クライアントサイドサインアウト
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";  // アバター
import { Button } from "@/components/ui/button";  // ボタン
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";  // ドロップダウン
import { GitBranch, LogOut } from "lucide-react";  // アイコン
import Link from "next/link";  // ルーティング

export function Header({ session }: { session: Session }) {
  const user = session.user;  // ユーザー情報

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* ロゴ + アプリ名 */}
        <Link href="/repos" className="flex items-center gap-2 font-semibold">
          <GitBranch className="h-5 w-5" />
          <span>Issue Outliner</span>
        </Link>

        {/* ユーザーメニュー */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
