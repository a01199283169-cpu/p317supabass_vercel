import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">로그인</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Google 계정으로 로그인하세요
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {error && (
            <p className="mb-4 text-center text-sm text-destructive">
              로그인에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}
