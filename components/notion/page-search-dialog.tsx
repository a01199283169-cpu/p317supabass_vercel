"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { flattenPages } from "@/lib/notion/page-utils";
import type { Page } from "@/types/notion";

type PageSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: Page[];
  onSelectPage: (pageId: string) => void;
};

// 페이지 검색 다이얼로그 (⌘K / Ctrl+K)
export function PageSearchDialog({
  open,
  onOpenChange,
  pages,
  onSelectPage,
}: PageSearchDialogProps) {
  const [query, setQuery] = useState("");

  const allPages = useMemo(() => flattenPages(pages), [pages]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allPages;
    return allPages.filter((p) => p.title.toLowerCase().includes(q));
  }, [allPages, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const handleSelect = (pageId: string) => {
    onSelectPage(pageId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="sr-only">페이지 검색</DialogTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="페이지 검색..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {query ? "검색 결과가 없습니다." : "페이지가 없습니다."}
            </p>
          ) : (
            filtered.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => handleSelect(page.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
              >
                <span>{page.icon || "📄"}</span>
                <span className="truncate">{page.title}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
