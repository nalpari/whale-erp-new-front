// BP 공통코드 관리 화면(src/app/bp-code-groups)의 판단 — 패널이 왜 막혔는지, 지울 수 있는 행인지, 화면 주소.
// 플랫폼 공통코드와 같은 초안 다루기(code-drafts.ts)에 BP 에만 있는 규칙(okf/config.md 공통코드)을 더한 순수 함수라 node --test 로 검사한다.
// node --test 가 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { BpCodeGroup, BpCodeItem, BpManageOwnerCode } from "./bp-codes";
import { codePanelAccess, type ItemDraft } from "./code-drafts.ts";

/** 상세 코드 패널의 한 행 — 플랫폼 행에 관리 주체와 플랫폼 사용중지가 더 있다. 새 행은 BP전용으로 저장된다(api 가 정한다). */
export type BpItemDraft = ItemDraft & { manageOwnerCode: BpManageOwnerCode; isPlatformInactive: boolean };

export const toBpItemDraft = (i: BpCodeItem): BpItemDraft => ({ ...i, key: i.itemCode, added: false });

/** 새 행 — 맨 끝에 붙고 사용으로 시작한다. 표시 순서는 renumberAdded 가 매긴다. */
export const newBpItemDraft = (key: string): BpItemDraft => ({
  key,
  itemCode: "",
  label: "",
  status: "ACTIVE",
  sortOrder: 0,
  added: true,
  manageOwnerCode: "BP_ONLY",
  isPlatformInactive: false,
});

/**
 * 패널이 막힌 이유 — 플랫폼 사용자(조회만) · 플랫폼고정 그룹(조회만). 막히지 않았으면 null.
 * 둘 다 api 도 막는다(403 · 409) — 화면은 버튼을 숨기거나 잠그고 띠로 이유를 알린다.
 * 사용중지 그룹은 api 가 BP 에게 보내지 않으므로(목록에서 빠지고 상세 코드는 404) 따로 막지 않는다.
 */
export type BpPanelLock = "platform-user" | "fixed" | null;

export function bpPanelLock(group: Pick<BpCodeGroup, "manageOwnerCode"> | undefined, isPlatform: boolean): BpPanelLock {
  if (isPlatform) return "platform-user";
  if (group?.manageOwnerCode === "PLATFORM_FIXED") return "fixed";
  return null;
}

/**
 * 패널의 메뉴 권한(code-drafts.ts 의 codePanelAccess)에 막힌 이유를 더한다. 막혔으면 고치기 · 순서 옮기기 · 추가 · 삭제 · 저장을 모두 막는다.
 */
export function bpCodePanelAccess(o: { lock: BpPanelLock; update: boolean; create: boolean; delete?: boolean; loadFailed?: boolean }) {
  const base = codePanelAccess(o);
  const open = o.lock === null;
  return { manage: base.manage && open, canAdd: base.canAdd && open, canDelete: base.canDelete && open, canSave: base.canSave && open };
}

/**
 * BP 가 지울 수 있는 행 — 저장된 플랫폼제공 · BP전용 코드(2026-10-22). 플랫폼고정 코드는 지우지 못한다(그룹이 조회만이라 패널도 잠긴다).
 * 새 행은 이동 칸의 [×]로 뺀다.
 */
export const bpDeletable = (d: Pick<BpItemDraft, "added" | "manageOwnerCode">) =>
  !d.added && (d.manageOwnerCode === "BP_ONLY" || d.manageOwnerCode === "PLATFORM_PROVIDED");

/** 화면 주소의 조건 — 쪽 · 고른 그룹 · 검색(그룹 코드 · 그룹명). 새로 고쳐도, 링크를 보내도 같은 화면이 선다. */
export type BpCodesQuery = { page?: number; group?: string; groupCode?: string; groupName?: string };

/** 화면 주소(폴더 경로). 탭 BP 는 부르는 쪽이 bpPath 로 씌운다 — /bp/{id}/bp-code-groups. 기본값은 뺀다. */
export function bpCodesHref({ page, group, groupCode, groupName }: BpCodesQuery): string {
  const params = new URLSearchParams();
  if (groupCode) params.set("groupCode", groupCode);
  if (groupName) params.set("groupName", groupName);
  if (page && page > 1) params.set("page", String(page));
  if (group) params.set("group", group);
  const query = params.toString();
  return `/bp-code-groups${query ? `?${query}` : ""}`;
}
