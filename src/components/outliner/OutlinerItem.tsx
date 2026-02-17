"use client";  // クライアントコンポーネント

import { useCallback, useRef, useEffect } from "react";  // React フック
import { useTreeStore } from "@/stores/tree-store";  // ツリー状態
import { useMutateIssue } from "@/hooks/useMutateIssue";  // Issue 操作
import { OutlinerInput } from "./OutlinerInput";  // インライン編集
import { Badge } from "@/components/ui/badge";  // バッジ
import { Button } from "@/components/ui/button";  // ボタン
import {
  ChevronRight,
  ChevronDown,
  Circle,
  CheckCircle2,
  GripVertical,
  ZoomIn,
} from "lucide-react";  // アイコン
import type { FlattenedItem } from "@/lib/tree/types";  // 型
import { cn } from "@/lib/utils";  // クラス名結合
import { useSortable } from "@dnd-kit/sortable";  // ドラッグ可能

interface Props {
  item: FlattenedItem;  // 表示するアイテム
  owner: string;  // リポジトリオーナー
  repo: string;  // リポジトリ名
}

export function OutlinerItem({ item, owner, repo }: Props) {
  const { issue, depth, collapsed, childCount } = item;  // 分割代入
  const { focusedId, editingId, setFocusedId, setEditingId, toggleCollapsed, setZoomId } =
    useTreeStore();  // ストア
  const { toggleState } = useMutateIssue(owner, repo);  // Issue 操作
  const itemRef = useRef<HTMLDivElement>(null);  // DOM 参照
  const isFocused = focusedId === issue.id;  // フォーカス状態
  const isEditing = editingId === issue.id;  // 編集状態
  const isClosed = issue.state === "closed";  // クローズ状態

  // DnD ソータブル
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    paddingLeft: `${depth * 28}px`,  // インデント
  };

  // フォーカス時に DOM にフォーカス
  useEffect(() => {
    if (isFocused && itemRef.current && !isEditing) {
      itemRef.current.focus();
    }
  }, [isFocused, isEditing]);

  /** クリックでフォーカス */
  const handleClick = useCallback(() => {
    setFocusedId(issue.id);
  }, [setFocusedId, issue.id]);

  /** ダブルクリックで編集モード */
  const handleDoubleClick = useCallback(() => {
    setEditingId(issue.id);
  }, [setEditingId, issue.id]);

  /** 折りたたみ切り替え */
  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleCollapsed(issue.id);
    },
    [toggleCollapsed, issue.id]
  );

  /** 状態切り替え（Ctrl+Enter） */
  const handleToggleState = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleState(issue.number, issue.state);
    },
    [toggleState, issue.number, issue.state]
  );

  /** ズームイン */
  const handleZoomIn = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setZoomId(issue.id);
    },
    [setZoomId, issue.id]
  );

  return (
    <div
      ref={(node) => {
        setNodeRef(node);  // DnD ref
        (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md px-1 py-0.5 outline-none transition-colors",
        isFocused && "bg-accent",
        isDragging && "opacity-50",
        isClosed && "opacity-60"
      )}
      tabIndex={0}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-issue-id={issue.id}
    >
      {/* ドラッグハンドル */}
      <button
        className="cursor-grab opacity-0 group-hover:opacity-100 focus:opacity-100"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* 折りたたみボタン / バレット */}
      {childCount > 0 ? (
        <button
          onClick={handleToggleCollapse}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      ) : (
        <span className="flex h-5 w-5 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        </span>
      )}

      {/* 状態アイコン（open/closed） */}
      <button
        onClick={handleToggleState}
        className="flex-shrink-0"
        title={isClosed ? "再オープン" : "クローズ"}
      >
        {isClosed ? (
          <CheckCircle2 className="h-4 w-4 text-purple-500" />
        ) : (
          <Circle className="h-4 w-4 text-green-500" />
        )}
      </button>

      {/* Issue タイトル（インライン編集対応） */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <OutlinerInput
            issueId={issue.id}
            issueNumber={issue.number}
            initialTitle={issue.title}
            owner={owner}
            repo={repo}
          />
        ) : (
          <span
            className={cn(
              "block truncate text-sm",
              isClosed && "line-through"
            )}
          >
            {issue.title}
          </span>
        )}
      </div>

      {/* Issue 番号 */}
      <span className="flex-shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
        #{issue.number}
      </span>

      {/* ラベル */}
      {issue.labels.slice(0, 2).map((label) => (
        <Badge
          key={label.id}
          variant="outline"
          className="hidden text-xs sm:inline-flex"
          style={{
            borderColor: `#${label.color}`,
            color: `#${label.color}`,
          }}
        >
          {label.name}
        </Badge>
      ))}

      {/* ズームインボタン */}
      {childCount > 0 && (
        <button
          onClick={handleZoomIn}
          className="opacity-0 group-hover:opacity-100"
          title="ズームイン"
        >
          <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
