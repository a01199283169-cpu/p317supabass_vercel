type UserMenuProps = {
  userName: string;
};

// 사용자 메뉴 (로그아웃)
export function UserMenu({ userName }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-orange-400 text-xs font-medium text-white">
        {userName[0]}
      </div>
      <span className="flex-1 truncate text-sm text-sidebar-foreground">
        {userName}
      </span>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
