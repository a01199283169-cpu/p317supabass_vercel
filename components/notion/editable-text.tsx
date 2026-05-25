"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type EditableTextProps = {
  id?: string;
  /** DOM 동기화 트리거 — 변경 시에만 DOM 초기화 */
  syncKey: string;
  /** syncKey 변경 시 DOM에 반영할 초기 텍스트 */
  initialContent: string;
  onChange: (text: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  className?: string;
  placeholder?: string;
};

/**
 * contentEditable 입력 — React children 미사용으로 입력 중 DOM 리셋 방지
 */
export function EditableText({
  id,
  syncKey,
  initialContent,
  onChange,
  onKeyDown,
  className,
  placeholder,
}: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null);

  // syncKey 변경 시에만 DOM 동기화 (입력 중에는 실행되지 않음)
  useEffect(() => {
    if (ref.current) {
      ref.current.innerText = initialContent;
    }
  }, [syncKey]); // initialContent는 syncKey 변경 시점의 값만 사용

  const handleInput = () => {
    if (ref.current) {
      onChange(ref.current.innerText);
    }
  };

  return (
    <div
      ref={ref}
      id={id}
      contentEditable
      suppressContentEditableWarning
      className={cn(
        "outline-none",
        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50",
        className,
      )}
      data-placeholder={placeholder}
      onInput={handleInput}
      onKeyDown={onKeyDown}
    />
  );
}
