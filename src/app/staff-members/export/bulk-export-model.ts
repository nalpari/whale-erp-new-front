// 직원 자료 일괄 저장 화면(/staff-members/export, WHALEERP-337)의 판정. node --test 가 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { Scope } from "../../../lib/browser-storage.ts";
import { formatDate } from "../../../lib/format.ts";
import type { AdminStore } from "../../../lib/session.ts";
import { isUnusableScope, scopeStores } from "../../../lib/store-scope.ts";

// shortcut: api(Plane 336, whale-erp-api docs/plans/2026-10-29-staff-records-export.md)가 아직 openapi.json 에 싣지 않아 응답 모양을 여기 한 곳에 손으로 적었다.
// 실리면 api-types.generated.ts 의 타입으로 바꾼다.
export type BulkExportStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";

/** GET /staff-members/bulk-exports 의 items · POST /staff-members/bulk-exports 201 */
export interface BulkExport {
  bulkExportId: number;
  requestedAt: string;
  requesterName: string;
  staffCount: number;
  /** 그 요청의 업무 범위. 빈 목록이면 관리 점포 전체 — [다시 요청]이 이 값으로 다시 보낸다 */
  storeIds: number[];
  status: BulkExportStatus;
  completedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
  failureReason: string | null;
}

/** GET /staff-members/bulk-exports */
export interface BulkExportList {
  items: BulkExport[];
  total: number;
}

/** GET /staff-members/bulk-exports/preview */
export interface BulkExportPreview {
  storeCount: number;
  staffCount: number;
  employedCount: number;
  retiredCount: number;
  /** 같은 범위의 요청을 만드는 중이다 — 새로 요청하지 못한다 */
  inProgress: boolean;
}

/** POST /staff-members/bulk-exports/:id/download — url 은 5분짜리 서명 주소라 저장하지 않고 바로 연다 */
export interface BulkExportLink {
  url: string;
  fileName: string;
  expiresAt: string;
}

/** 일괄 저장을 쓰는 역할 — BP 마스터 · 가맹마스터(운영 정책 RET-09). 다른 역할은 진입점을 숨기고 api 도 403 으로 막는다 */
export const canBulkExport = (roleTypeCode: string) => roleTypeCode === "BM" || roleTypeCode === "FM";

/**
 * 헤더 업무 범위 → api 의 storeIds. 전체는 [](api 가 관리 점포 전체로 본다). 이 탭에서 쓸 수 없는 범위(점포가 로그인 정보에 없음)도
 * [] 로 본다 — 헤더도 그 범위를 「전체」로 되돌리므로(restoredScope) 표시(scopeTextOf)와 같다.
 */
export const storeIdsOfScope = (scope: Scope, stores: readonly AdminStore[]): number[] =>
  isUnusableScope(scope, stores) ? [] : scopeStores(scope, stores).map((s) => s.storeId);

/** 업무 범위 칸 글자. 점포 수는 api 미리 보기(storeCount)를 화면이 붙인다 */
export function scopeTextOf(scope: Scope, stores: readonly AdminStore[]): string {
  if (isUnusableScope(scope, stores)) return "전체 점포";
  switch (scope.type) {
    case "ALL":
      return "전체 점포";
    case "DIRECT":
      return "직영 전체";
    case "FRANCHISE":
      return "가맹 전체";
    case "STORE":
      return stores.find((s) => s.storeId === scope.storeId)?.name ?? "전체 점포";
  }
}

/** 미리 보기 주소 — storeIds 를 이름 하나씩 되풀이해 싣는다(api 모양). 빈 목록이면 쿼리 없이 */
export function previewPathOf(storeIds: readonly number[]): string {
  const search = new URLSearchParams(storeIds.map((id) => ["storeIds", String(id)])).toString();
  return `/staff-members/bulk-exports/preview${search ? `?${search}` : ""}`;
}

/** 지난 요청 표 한 줄의 상태. ready.until 은 받을 수 있는 마지막 날(MM-DD, 한국 시간) */
export type BulkExportView = { kind: "making" } | { kind: "ready"; until: string } | { kind: "expired" } | { kind: "failed" };

export function bulkExportViewOf(item: Pick<BulkExport, "status" | "isExpired" | "expiresAt">): BulkExportView {
  switch (item.status) {
    case "PENDING":
    case "PROCESSING":
      return { kind: "making" };
    case "SUCCEEDED":
      return item.isExpired ? { kind: "expired" } : { kind: "ready", until: formatDate(item.expiresAt).slice(5) };
    case "FAILED":
      return { kind: "failed" };
  }
}

/** 만드는 중인 요청이 있으면 화면이 10초마다 목록을 다시 읽는다 */
export const hasMaking = (items: readonly BulkExport[]) => items.some((i) => bulkExportViewOf(i).kind === "making");

const scopeKeyOf = (storeIds: readonly number[]) => [...storeIds].sort((a, b) => a - b).join(",");

/** 같은 범위(점포 id 묶음, 순서 무시)의 요청을 만드는 중인지 — 그 줄의 [다시 요청]을 끈다. 막는 것은 api 409 다 */
export const isScopeMaking = (items: readonly BulkExport[], storeIds: readonly number[]) =>
  items.some((i) => bulkExportViewOf(i).kind === "making" && scopeKeyOf(i.storeIds) === scopeKeyOf(storeIds));

/** [일괄 저장 요청] · [다시 요청]을 막는 까닭. null 이면 누를 수 있다 */
export function requestBlockOf(preview: BulkExportPreview): string | null {
  if (preview.staffCount === 0) return "업무 범위에 담을 직원 자료가 없습니다";
  if (preview.inProgress) return "이 업무 범위의 파일을 만드는 중입니다. 다 만들면 지난 요청에서 내려받을 수 있습니다";
  return null;
}
