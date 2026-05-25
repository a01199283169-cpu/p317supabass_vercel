import { redirect } from "next/navigation";

// 회원가입은 Google OAuth로 통합 — /login으로 리다이렉트
export default function RegisterPage() {
  redirect("/login");
}
