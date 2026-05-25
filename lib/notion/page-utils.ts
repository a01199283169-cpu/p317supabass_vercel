import type { Page } from "@/types/notion";

// 페이지 트리를 flat 배열로 변환
export function flattenPages(pages: Page[]): Page[] {
  const result: Page[] = [];

  const walk = (items: Page[]) => {
    for (const page of items) {
      result.push(page);
      if (page.children?.length) {
        walk(page.children);
      }
    }
  };

  walk(pages);
  return result;
}

// 제목으로 페이지 찾기
export function findPageByTitle(pages: Page[], title: string): Page | null {
  return flattenPages(pages).find((p) => p.title === title) ?? null;
}

// 트리에 자식 페이지 추가
export function addChildToTree(
  pages: Page[],
  parentId: string,
  child: Page,
): Page[] {
  return pages.map((page) => {
    if (page.id === parentId) {
      return {
        ...page,
        children: [...(page.children ?? []), child],
      };
    }
    if (page.children) {
      return {
        ...page,
        children: addChildToTree(page.children, parentId, child),
      };
    }
    return page;
  });
}
