"use client";  // クライアントフック

import useSWR from "swr";  // データフェッチ + キャッシュ
import { getIssues } from "@/actions/issue-actions";  // Server Action
import type { GitHubIssue } from "@/lib/github/types";  // 型

/** Issue 一覧を SWR で取得するフック */
export function useIssues(owner: string, repo: string) {
  const { data, error, isLoading, mutate } = useSWR<GitHubIssue[]>(
    owner && repo ? `issues:${owner}/${repo}` : null,  // キャッシュキー
    () => getIssues(owner, repo),  // フェッチ関数
    {
      revalidateOnFocus: false,  // フォーカス時の再取得を無効化
      dedupingInterval: 5000,  // 5秒以内の重複リクエスト防止
    }
  );

  return {
    issues: data ?? [],  // デフォルト空配列
    error,
    isLoading,
    mutate,  // 手動再検証用
  };
}
