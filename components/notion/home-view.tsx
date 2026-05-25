"use client";

import { FileText, Plus } from "lucide-react";
import { flattenPages } from "@/lib/notion/page-utils";
import type { Page } from "@/types/notion";

type HomeViewProps = {
  pages: Page[];
  userName: string;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
};

// 홈 대시보드 — 최근 페이지 목록 + 빠른 작업
export function HomeView({
  pages,
  userName,
  onSelectPage,
  onAddPage,
}: HomeViewProps) {
  const allPages = flattenPages(pages);

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">
          {userName}님, 안녕하세요 👋
        </h1>
        <p className="mt-2 text-muted-foreground">
          최근 페이지를 선택하거나 새 페이지를 만들어 보세요.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onAddPage}
            className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-left transition-colors hover:bg-accent/50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">새 페이지</p>
              <p className="text-sm text-muted-foreground">빈 페이지 만들기</p>
            </div>
          </button>

          {allPages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xl">
                {page.icon || "📄"}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {page.title}
                </p>
                <p className="text-sm text-muted-foreground">페이지 열기</p>
              </div>
            </button>
          ))}
        </div>

        {allPages.length === 0 && (
          <div className="mt-12 flex flex-col items-center text-center text-muted-foreground">
            <FileText className="mb-3 h-12 w-12 opacity-40" />
            <p>아직 페이지가 없습니다.</p>
            <button
              type="button"
              onClick={onAddPage}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              첫 페이지 만들기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
