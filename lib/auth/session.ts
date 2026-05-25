import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

// Supabase auth.users 기반 세션 — CRUD 레이어는 이 인터페이스만 사용
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  return {
    id: user.id,
    name:
      (user.user_metadata?.full_name as string | undefined) ??
      user.email.split("@")[0],
    email: user.email,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user;
}
