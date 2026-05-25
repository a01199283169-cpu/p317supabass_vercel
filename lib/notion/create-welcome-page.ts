import { createClient } from "@/lib/supabase/server";

// 신규 Google 로그인 사용자용 welcome 페이지 생성
export async function createWelcomePage(userId: string) {
  const supabase = await createClient();

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .insert({
      title: "시작하기",
      icon: "🚀",
      user_id: userId,
      order: 0,
    })
    .select()
    .single();

  if (pageError || !page) {
    throw new Error(pageError?.message ?? "welcome 페이지 생성 실패");
  }

  const { error: blocksError } = await supabase.from("blocks").insert([
    {
      page_id: page.id,
      type: "heading1",
      content: "노션에 오신 것을 환영합니다! 👋",
      checked: false,
      order: 0,
    },
    {
      page_id: page.id,
      type: "paragraph",
      content:
        "노션은 메모, 문서, 위키, 프로젝트 관리를 하나로 통합한 올인원 워크스페이스입니다.",
      checked: false,
      order: 1,
    },
    {
      page_id: page.id,
      type: "heading2",
      content: "시작하기",
      checked: false,
      order: 2,
    },
    {
      page_id: page.id,
      type: "todo",
      content: "새 페이지 만들기",
      checked: false,
      order: 3,
    },
    {
      page_id: page.id,
      type: "todo",
      content: "블록 타입 변경해보기 ('/' 키 사용)",
      checked: false,
      order: 4,
    },
    {
      page_id: page.id,
      type: "todo",
      content: "사이드바에서 페이지 탐색하기",
      checked: false,
      order: 5,
    },
  ]);

  if (blocksError) {
    throw new Error(blocksError.message);
  }

  return page;
}
