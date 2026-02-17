"use client";  // クライアントコンポーネント

import { useMemo } from "react";  // メモ化
import {
  Breadcrumb as ShadBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";  // shadcn ブレッドクラム
import { getAncestors } from "@/lib/tree/flatten";  // 祖先取得
import type { FlattenedItem } from "@/lib/tree/types";  // 型
import type { IssueId } from "@/lib/github/types";  // 型
import { Home } from "lucide-react";  // アイコン

interface Props {
  flatItems: FlattenedItem[];  // 全フラットアイテム
  zoomId: IssueId;  // ズーム中の Issue ID
  onNavigate: (id: IssueId | null) => void;  // ナビゲーション
}

export function Breadcrumb({ flatItems, zoomId, onNavigate }: Props) {
  /** ズーム先の祖先チェーンを計算 */
  const ancestors = useMemo(
    () => getAncestors(flatItems, zoomId),
    [flatItems, zoomId]
  );

  /** ズーム中の Issue */
  const current = flatItems.find((i) => i.issue.id === zoomId);

  return (
    <ShadBreadcrumb className="mb-4">
      <BreadcrumbList>
        {/* ルートへ戻る */}
        <BreadcrumbItem>
          <BreadcrumbLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate(null);  // ルートにズームアウト
            }}
            className="flex items-center gap-1"
          >
            <Home className="h-3.5 w-3.5" />
            ルート
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* 祖先チェーン */}
        {ancestors.map((ancestor) => (
          <BreadcrumbItem key={ancestor.issue.id}>
            <BreadcrumbSeparator />
            <BreadcrumbLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onNavigate(ancestor.issue.id);  // 中間レベルにズーム
              }}
            >
              {ancestor.issue.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}

        {/* 現在のズーム先 */}
        {current && (
          <BreadcrumbItem>
            <BreadcrumbSeparator />
            <span className="font-medium">{current.issue.title}</span>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </ShadBreadcrumb>
  );
}
