"use client";  // クライアントコンポーネント

import { useState, useCallback, useMemo, useRef } from "react";  // React フック
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  DragMoveEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";  // DnD コア
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";  // ソータブル
import { useTreeStore } from "@/stores/tree-store";  // ツリー状態
import { useUIStore } from "@/stores/ui-store";  // UI 状態
import { getProjection } from "@/lib/tree/projection";  // ドロップ位置計算
import { getParentIssueNumber } from "@/lib/tree/operations";  // 親番号取得
import type { FlattenedItem } from "@/lib/tree/types";  // 型
import type { IssueId } from "@/lib/github/types";  // 型

interface Props {
  owner: string;
  repo: string;
  flatItems: FlattenedItem[];  // フラットアイテム
  moveToParent: (
    id: IssueId,
    oldParent: number | null,
    newParent: number | null,
    afterId?: IssueId,
    beforeId?: IssueId
  ) => Promise<void>;
  reorder: (
    parentNumber: number,
    childId: IssueId,
    afterId?: IssueId,
    beforeId?: IssueId
  ) => Promise<void>;
  revalidateAll: () => void;
  children: React.ReactNode;
}

const INDENTATION_WIDTH = 28;  // インデント幅（px）

export function SortableTree({
  flatItems,
  moveToParent,
  reorder,
  children,
}: Props) {
  const [activeId, setActiveId] = useState<IssueId | null>(null);  // ドラッグ中の ID
  const [overId, setOverId] = useState<IssueId | null>(null);  // ドロップ先の ID
  const [offsetLeft, setOffsetLeft] = useState(0);  // 水平オフセット
  const { pushSnapshot } = useTreeStore();
  const { setDragActiveId } = useUIStore();
  const initialDepthRef = useRef(0);  // ドラッグ開始時の深さ

  // センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },  // 5px 移動で開始
    }),
    useSensor(KeyboardSensor)
  );

  // ソート可能アイテムの ID リスト
  const sortableIds = useMemo(
    () => flatItems.map((item) => item.issue.id),
    [flatItems]
  );

  // ドロップ位置の投影
  const projection = useMemo(() => {
    if (activeId === null || overId === null) return null;
    return getProjection(flatItems, activeId, overId, offsetLeft, INDENTATION_WIDTH);
  }, [flatItems, activeId, overId, offsetLeft]);

  /** ドラッグ開始 */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as IssueId;
      setActiveId(id);
      setDragActiveId(id);
      pushSnapshot();  // Undo 用スナップショット

      const item = flatItems.find((i) => i.issue.id === id);
      if (item) initialDepthRef.current = item.depth;
    },
    [flatItems, pushSnapshot, setDragActiveId]
  );

  /** ドラッグ移動 */
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    setOffsetLeft(event.delta.x);  // 水平オフセット更新
    if (event.over) {
      setOverId(event.over.id as IssueId);
    }
  }, []);

  /** ドラッグ終了 */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverId(null);
      setOffsetLeft(0);
      setDragActiveId(null);

      if (!over || active.id === over.id || !projection) return;

      const activeItem = flatItems.find((i) => i.issue.id === active.id);
      if (!activeItem) return;

      const oldParentNumber = getParentIssueNumber(flatItems, activeItem.parentId);
      const newParentNumber = getParentIssueNumber(flatItems, projection.parentId);

      if (oldParentNumber === newParentNumber && projection.position !== "child") {
        // 同じ親内での並び替え
        if (newParentNumber !== null) {
          const overItem = flatItems.find((i) => i.issue.id === over.id);
          await reorder(
            newParentNumber,
            active.id as IssueId,
            overItem?.issue.id
          );
        }
      } else {
        // 親の変更（階層移動）
        const overItem = flatItems.find((i) => i.issue.id === over.id);
        await moveToParent(
          active.id as IssueId,
          oldParentNumber,
          newParentNumber ?? (projection.position === "child" ? overItem?.issue.number ?? null : null),
          overItem?.issue.id
        );
      }
    },
    [flatItems, projection, reorder, moveToParent, setDragActiveId]
  );

  // ドラッグ中のオーバーレイアイテム
  const activeItem = flatItems.find((i) => i.issue.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      modifiers={[]}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">{children}</div>
      </SortableContext>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeItem && (
          <div className="rounded-md border bg-background px-2 py-1 text-sm shadow-md">
            {activeItem.issue.title}
          </div>
        )}
      </DragOverlay>

      {/* インデントガイド（ドラッグ中） */}
      {projection && activeId !== null && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{
            transform: `translateX(${projection.depth * INDENTATION_WIDTH + 48}px)`,
          }}
        >
          <div className="h-0.5 w-8 rounded bg-primary" />
        </div>
      )}
    </DndContext>
  );
}
