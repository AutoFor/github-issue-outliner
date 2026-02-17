import { Skeleton } from "@/components/ui/skeleton";  // スケルトン

export default function OutlinerLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* ヘッダースケルトン */}
      <div className="mb-6 flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* ツリーアイテムスケルトン */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 28}px` }}>
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
