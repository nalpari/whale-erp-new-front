"use server";

import { authHeaders, expiredFailureOf, request } from "@/lib/api";
import { getBpAdmins } from "@/lib/bp-admins";
import { getBpRoleGroups } from "@/lib/bp-role-groups";
import type { GuideCountKind } from "@/lib/start-guide";

// 미니 카드 자동 띄우기의 건수(2026-11-16 사용자 지정) — 권한 그룹 · 관리자 · 직원 목록을 첫 쪽만 불러 total 을 준다.
// 0건이면 카드 슬롯(guide-mini-card)이 그 단계 카드를 띄운다. 탭 BP 는 다른 목록처럼 authHeaders 의 X-Bp-Code-Id 로 간다.
// 실패(권한 없음 · 서버 오류)는 카드를 띄우지 않으면 그만이라 오류 문구 없이 ok: false 만 돌려준다. 만료는 useAction 이 팝업으로 바꾼다.

type CountResult = { ok: true; total: number } | NonNullable<ReturnType<typeof expiredFailureOf>> | { ok: false };

export async function getGuideCountAction(kind: Exclude<GuideCountKind, "stores">): Promise<CountResult> {
  try {
    if (kind === "roleGroups") return { ok: true, total: (await getBpRoleGroups(1)).total };
    if (kind === "admins") return { ok: true, total: (await getBpAdmins({ page: 1, pageSize: 20, storeIds: [] })).total };
    // 직원은 조건 없이 — api 는 재직 상태 구분 없이 업무 범위 전체를 센다(3팀 목록 lib 은 화면 필터 모양이라 쓰지 않는다)
    const staff = await request<{ total: number }>("/staff-members?page=1&pageSize=20", { method: "GET", headers: await authHeaders() });
    return { ok: true, total: staff.total };
  } catch (error) {
    const expired = expiredFailureOf(error);
    if (expired) return expired;
    console.warn(`미니 카드 건수(${kind}) 조회 실패`, error);
    return { ok: false };
  }
}
