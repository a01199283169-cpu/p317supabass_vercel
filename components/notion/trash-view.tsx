"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import type { TrashedPage } from "@/types/notion";

type TrashViewProps = {
  trashedPages: TrashedPage[];
  onRestore: (pageId: string) => void;
  onPermanentDelete: (pageId: string) => void;
};

function formatDeletedAt(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 휴지통 — 삭제된 페이지 복원/영구 삭제
export function TrashView({
  trashedPages,
  onRestore,
  onPermanentDelete,
}: TrashViewProps) {
  if (trashedPages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center">
        <Trash2 className="mb-4 h-16 w-16 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">휴지통</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          삭제된 페이지가 여기에 보관됩니다. 휴지통이 비어 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">휴지통</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {trashedPages.length}개의 삭제된 페이지
        </p>

        <ul className="mt-6 space-y-2">
          {trashedPages.map((page) => (
            <li
              key={page.id}
              className="flex items-center gap-3 rounded-lg border border-border p-4"
            >
              <span className="text-xl">{page.icon || "📄"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {page.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  삭제됨 · {formatDeletedAt(page.deletedAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onRestore(page.id)}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  복원
                </button>
                <button
                  type="button"
                  onClick={() => onPermanentDelete(page.id)}
                  className="flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  영구 삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
