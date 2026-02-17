"use client";  // クライアントコンポーネント

import { useEffect, useCallback, useRef } from "react";  // React フック
import { useIssues } from "@/hooks/useIssues";  // Issue 取得
import { useSubIssues } from "@/hooks/useSubIssues";  // 子 Issue 取得
import { useMutateIssue } from "@/hooks/useMutateIssue";  // Issue 操作
import { useTreeStore } from "@/stores/tree-store";  // ツリー状態
import { useUIStore } from "@/stores/ui-store";  // UI 状態
import { buildTree } from "@/lib/tree/flatten";  // ツリー構築
import { useKeyboardShortcuts } from "@/lib/keyboard/useKeyboardShortcuts";  // キーボードショートカット
import { OutlinerItem } from "./OutlinerItem";  // ノードコンポーネント
import { Breadcrumb } from "./Breadcrumb";  // ブレッドクラム
import { SortableTree } from "./SortableTree";  // DnD ラッパー
import { Skeleton } from "@/components/ui/skeleton";  // スケルトン
import { Button } from "@/components/ui/button";  // ボタン
import { Plus, Eye, EyeOff, ExternalLink } from "lucide-react";  // アイコン
import type { GitHubIssue, IssueId } from "@/lib/github/types";  // 型
import Link from "next/link";  // ルーティング

interface Props {
  owner: string;  // リポジトリオーナー
  repo: string;  // リポジトリ名
  accessToken: string;  // GitHub トークン
}

export function OutlinerRoot({ owner, repo }: Props) {
  const { issues, isLoading, mutate: mutateIssues } = useIssues(owner, repo);  // Issue 取得
  const {
    tree,
    flatItems,
    collapsedIds,
    zoomId,
    setTree,
    setZoomId,
  } = useTreeStore();  // ツリー状態
  const { showClosedIssues, toggleShowClosedIssues } = useUIStore();  // UI 状態
  const { create, updateTitle, toggleState, moveToParent, reorder, revalidateAll } =
    useMutateIssue(owner, repo);  // ミューテーション

  // 子 Issue マップを構築するための状態
  const childrenMapRef = useRef<Map<number, GitHubIssue[]>>(new Map());
  const loadedParentsRef = useRef<Set<number>>(new Set());

  /** Issue リストからツリーを構築 */
  const rebuildTree = useCallback(() => {
    if (issues.length === 0) return;

    // ルート Issue（sub_issues_summary を持つが、どの子にも含まれていないもの）を特定
    const childIds = new Set<number>();
    for (const children of childrenMapRef.current.values()) {
      for (const child of children) {
        childIds.add(child.id);
      }
    }

    const rootIssues = issues.filter((i) => !childIds.has(i.id));
    const builtTree = buildTree(rootIssues, childrenMapRef.current, collapsedIds);
    setTree(builtTree);
  }, [issues, collapsedIds, setTree]);

  // Issue 一覧が変更されたらツリーを再構築
  useEffect(() => {
    rebuildTree();
  }, [rebuildTree]);

  /** 子 Issue を遅延ロード */
  const loadSubIssues = useCallback(
    async (issueNumber: number) => {
      if (loadedParentsRef.current.has(issueNumber)) return;  // ロード済み
      loadedParentsRef.current.add(issueNumber);

      try {
        const { getSubIssues } = await import("@/actions/hierarchy-actions");
        const subIssues = await getSubIssues(owner, repo, issueNumber);
        if (subIssues.length > 0) {
          childrenMapRef.current.set(issueNumber, subIssues);

          // 子 Issue のさらに子もロード
          for (const sub of subIssues) {
            if (sub.sub_issues_summary && sub.sub_issues_summary.total > 0) {
              await loadSubIssues(sub.number);
            }
          }

          rebuildTree();
        }
      } catch (error) {
        console.error(`Failed to load sub-issues for #${issueNumber}:`, error);
      }
    },
    [owner, repo, rebuildTree]
  );

  // sub_issues_summary がある Issue の子を自動ロード
  useEffect(() => {
    for (const issue of issues) {
      if (issue.sub_issues_summary && issue.sub_issues_summary.total > 0) {
        loadSubIssues(issue.number);
      }
    }
  }, [issues, loadSubIssues]);

  // キーボードショートカットを登録
  useKeyboardShortcuts({
    owner,
    repo,
    flatItems,
    create,
    updateTitle,
    toggleState,
    moveToParent,
    reorder,
  });

  /** 新規ルート Issue を作成 */
  const handleCreateRoot = useCallback(async () => {
    const issue = await create("新しい Issue");
    if (issue) {
      useTreeStore.getState().setEditingId(issue.id);  // 即座に編集モード
      mutateIssues();
    }
  }, [create, mutateIssues]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">
            {owner}/{repo}
          </h1>
          <Link
            href={`https://github.com/${owner}/${repo}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowClosedIssues}
            className="gap-1 text-xs"
          >
            {showClosedIssues ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showClosedIssues ? "Closed を非表示" : "Closed を表示"}
          </Button>
        </div>
      </div>

      {/* ブレッドクラム（ズーム時） */}
      {zoomId !== null && (
        <Breadcrumb
          flatItems={flatItems}
          zoomId={zoomId}
          onNavigate={setZoomId}
        />
      )}

      {/* アウトライナーツリー */}
      {flatItems.length > 0 ? (
        <SortableTree
          owner={owner}
          repo={repo}
          flatItems={flatItems}
          moveToParent={moveToParent}
          reorder={reorder}
          revalidateAll={revalidateAll}
        >
          {flatItems
            .filter((item) => showClosedIssues || item.issue.state === "open")
            .map((item) => (
              <OutlinerItem
                key={item.issue.id}
                item={item}
                owner={owner}
                repo={repo}
              />
            ))}
        </SortableTree>
      ) : (
        <div className="py-12 text-center text-muted-foreground">
          <p>Issue がありません</p>
        </div>
      )}

      {/* 新規 Issue 作成ボタン */}
      <div className="mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCreateRoot}
          className="gap-1 text-muted-foreground"
        >
          <Plus className="h-4 w-4" />
          Issue を追加
        </Button>
      </div>
    </div>
  );
}
