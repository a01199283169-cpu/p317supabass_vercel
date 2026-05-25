import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// 로그아웃 — 세션 삭제 후 로그인 페이지로
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
