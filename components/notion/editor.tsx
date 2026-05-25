"use client"

import { useState, KeyboardEvent } from "react"
import {
  MessageSquare,
  Clock,
  Star,
  MoreHorizontal,
  Image,
  Smile,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Block } from "@/types/notion"
import { EditableText } from "@/components/notion/editable-text"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EditorProps {
  pageId: string
  pageTitle: string
  pageIcon?: string
  coverImage?: string
  blocks: Block[]
  onTitleChange: (title: string) => void
  onBlocksChange: (blocks: Block[]) => void
  onDeletePage: () => void
}

export function NotionEditor({
  pageId,
  pageTitle,
  pageIcon = "📄",
  coverImage,
  blocks,
  onTitleChange,
  onBlocksChange,
  onDeletePage,
}: EditorProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, blockId: string, index: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const newBlock: Block = {
        id: crypto.randomUUID(),
        type: "paragraph",
        content: "",
      }
      const newBlocks = [...blocks]
      newBlocks.splice(index + 1, 0, newBlock)
      onBlocksChange(newBlocks)
      setTimeout(() => {
        document.getElementById(`block-${newBlock.id}`)?.focus()
      }, 0)
    }

    if (e.key === "Backspace") {
      const target = e.target as HTMLElement
      if (target.innerText === "" && blocks.length > 1) {
        e.preventDefault()
        const newBlocks = blocks.filter((_, i) => i !== index)
        onBlocksChange(newBlocks)
        setTimeout(() => {
          document.getElementById(`block-${blocks[index - 1]?.id}`)?.focus()
        }, 0)
      }
    }

    if (e.key === "/" && (e.target as HTMLElement).innerText === "") {
      setShowSlashMenu(true)
      setActiveBlockId(blockId)
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setSlashMenuPosition({ top: rect.bottom + 4, left: rect.left })
    }
  }

  const handleBlockContentChange = (blockId: string, content: string) => {
    onBlocksChange(
      blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block,
      ),
    )
  }

  const handleBlockTypeChange = (type: Block["type"]) => {
    if (activeBlockId) {
      onBlocksChange(
        blocks.map((block) =>
          block.id === activeBlockId ? { ...block, type, content: "" } : block,
        ),
      )
    }
    setShowSlashMenu(false)
  }

  const toggleTodo = (blockId: string) => {
    onBlocksChange(
      blocks.map((block) =>
        block.id === blockId ? { ...block, checked: !block.checked } : block,
      ),
    )
  }

  const handleDeleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      onBlocksChange([{ id: blocks[0].id, type: "paragraph", content: "" }])
      return
    }
    const newBlocks = blocks.filter((_, i) => i !== index)
    onBlocksChange(newBlocks)
    setTimeout(() => {
      const focusIndex = Math.max(0, index - 1)
      document.getElementById(`block-${newBlocks[focusIndex]?.id}`)?.focus()
    }, 0)
  }

  const renderEditableBlock = (
    block: Block,
    index: number,
    className?: string,
    placeholder?: string,
  ) => (
    <EditableText
      id={`block-${block.id}`}
      syncKey={`${block.id}:${block.type}`}
      initialContent={block.content}
      placeholder={placeholder}
      className={cn(
        "py-1 px-1 rounded transition-colors focus:bg-accent/30",
        className,
      )}
      onChange={(text) => handleBlockContentChange(block.id, text)}
      onKeyDown={(e) => handleKeyDown(e, block.id, index)}
    />
  )

  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case "heading1":
        return renderEditableBlock(
          block,
          index,
          "text-4xl font-bold mt-8 mb-2",
          "제목 1",
        )
      case "heading2":
        return renderEditableBlock(
          block,
          index,
          "text-2xl font-semibold mt-6 mb-1",
          "제목 2",
        )
      case "heading3":
        return renderEditableBlock(
          block,
          index,
          "text-xl font-medium mt-4 mb-1",
          "제목 3",
        )
      case "bulletList":
        return (
          <div className="flex items-start gap-2">
            <span className="text-foreground mt-1.5">•</span>
            {renderEditableBlock(block, index, "flex-1", "리스트")}
          </div>
        )
      case "numberedList":
        return (
          <div className="flex items-start gap-2">
            <span className="text-foreground mt-0.5 text-sm">{index + 1}.</span>
            {renderEditableBlock(block, index, "flex-1", "리스트")}
          </div>
        )
      case "todo":
        return (
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => toggleTodo(block.id)}
              className={cn(
                "w-4 h-4 mt-1 rounded border border-border flex items-center justify-center",
                block.checked && "bg-blue-500 border-blue-500",
              )}
            >
              {block.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <EditableText
              id={`block-${block.id}`}
              syncKey={`${block.id}:${block.type}:${block.checked}`}
              initialContent={block.content}
              placeholder="할 일"
              className={cn(
                "flex-1 py-1 px-1 rounded transition-colors focus:bg-accent/30",
                block.checked && "line-through text-muted-foreground",
              )}
              onChange={(text) => handleBlockContentChange(block.id, text)}
              onKeyDown={(e) => handleKeyDown(e, block.id, index)}
            />
          </div>
        )
      case "quote":
        return (
          <div className="border-l-2 border-foreground pl-4 py-1">
            {renderEditableBlock(block, index, "text-foreground", "인용")}
          </div>
        )
      case "code":
        return (
          <div className="bg-muted rounded-md p-4 font-mono text-sm">
            {renderEditableBlock(block, index, "whitespace-pre", "코드")}
          </div>
        )
      case "divider":
        return <hr className="my-4 border-border" />
      default:
        return renderEditableBlock(
          block,
          index,
          undefined,
          "텍스트를 입력하거나, '/'를 눌러 명령어를 사용하세요",
        )
    }
  }

  const slashMenuItems = [
    { type: "paragraph" as const, icon: AlignLeft, label: "텍스트", description: "기본 텍스트 블록" },
    { type: "heading1" as const, icon: Heading1, label: "제목 1", description: "큰 제목" },
    { type: "heading2" as const, icon: Heading2, label: "제목 2", description: "중간 제목" },
    { type: "heading3" as const, icon: Heading3, label: "제목 3", description: "작은 제목" },
    { type: "bulletList" as const, icon: List, label: "글머리 기호 목록", description: "간단한 목록" },
    { type: "numberedList" as const, icon: ListOrdered, label: "번호 매기기 목록", description: "번호가 있는 목록" },
    { type: "todo" as const, icon: CheckSquare, label: "할 일 목록", description: "체크박스가 있는 목록" },
    { type: "quote" as const, icon: Quote, label: "인용", description: "인용문 블록" },
    { type: "code" as const, icon: Code, label: "코드", description: "코드 블록" },
    { type: "divider" as const, icon: Minus, label: "구분선", description: "구분선 추가" },
  ]

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background">
      {coverImage && (
        <div className="relative h-48 w-full group">
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-16 py-12">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <span className="hover:bg-accent px-1.5 py-0.5 rounded cursor-pointer">
              {pageIcon} {pageTitle || "제목 없음"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded hover:bg-accent text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-accent text-muted-foreground">
              <Clock className="h-4 w-4" />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-accent text-muted-foreground">
              <Star className="h-4 w-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                  title="더보기"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDeletePage}
                >
                  <Trash2 className="h-4 w-4" />
                  휴지통으로 이동
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mb-4 group">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mb-2">
            <button type="button" className="text-xs text-muted-foreground hover:bg-accent px-2 py-1 rounded flex items-center gap-1">
              <Smile className="h-3.5 w-3.5" />
              아이콘 추가
            </button>
            <button type="button" className="text-xs text-muted-foreground hover:bg-accent px-2 py-1 rounded flex items-center gap-1">
              <Image className="h-3.5 w-3.5" />
              커버 추가
            </button>
          </div>
          <div
            className="text-5xl cursor-pointer hover:bg-accent/50 p-1 rounded inline-block"
            onClick={() => setShowIconPicker(!showIconPicker)}
          >
            {pageIcon}
          </div>
        </div>

        {/* 제목 — EditableText로 입력 중 DOM 리셋 방지 */}
        <EditableText
          syncKey={pageId}
          initialContent={pageTitle}
          placeholder="제목 없음"
          className="text-4xl font-bold text-foreground mb-8"
          onChange={onTitleChange}
        />

        <div className="space-y-1">
          {blocks.map((block, index) => (
            <div key={block.id} className="group relative">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                  title="블록 삭제"
                  onClick={() => handleDeleteBlock(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div>{renderBlock(block, index)}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-muted-foreground/50 text-sm py-2">
          아무 곳이나 클릭하여 입력을 시작하거나, &apos;/&apos; 키를 눌러 명령어를 사용하세요
        </div>
      </div>

      {showSlashMenu && (
        <div
          className="fixed bg-popover border border-border rounded-lg shadow-lg py-2 w-80 z-50"
          style={{ top: slashMenuPosition.top, left: slashMenuPosition.left }}
        >
          <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">기본 블록</div>
          {slashMenuItems.map((item) => (
            <button
              key={item.type}
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-left"
              onClick={() => handleBlockTypeChange(item.type)}
            >
              <div className="p-1.5 rounded bg-muted">
                <item.icon className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showSlashMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSlashMenu(false)}
        />
      )}
    </div>
  )
}
