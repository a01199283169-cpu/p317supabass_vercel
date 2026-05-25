"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { buildPageTree } from "@/lib/notion/build-page-tree";
import { createWelcomePage } from "@/lib/notion/create-welcome-page";
import type {
  Block,
  BlockType,
  PageContent,
  TrashedPage,
  WorkspaceData,
} from "@/types/notion";
import type { DbBlock, DbPage } from "@/types/database";

function toUiBlockType(type: string): BlockType {
  return type as BlockType;
}

// 페이지 + 하위 페이지 소프트 삭제 (휴지통 이동)
async function softDeleteRecursive(
  pageId: string,
  userId: string,
) {
  const supabase = await createClient();

  const { data: children } = await supabase
    .from("pages")
    .select("id")
    .eq("parent_id", pageId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  for (const child of children ?? []) {
    await softDeleteRecursive(child.id, userId);
  }

  await supabase
    .from("pages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", pageId)
    .eq("user_id", userId);
}

async function fetchActivePages(userId: string): Promise<DbPage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

function groupBlocksByPage(blocks: DbBlock[]): Record<string, DbBlock[]> {
  const map: Record<string, DbBlock[]> = {};
  for (const block of blocks) {
    if (!map[block.page_id]) map[block.page_id] = [];
    map[block.page_id].push(block);
  }
  return map;
}

function buildWorkspaceFromDb(
  dbPages: DbPage[],
  blocksByPage: Record<string, DbBlock[]>,
  user: { name: string; email: string },
): WorkspaceData {
  const pages = buildPageTree(
    dbPages.map((p) => ({
      id: p.id,
      title: p.title,
      icon: p.icon,
      parentId: p.parent_id,
      order: p.order,
    })),
  );

  const pageContents: Record<string, PageContent> = {};
  for (const p of dbPages) {
    const pageBlocks = blocksByPage[p.id] ?? [];
    pageContents[p.id] = {
      title: p.title,
      icon: p.icon,
      blocks: pageBlocks
        .sort((a, b) => a.order - b.order)
        .map((b) => ({
          id: b.id,
          type: toUiBlockType(b.type),
          content: b.content,
          checked: b.checked,
        })),
    };
  }

  return {
    pages,
    pageContents,
    selectedPageId: dbPages[0]?.id ?? null,
    userName: user.name,
    userEmail: user.email,
  };
}

// 사용자 워크스페이스 데이터 일괄 조회 (삭제되지 않은 페이지만)
export async function getWorkspaceData(): Promise<WorkspaceData> {
  const user = await requireUser();
  let dbPages = await fetchActivePages(user.id);

  // 첫 로그인 시 welcome 페이지 자동 생성
  if (dbPages.length === 0) {
    await createWelcomePage(user.id);
    dbPages = await fetchActivePages(user.id);
  }

  const supabase = await createClient();
  const pageIds = dbPages.map((p) => p.id);

  let allBlocks: DbBlock[] = [];
  if (pageIds.length > 0) {
    const { data, error } = await supabase
      .from("blocks")
      .select("*")
      .in("page_id", pageIds)
      .order("order", { ascending: true });

    if (error) throw new Error(error.message);
    allBlocks = data ?? [];
  }

  return buildWorkspaceFromDb(dbPages, groupBlocksByPage(allBlocks), user);
}

// 휴지통 페이지 목록
export async function getTrashedPages(): Promise<TrashedPage[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: pages, error } = await supabase
    .from("pages")
    .select("id, title, icon, deleted_at")
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (pages ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    deletedAt: p.deleted_at!,
  }));
}

// 새 페이지 생성
export async function createPage(parentId?: string | null) {
  const user = await requireUser();
  const supabase = await createClient();

  if (parentId) {
    const { data: parent } = await supabase
      .from("pages")
      .select("id")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!parent) {
      throw new Error("상위 페이지를 찾을 수 없습니다.");
    }
  }

  let countQuery = supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  countQuery = parentId
    ? countQuery.eq("parent_id", parentId)
    : countQuery.is("parent_id", null);

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(countError.message);

  const { data: page, error: pageError } = await supabase
    .from("pages")
    .insert({
      title: "제목 없음",
      icon: "📄",
      user_id: user.id,
      parent_id: parentId ?? null,
      order: count ?? 0,
    })
    .select()
    .single();

  if (pageError || !page) {
    throw new Error(pageError?.message ?? "페이지 생성 실패");
  }

  const { data: block, error: blockError } = await supabase
    .from("blocks")
    .insert({
      page_id: page.id,
      type: "paragraph",
      content: "",
      checked: false,
      order: 0,
    })
    .select()
    .single();

  if (blockError) {
    throw new Error(blockError.message);
  }

  return { ...page, blocks: block ? [block] : [] };
}

// 페이지 메타(제목/아이콘) 수정
export async function updatePageMeta(
  pageId: string,
  data: { title?: string; icon?: string },
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!page) {
    throw new Error("페이지를 찾을 수 없거나 권한이 없습니다.");
  }

  const { error } = await supabase
    .from("pages")
    .update({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.icon !== undefined ? { icon: data.icon } : {}),
    })
    .eq("id", pageId);

  if (error) throw new Error(error.message);
}

// 블록 전체 저장 (upsert + 삭제 동기화)
export async function savePageBlocks(pageId: string, blocks: Block[]) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!page) {
    throw new Error("페이지를 찾을 수 없거나 권한이 없습니다.");
  }

  const { data: existingBlocks, error: fetchError } = await supabase
    .from("blocks")
    .select("id")
    .eq("page_id", pageId);

  if (fetchError) throw new Error(fetchError.message);

  const incomingIds = new Set(blocks.map((b) => b.id));
  const toDelete = (existingBlocks ?? [])
    .map((b) => b.id)
    .filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error } = await supabase.from("blocks").delete().in("id", toDelete);
    if (error) throw new Error(error.message);
  }

  for (let index = 0; index < blocks.length; index++) {
    const block = blocks[index];
    const { error } = await supabase.from("blocks").upsert({
      id: block.id,
      page_id: pageId,
      type: block.type,
      content: block.content,
      checked: block.checked ?? false,
      order: index,
    });

    if (error) throw new Error(error.message);
  }
}

// 페이지 휴지통 이동 (소프트 삭제)
export async function deletePage(pageId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!page) {
    throw new Error("페이지를 찾을 수 없거나 권한이 없습니다.");
  }

  await softDeleteRecursive(pageId, user.id);
}

// 휴지통에서 페이지 복원
export async function restorePage(pageId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (!page) {
    throw new Error("복원할 페이지를 찾을 수 없습니다.");
  }

  // 상위 페이지가 삭제된 상태면 루트로 복원
  let parentId = page.parent_id;
  if (parentId) {
    const { data: parent } = await supabase
      .from("pages")
      .select("id")
      .eq("id", parentId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!parent) parentId = null;
  }

  let countQuery = supabase
    .from("pages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  countQuery = parentId
    ? countQuery.eq("parent_id", parentId)
    : countQuery.is("parent_id", null);

  const { count } = await countQuery;

  const { data: restored, error } = await supabase
    .from("pages")
    .update({
      deleted_at: null,
      parent_id: parentId,
      order: count ?? 0,
    })
    .eq("id", pageId)
    .select()
    .single();

  if (error || !restored) {
    throw new Error(error?.message ?? "페이지 복원 실패");
  }

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("order", { ascending: true });

  return { ...restored, blocks: blocks ?? [] };
}

// 페이지 영구 삭제
export async function permanentlyDeletePage(pageId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id")
    .eq("id", pageId)
    .eq("user_id", user.id)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (!page) {
    throw new Error("삭제할 페이지를 찾을 수 없습니다.");
  }

  const { error } = await supabase.from("pages").delete().eq("id", pageId);
  if (error) throw new Error(error.message);
}
