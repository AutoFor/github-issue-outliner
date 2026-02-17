"use client";  // クライアントコンポーネント

import Link from "next/link";  // ルーティング
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";  // アバター
import { Badge } from "@/components/ui/badge";  // バッジ
import { Input } from "@/components/ui/input";  // 検索フィールド
import type { GitHubRepo } from "@/lib/github/types";  // 型
import { Lock, Search } from "lucide-react";  // アイコン
import { useState, useMemo } from "react";  // React フック

export function RepoList({ repos }: { repos: GitHubRepo[] }) {
  const [filter, setFilter] = useState("");  // 検索フィルター

  /** フィルター適用済みリポジトリ */
  const filtered = useMemo(
    () =>
      repos.filter(
        (r) =>
          r.full_name.toLowerCase().includes(filter.toLowerCase()) ||
          r.description?.toLowerCase().includes(filter.toLowerCase())
      ),
    [repos, filter]
  );

  return (
    <div>
      {/* 検索バー */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="リポジトリを検索..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* リポジトリ一覧 */}
      <div className="space-y-2">
        {filtered.map((repo) => (
          <Link
            key={repo.id}
            href={`/${repo.owner.login}/${repo.name}`}
            className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={repo.owner.avatar_url} alt={repo.owner.login} />
              <AvatarFallback>{repo.owner.login.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{repo.full_name}</span>
                {repo.private && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              {repo.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {repo.description}
                </p>
              )}
            </div>

            <Badge variant="secondary">
              {repo.open_issues_count} issues
            </Badge>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            リポジトリが見つかりません
          </p>
        )}
      </div>
    </div>
  );
}
