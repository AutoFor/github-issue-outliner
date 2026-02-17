"use client";  // クライアントフック

import useSWR from "swr";  // データフェッチ + キャッシュ
import { getSubIssues } from "@/actions/hierarchy-actions";  // Server Action
import type { GitHubIssue } from "@/lib/github/types";  // 型

/** 子 Issue 一覧を SWR で取得するフック */
export function useSubIssues(
  owner: string,
  repo: string,
  issueNumber: number | null
) {
  const { data, error, isLoading, mutate } = useSWR<GitHubIssue[]>(
    issueNumber !== null
      ? `sub-issues:${owner}/${repo}/${issueNumber}`  // キャッシュキー
      : null,  // issueNumber が null なら取得しない
    () => getSubIssues(owner, repo, issueNumber!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    subIssues: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
