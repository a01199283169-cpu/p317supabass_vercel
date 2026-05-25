"use client";

import { Inbox } from "lucide-react";

// 받은 편지함 (현재는 빈 상태 UI)
export function InboxView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center">
      <Inbox className="mb-4 h-16 w-16 text-muted-foreground/40" />
      <h2 className="text-xl font-semibold text-foreground">받은 편지함</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        공유된 페이지나 멘션이 여기에 표시됩니다. 현재 받은 항목이 없습니다.
      </p>
    </div>
  );
}
