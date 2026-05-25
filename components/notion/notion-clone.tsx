"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { NotionSidebar } from "@/components/notion/sidebar"
import { NotionEditor } from "@/components/notion/editor"
import { UserMenu } from "@/components/auth/UserMenu"
import { PageSearchDialog } from "@/components/notion/page-search-dialog"
import { HomeView } from "@/components/notion/home-view"
import { SettingsView } from "@/components/notion/settings-view"
import { InboxView } from "@/components/notion/inbox-view"
import { TrashView } from "@/components/notion/trash-view"
import {
  createPage,
  deletePage,
  getTrashedPages,
  permanentlyDeletePage,
  restorePage,
  savePageBlocks,
  updatePageMeta,
} from "@/lib/actions/pages"
import {
  addChildToTree,
  findPageByTitle,
} from "@/lib/notion/page-utils"
import type {
  Block,
  Page,
  PageContent,
  SidebarView,
  TrashedPage,
  WorkspaceData,
} from "@/types/notion"

type NotionCloneProps = {
  initialData: WorkspaceData
}

function removePageFromTree(pages: Page[], pageId: string): Page[] {
  return pages
    .filter((page) => page.id !== pageId)
    .map((page) => ({
      ...page,
      children: page.children
        ? removePageFromTree(page.children, pageId)
        : undefined,
    }))
}

function updatePageTitleInTree(
  pages: Page[],
  pageId: string,
  title: string,
): Page[] {
  return pages.map((page) => {
    if (page.id === pageId) {
      return { ...page, title }
    }
    if (page.children) {
      return {
        ...page,
        children: updatePageTitleInTree(page.children, pageId, title),
      }
    }
    return page
  })
}

function findFirstPageId(pages: Page[]): string | null {
  if (pages.length === 0) return null
  return pages[0].id
}

function mapPageFromDb(page: Awaited<ReturnType<typeof createPage>>) {
  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
  }
}

function mapContentFromDb(page: Awaited<ReturnType<typeof createPage>>): PageContent {
  return {
    title: page.title,
    icon: page.icon,
    blocks: page.blocks.map((b) => ({
      id: b.id,
      type: b.type as Block["type"],
      content: b.content,
      checked: b.checked,
    })),
  }
}

export default function NotionClone({ initialData }: NotionCloneProps) {
  const [pages, setPages] = useState<Page[]>(initialData.pages)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialData.selectedPageId,
  )
  const [pageContents, setPageContents] = useState<
    Record<string, PageContent>
  >(initialData.pageContents)
  const [activeView, setActiveView] = useState<SidebarView>("editor")
  const [searchOpen, setSearchOpen] = useState(false)
  const [trashedPages, setTrashedPages] = useState<TrashedPage[]>([])

  const saveMetaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveBlocksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // "시작하기" 페이지를 즐겨찾기로 표시
  const favoritePageId = useMemo(() => {
    const welcome = findPageByTitle(pages, "시작하기")
    return welcome?.id ?? pages[0]?.id ?? null
  }, [pages])

  const currentContent =
    selectedPageId && pageContents[selectedPageId]
      ? pageContents[selectedPageId]
      : {
          title: "새 페이지",
          icon: "📄",
          blocks: [
            { id: crypto.randomUUID(), type: "paragraph" as const, content: "" },
          ],
        }

  const debouncedSaveMeta = useCallback(
    (pageId: string, title: string, icon: string) => {
      if (saveMetaTimerRef.current) clearTimeout(saveMetaTimerRef.current)
      saveMetaTimerRef.current = setTimeout(async () => {
        try {
          await updatePageMeta(pageId, { title, icon })
        } catch {
          toast.error("제목 저장에 실패했습니다.")
        }
      }, 500)
    },
    [],
  )

  const debouncedSaveBlocks = useCallback(
    (pageId: string, blocks: Block[]) => {
      if (saveBlocksTimerRef.current) clearTimeout(saveBlocksTimerRef.current)
      saveBlocksTimerRef.current = setTimeout(async () => {
        try {
          await savePageBlocks(pageId, blocks)
        } catch {
          toast.error("블록 저장에 실패했습니다.")
        }
      }, 500)
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (saveMetaTimerRef.current) clearTimeout(saveMetaTimerRef.current)
      if (saveBlocksTimerRef.current) clearTimeout(saveBlocksTimerRef.current)
    }
  }, [])

  // 휴지통 목록 로드
  const loadTrashedPages = useCallback(async () => {
    try {
      const items = await getTrashedPages()
      setTrashedPages(items)
    } catch {
      toast.error("휴지통을 불러오지 못했습니다.")
    }
  }, [])

  useEffect(() => {
    if (activeView === "trash") {
      loadTrashedPages()
    }
  }, [activeView, loadTrashedPages])

  // ⌘K / Ctrl+K 검색 단축키
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId)
    setActiveView("editor")
  }

  const handleAddPage = async (parentId?: string | null) => {
    try {
      const page = await createPage(parentId ?? null)
      const newPage = mapPageFromDb(page)
      const newContent = mapContentFromDb(page)

      if (parentId) {
        setPages((prev) => addChildToTree(prev, parentId, newPage))
      } else {
        setPages((prev) => [...prev, newPage])
      }

      setPageContents((prev) => ({ ...prev, [page.id]: newContent }))
      setSelectedPageId(page.id)
      setActiveView("editor")
      toast.success("새 페이지가 생성되었습니다.")
    } catch (error) {
      console.error(error)
      toast.error("페이지 생성에 실패했습니다.")
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (
      !confirm(
        "이 페이지를 휴지통으로 이동하시겠습니까? 하위 페이지도 함께 이동됩니다.",
      )
    ) {
      return
    }

    try {
      await deletePage(pageId)

      const newPages = removePageFromTree(pages, pageId)
      const newContents = { ...pageContents }
      delete newContents[pageId]

      setPages(newPages)
      setPageContents(newContents)

      if (selectedPageId === pageId) {
        const nextId = findFirstPageId(newPages)
        setSelectedPageId(nextId)
        setActiveView(nextId ? "editor" : "home")
      }

      await loadTrashedPages()
      toast.success("휴지통으로 이동했습니다.")
    } catch {
      toast.error("페이지 삭제에 실패했습니다.")
    }
  }

  const handleRestorePage = async (pageId: string) => {
    try {
      const page = await restorePage(pageId)
      const newPage = mapPageFromDb(page)
      const newContent = mapContentFromDb(page)

      if (page.parentId) {
        setPages((prev) => addChildToTree(prev, page.parentId!, newPage))
      } else {
        setPages((prev) => [...prev, newPage])
      }

      setPageContents((prev) => ({ ...prev, [page.id]: newContent }))
      setTrashedPages((prev) => prev.filter((p) => p.id !== pageId))
      toast.success("페이지가 복원되었습니다.")
    } catch {
      toast.error("페이지 복원에 실패했습니다.")
    }
  }

  const handlePermanentDelete = async (pageId: string) => {
    if (
      !confirm(
        "페이지를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      return
    }

    try {
      await permanentlyDeletePage(pageId)
      setTrashedPages((prev) => prev.filter((p) => p.id !== pageId))
      toast.success("페이지가 영구 삭제되었습니다.")
    } catch {
      toast.error("영구 삭제에 실패했습니다.")
    }
  }

  const handleTitleChange = (title: string) => {
    if (!selectedPageId) return

    setPageContents((prev) => {
      const current = prev[selectedPageId]
      if (!current) return prev
      return {
        ...prev,
        [selectedPageId]: { ...current, title },
      }
    })
    setPages((prev) => updatePageTitleInTree(prev, selectedPageId, title))
    debouncedSaveMeta(selectedPageId, title, pageContents[selectedPageId]?.icon ?? "📄")
  }

  const handleBlocksChange = (blocks: Block[]) => {
    if (!selectedPageId) return

    setPageContents((prev) => {
      const current = prev[selectedPageId]
      if (!current) return prev
      return {
        ...prev,
        [selectedPageId]: { ...current, blocks },
      }
    })
    debouncedSaveBlocks(selectedPageId, blocks)
  }

  const renderMainContent = () => {
    switch (activeView) {
      case "home":
        return (
          <HomeView
            pages={pages}
            userName={initialData.userName}
            onSelectPage={handleSelectPage}
            onAddPage={() => handleAddPage()}
          />
        )
      case "inbox":
        return <InboxView />
      case "settings":
        return (
          <SettingsView
            userName={initialData.userName}
            userEmail={initialData.userEmail}
          />
        )
      case "trash":
        return (
          <TrashView
            trashedPages={trashedPages}
            onRestore={handleRestorePage}
            onPermanentDelete={handlePermanentDelete}
          />
        )
      case "editor":
      default:
        if (!selectedPageId) {
          return (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg">페이지가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => handleAddPage()}
                  className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  새 페이지 만들기
                </button>
              </div>
            </div>
          )
        }
        return (
          <NotionEditor
            key={selectedPageId}
            pageId={selectedPageId}
            pageTitle={currentContent.title}
            pageIcon={currentContent.icon}
            blocks={currentContent.blocks}
            onTitleChange={handleTitleChange}
            onBlocksChange={handleBlocksChange}
            onDeletePage={() => selectedPageId && handleDeletePage(selectedPageId)}
          />
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="flex h-full w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <UserMenu userName={initialData.userName} />
        <NotionSidebar
          pages={pages}
          selectedPageId={selectedPageId}
          activeView={activeView}
          favoritePageId={favoritePageId}
          onSelectPage={handleSelectPage}
          onAddPage={() => handleAddPage()}
          onAddChildPage={(parentId) => handleAddPage(parentId)}
          onDeletePage={handleDeletePage}
          onNavigate={setActiveView}
          onOpenSearch={() => setSearchOpen(true)}
          workspaceName={`${initialData.userName}의 워크스페이스`}
        />
      </div>

      {renderMainContent()}

      <PageSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        pages={pages}
        onSelectPage={handleSelectPage}
      />
    </div>
  )
}
