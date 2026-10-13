"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import type { TemplateInput } from "@/lib/notification-template-view";
import {
  createTemplate,
  restoreTemplate,
  setTemplateActive,
  updateTemplate,
  type TemplateDetail,
} from "@/lib/notification-templates";

// 알림 템플릿 등록 · 수정 · 되돌리기 · 사용 여부. 실패하면 화면이 입력값을 그대로 두고 폼 위 빨간 띠에 문장을 보인다.
// TODO(로그인): 권한(플랫폼 마스터 · 플랫폼 관리자)은 api 가 다시 본다. 로그인이 생기면 여기서도 세션을 확인한다.

/** 실패면 띠에 한 줄씩 보일 문장 목록. 400 검증 실패는 api 가 준 문장 목록 그대로다. */
export type TemplateResult = { ok: true; detail: TemplateDetail } | { ok: false; status?: number; messages: string[] };

const STALE = "다른 사람이 먼저 고쳤습니다. 새로 불러온 뒤 다시 저장해 주세요";

/**
 * api 오류를 화면 문장으로 바꾼다. 400 은 api 문장 목록을, 409 는 그사이 고침(낙관적 잠금)이면 고정 문구를,
 * 템플릿 코드 겹침 · 기본 문구 없음이면 api 문장을 보인다. 401 · 403 은 고정 문구, 그 밖은 일반 문구다.
 */
function failureOf(error: unknown, what: string): { status?: number; messages: string[] } {
  if (error instanceof ApiError) {
    const { status } = error;
    if (status === 401) return { status, messages: ["로그인이 만료되었습니다. 다시 로그인해 주세요."] };
    if (status === 403) return { status, messages: ["알림 템플릿을 고칠 권한이 없습니다."] };
    if (status === 400) return { status, messages: error.messages };
    if (status === 404) return { status, messages: ["알림 템플릿을 찾을 수 없습니다."] };
    // api 의 그사이 고침 문구는 「그사이 다른 운영자가 고쳤습니다 …」다. 그 밖의 409 는 api 문장이 더 정확하다.
    if (status === 409) return { status, messages: [error.message.startsWith("그사이") ? STALE : error.message] };
  }
  console.error(`알림 템플릿 ${what} 실패`, error);
  return { messages: [`알림 템플릿 ${what}에 실패했습니다. 잠시 후 다시 시도해 주세요.`] };
}

async function run(what: string, act: () => Promise<TemplateDetail>): Promise<TemplateResult> {
  let detail: TemplateDetail;
  try {
    detail = await act();
  } catch (error) {
    return { ok: false, ...failureOf(error, what) };
  }
  // 목록 · 상세를 모두 새로 그리게 한다(상세는 [id] 동적 경로라 layout 단위로 비운다).
  revalidatePath("/platform/notification-templates", "layout");
  return { ok: true, detail };
}

export async function createTemplateAction(input: TemplateInput, isActive: boolean): Promise<TemplateResult> {
  return run("등록", () => createTemplate({ ...input, isActive }));
}

export async function updateTemplateAction(id: number, input: TemplateInput, updatedAt: string): Promise<TemplateResult> {
  return run("저장", () => updateTemplate(id, { ...input, updatedAt }));
}

export async function restoreTemplateAction(id: number, updatedAt: string): Promise<TemplateResult> {
  return run("되돌리기", () => restoreTemplate(id, updatedAt));
}

export async function setTemplateActiveAction(id: number, isActive: boolean, updatedAt: string): Promise<TemplateResult> {
  return run("사용 여부 저장", () => setTemplateActive(id, isActive, updatedAt));
}
