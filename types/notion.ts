// Notion UI 공유 타입 (클라이언트·서버 공용)

export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "todo"
  | "quote"
  | "code"
  | "divider";

export interface Page {
  id: string;
  title: string;
  icon?: string;
  children?: Page[];
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface PageContent {
  title: string;
  icon: string;
  blocks: Block[];
}

export interface WorkspaceData {
  pages: Page[];
  pageContents: Record<string, PageContent>;
  selectedPageId: string | null;
  userName: string;
  userEmail: string;
}

// 사이드바/메인 뷰 전환 타입
export type SidebarView =
  | "editor"
  | "home"
  | "search"
  | "inbox"
  | "settings"
  | "trash";

// 휴지통 페이지 정보
export interface TrashedPage {
  id: string;
  title: string;
  icon: string;
  deletedAt: string;
}
