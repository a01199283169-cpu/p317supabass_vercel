"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Home,
  Inbox,
  Trash2,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Page, SidebarView } from "@/types/notion"

interface SidebarProps {
  pages: Page[]
  selectedPageId: string | null
  activeView: SidebarView
  favoritePageId: string | null
  onSelectPage: (id: string) => void
  onAddPage: () => void
  onAddChildPage: (parentId: string) => void
  onDeletePage: (id: string) => void
  onNavigate: (view: SidebarView) => void
  onOpenSearch: () => void
  workspaceName?: string
}

export function NotionSidebar({
  pages,
  selectedPageId,
  activeView,
  favoritePageId,
  onSelectPage,
  onAddPage,
  onAddChildPage,
  onDeletePage,
  onNavigate,
  onOpenSearch,
  workspaceName = "나의 워크스페이스",
}: SidebarProps) {
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedPages)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedPages(newExpanded)
  }

  const navItemClass = (view: SidebarView) =>
    cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm transition-colors",
      activeView === view
        ? "bg-sidebar-accent text-sidebar-foreground"
        : "text-muted-foreground hover:bg-sidebar-accent/50",
    )

  const renderPage = (page: Page, depth: number = 0) => {
    const isExpanded = expandedPages.has(page.id)
    const hasChildren = page.children && page.children.length > 0
    const isSelected =
      activeView === "editor" && selectedPageId === page.id
    const isHovered = hoveredItem === page.id

    return (
      <div key={page.id}>
        <div
          className={cn(
            "group flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer text-sm transition-colors",
            isSelected ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
            "text-sidebar-foreground"
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          onClick={() => onSelectPage(page.id)}
          onMouseEnter={() => setHoveredItem(page.id)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <button
            type="button"
            className="p-0.5 rounded hover:bg-sidebar-accent"
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) toggleExpand(page.id)
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )
            ) : (
              <div className="w-3.5 h-3.5" />
            )}
          </button>
          <span className="text-base">{page.icon || "📄"}</span>
          <span className="flex-1 truncate">{page.title}</span>
          {isHovered && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                className="p-1 rounded hover:bg-sidebar-accent"
                title="휴지통으로 이동"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePage(page.id)
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                type="button"
                className="p-1 rounded hover:bg-sidebar-accent"
                title="하위 페이지 추가"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddChildPage(page.id)
                  setExpandedPages((prev) => new Set(prev).add(page.id))
                }}
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {page.children!.map((child) => renderPage(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const favoritePage = favoritePageId
    ? pages
        .flatMap(function flatten(p): Page[] {
          return [p, ...(p.children?.flatMap(flatten) ?? [])]
        })
        .find((p) => p.id === favoritePageId)
    : null

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Workspace Header */}
      <div className="p-3 flex items-center justify-between hover:bg-sidebar-accent/50 cursor-pointer group">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 shrink-0 rounded bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white text-xs font-medium">
            {workspaceName[0]}
          </div>
          <span className="font-medium text-sm text-sidebar-foreground truncate">
            {workspaceName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="p-1 rounded hover:bg-sidebar-accent"
            title="검색"
            onClick={onOpenSearch}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-2 py-1">
        <button
          type="button"
          className={navItemClass("search")}
          onClick={onOpenSearch}
        >
          <Search className="h-4 w-4" />
          <span>검색</span>
          <span className="ml-auto text-xs text-muted-foreground/60">⌘K</span>
        </button>
        <button
          type="button"
          className={navItemClass("home")}
          onClick={() => onNavigate("home")}
        >
          <Home className="h-4 w-4" />
          <span>홈</span>
        </button>
        <button
          type="button"
          className={navItemClass("inbox")}
          onClick={() => onNavigate("inbox")}
        >
          <Inbox className="h-4 w-4" />
          <span>받은 편지함</span>
        </button>
        <button
          type="button"
          className={navItemClass("settings")}
          onClick={() => onNavigate("settings")}
        >
          <Settings className="h-4 w-4" />
          <span>설정</span>
        </button>
      </div>

      {/* Favorites Section */}
      {favoritePage && (
        <div className="px-2 py-2 mt-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-muted-foreground">즐겨찾기</span>
          </div>
          <button
            type="button"
            className={cn(
              "flex w-full items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm transition-colors",
              activeView === "editor" && selectedPageId === favoritePage.id
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
            onClick={() => onSelectPage(favoritePage.id)}
          >
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="truncate">{favoritePage.title}</span>
          </button>
        </div>
      )}

      {/* Private Section */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center justify-between px-2 py-1 group">
          <span className="text-xs font-medium text-muted-foreground">개인 페이지</span>
          <button
            type="button"
            onClick={onAddPage}
            className="p-0.5 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
            title="새 페이지"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="mt-1">{pages.map((page) => renderPage(page))}</div>
      </div>

      {/* Bottom Actions */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-sidebar-accent/50 cursor-pointer text-sm text-muted-foreground"
          onClick={onAddPage}
        >
          <Plus className="h-4 w-4" />
          <span>새 페이지</span>
        </button>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer text-sm transition-colors",
            activeView === "trash"
              ? "bg-sidebar-accent text-sidebar-foreground"
              : "text-muted-foreground hover:bg-sidebar-accent/50",
          )}
          onClick={() => onNavigate("trash")}
        >
          <Trash2 className="h-4 w-4" />
          <span>휴지통</span>
        </button>
      </div>
    </div>
  )
}
