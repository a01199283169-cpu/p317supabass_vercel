import type { Page } from "@/types/notion";

// DB flat 페이지 목록 → UI 트리 구조로 변환
export interface FlatPage {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  order: number;
}

export function buildPageTree(flatPages: FlatPage[]): Page[] {
  const pageMap = new Map<string, Page>();
  const roots: Page[] = [];

  // 1단계: 모든 페이지를 Page 객체로 생성
  for (const p of flatPages) {
    pageMap.set(p.id, {
      id: p.id,
      title: p.title,
      icon: p.icon,
      children: [],
    });
  }

  // 2단계: 부모-자식 관계 연결
  const sorted = [...flatPages].sort((a, b) => a.order - b.order);

  for (const p of sorted) {
    const node = pageMap.get(p.id)!;

    if (p.parentId && pageMap.has(p.parentId)) {
      const parent = pageMap.get(p.parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 빈 children 배열 제거
  const cleanEmptyChildren = (pages: Page[]): Page[] =>
    pages.map((page) => ({
      ...page,
      children:
        page.children && page.children.length > 0
          ? cleanEmptyChildren(page.children)
          : undefined,
    }));

  return cleanEmptyChildren(roots);
}
