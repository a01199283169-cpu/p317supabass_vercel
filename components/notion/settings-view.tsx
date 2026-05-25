"use client";

type SettingsViewProps = {
  userName: string;
  userEmail: string;
};

// 설정 화면 — 계정 정보 + 로그아웃
export function SettingsView({ userName, userEmail }: SettingsViewProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-foreground">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          계정 및 워크스페이스 설정
        </p>

        <div className="mt-8 space-y-6">
          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sm font-medium text-foreground">계정 정보</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">이름</dt>
                <dd className="font-medium text-foreground">{userName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">이메일</dt>
                <dd className="font-medium text-foreground">{userEmail}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-border p-4">
            <h2 className="text-sm font-medium text-foreground">세션</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              로그아웃하면 다시 로그인해야 합니다.
            </p>
            <form action="/auth/signout" method="post" className="mt-4">
              <button
                type="submit"
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                로그아웃
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
