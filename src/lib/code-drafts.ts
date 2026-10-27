// 공통코드 화면 두 패널(그룹 목록 · 상세 코드)의 초안 다루기 — 바뀜 판정, 저장 요청 만들기, 409 문구 해석.
// 패널(src/app/code-groups/code-*-panel.tsx · src/app/bp-code-groups/bp-code-item-panel.tsx)에서 뺀 순수 함수라 node --test 로 검사한다(code-drafts.test.ts).
// 상세 코드 함수는 칸이 더 있는 BP 행(관리 주체 등 — bp-code-drafts.ts)도 받도록 행 모양을 넓게 받는다.
import type { CodeGroup, CodeItem, ManageOwnerCode, SaveCodeGroupsInput, SaveCodeItemsInput, UseStatus } from "./codes";
import { CODE_PATTERN, normalizeCode } from "./code-validation.ts";

/** 그룹 목록 패널의 한 행. added 는 저장 전 추가한 입력 행(하나만 둔다). */
export type GroupDraft = {
  groupCode: string;
  groupName: string;
  manageOwnerCode: ManageOwnerCode | "";
  isBpApplied: boolean;
  status: UseStatus;
  sortOrder: number;
  added: boolean;
};

/**
 * 상세 코드 패널의 한 행. key — 기존 행은 상세 코드, 새 행은 저장 전 임시 번호(new-1 …). 새 행의 코드는 입력 중에 바뀌므로 키로 쓰지 않는다.
 * deleted — 기존 행에 [삭제]를 눌러 둔 것. [저장] 때 지우고, 그 전에는 [되돌리기]로 푼다.
 */
export type ItemDraft = { key: string; itemCode: string; label: string; status: UseStatus; sortOrder: number; added: boolean; deleted?: boolean };

/** 저장된 행과 견줘 바뀌었는지. 저장할 때 앞뒤 공백을 빼고 보내므로, 공백만 바꾼 것은 바뀐 것으로 보지 않는다. */
export function groupChanged(d: GroupDraft, saved: CodeGroup | undefined): boolean {
  return !saved || saved.groupName !== d.groupName.trim() || saved.status !== d.status || saved.sortOrder !== d.sortOrder;
}

export function itemChanged(d: ItemDraft, saved: Pick<CodeItem, "label" | "status" | "sortOrder"> | undefined): boolean {
  return !saved || saved.label !== d.label.trim() || saved.status !== d.status || saved.sortOrder !== d.sortOrder;
}

/** 그룹 목록 패널 저장 요청. 새 행은 관리 주체를 고른 뒤에만 싣는다 — 검사(validate)가 먼저 막지만 빈 값이 api 로 나가지 않게 한 번 더 본다. */
export function buildSaveGroupsInput(drafts: readonly GroupDraft[], groups: readonly CodeGroup[]): SaveCodeGroupsInput {
  const saved = new Map(groups.map((g) => [g.groupCode, g]));
  const updates = drafts
    .filter((d) => !d.added && groupChanged(d, saved.get(d.groupCode)))
    .map(({ groupCode, groupName, status, sortOrder }) => ({ groupCode, groupName: groupName.trim(), status, sortOrder }));
  const creates = drafts.flatMap((d) =>
    d.added && d.manageOwnerCode
      ? [{ groupCode: normalizeCode(d.groupCode), groupName: d.groupName.trim(), manageOwnerCode: d.manageOwnerCode, status: d.status, sortOrder: d.sortOrder }]
      : [],
  );
  return { updates, creates };
}

/** 상세 코드 패널 저장 요청. 바뀐 기존 행만 updates 에, 새 행은 모두 creates 에, 지우기로 한 기존 행은 deletes 에 싣는다(지울 행은 고치지 않는다). */
export function buildSaveItemsInput(drafts: readonly ItemDraft[], items: readonly Pick<CodeItem, "itemCode" | "label" | "status" | "sortOrder">[]): SaveCodeItemsInput {
  const saved = new Map(items.map((i) => [i.itemCode, i]));
  const updates = drafts
    .filter((d) => !d.added && !d.deleted && itemChanged(d, saved.get(d.itemCode)))
    .map(({ itemCode, label, status, sortOrder }) => ({ itemCode, label: label.trim(), status, sortOrder }));
  const creates = drafts
    .filter((d) => d.added && !d.deleted)
    .map((d) => ({ itemCode: normalizeCode(d.itemCode), label: d.label.trim(), status: d.status, sortOrder: d.sortOrder }));
  const deletes = drafts.filter((d) => !d.added && d.deleted).map((d) => d.itemCode);
  return { updates, creates, deletes };
}

/** 패널에 저장할 변경이 있는지 — 새 행, 지우기로 한 행, 바뀐 기존 행. */
export function itemsDirty(drafts: readonly ItemDraft[], items: readonly Pick<CodeItem, "itemCode" | "label" | "status" | "sortOrder">[]): boolean {
  const saved = new Map(items.map((i) => [i.itemCode, i]));
  return drafts.some((d) => d.added || d.deleted || itemChanged(d, saved.get(d.itemCode)));
}

/**
 * 패널의 메뉴 권한 — 기존 행 고치기 · 순서 옮기기 · BP 적용은 수정(manage), [추가]와 새 행 입력은 등록(canAdd),
 * 상세 코드 [삭제]는 삭제(canDelete — 그룹 패널에는 삭제가 없다), [저장]은 셋 중 하나(canSave).
 * 상세 코드를 못 불러왔으면(loadFailed) 모두 막는다. 막는 것은 api 다.
 */
export function codePanelAccess({
  update,
  create,
  delete: remove = false,
  loadFailed = false,
}: {
  update: boolean;
  create: boolean;
  delete?: boolean;
  loadFailed?: boolean;
}) {
  const manage = update && !loadFailed;
  const canAdd = create && !loadFailed;
  const canDelete = remove && !loadFailed;
  return { manage, canAdd, canDelete, canSave: manage || canAdd || canDelete };
}

/** 플랫폼 공통코드에서 이 그룹의 상세 코드를 지울 수 있는지 — 플랫폼고정 그룹은 사용 상태로만 관리한다(api 409, 2026-10-22). */
export const itemsDeletable = (manageOwnerCode: ManageOwnerCode | undefined) => manageOwnerCode !== "PLATFORM_FIXED";

/** 새 행은 저장된 행 뒤에 이어 붙고, 마지막 저장된 순서 다음부터 차례로 번호를 받는다. */
export function renumberAdded<D extends ItemDraft>(rows: readonly D[]): D[] {
  let next = Math.max(0, ...rows.filter((r) => !r.added).map((r) => r.sortOrder));
  return rows.map((r) => (r.added ? { ...r, sortOrder: ++next } : r));
}

/**
 * 새 목록이 왔을 때의 행. keep 이면(저장을 시작한 목록을 대신하는 목록이다 — 뒤 단계가 실패했거나 결과를 모른다)
 * 아직 저장하지 못한 것을 새 목록에 다시 얹는다 — 새 행은 뒤에 이어 두고, [삭제]로 표시해 둔 기존 행은 새 목록에 그 코드가
 * 남아 있으면(삭제가 실패했다) 다시 표시한다. 아니면 새 목록으로 다시 시작한다. 그룹 행에는 삭제가 없어 새 행만 잇는다.
 */
export function withKeptPending<D extends { added: boolean; deleted?: boolean; key?: string }>(
  fresh: readonly D[],
  current: readonly D[],
  keep: boolean,
): D[] {
  if (!keep) return [...fresh];
  const deleting = new Set(current.filter((d) => !d.added && d.deleted).map((d) => d.key));
  return [...fresh.map((d) => (deleting.has(d.key) ? { ...d, deleted: true } : d)), ...current.filter((d) => d.added)];
}

/** 이어 둔 것(새 행 · 지울 행)이 있는지 — 없으면 지난 저장의 오류 · 띠를 지운다. */
export const hasPending = (rows: readonly { added: boolean; deleted?: boolean }[]) => rows.some((d) => d.added || d.deleted);

/** 다 저장한 뒤의 토스트. 새로 만든 것이 있거나 고치기 · 지우기를 함께 했으면 ‘저장되었습니다.’, 지우기만 했으면 ‘삭제되었습니다.’, 고치기만 했으면 ‘수정되었습니다.’ */
export function savedToast({ updates, creates, deletes }: SaveCodeItemsInput): "saved" | "deleted" | "updated" {
  if (creates.length || (updates.length && deletes.length)) return "saved";
  return deletes.length ? "deleted" : "updated";
}

/**
 * 같은 내용의 목록이 새 참조로 왔을 때(다른 패널 저장 · 레이아웃 무효화 등) 저장 기준(savingFrom)을 그 참조로 옮긴다.
 * 기준은 참조로 견주므로 옮기지 않으면 다음에 오는 진짜 목록에서 새 행을 잇지 못하고, 등록 실패 안내와 입력이 함께 사라진다.
 * 기준이 지금 목록이 아니면(저장 중이 아니거나 이미 다른 목록) 그대로 둔다.
 */
export function followSameRows<L>(savingFrom: L | null, shown: L, next: L): L | null {
  return savingFrom !== null && savingFrom === shown ? next : savingFrom;
}

/** 등록이 성공한 새 행을 뺀다 — 다시 받은 목록이 먼저 와서 이어 뒀거나, 무효화가 늦어 아직 새 행으로 남은 것. */
export function dropCreatedAdded<D extends ItemDraft>(rows: readonly D[], createdCodes: readonly string[]): D[] {
  const created = new Set(createdCodes);
  return rows.filter((d) => !(d.added && created.has(normalizeCode(d.itemCode))));
}

/**
 * 409 문구에서 겹친 코드를 꺼낸다. api 문구가 「…: CODE」 꼴이라는 데 기댄다
 * (whale-erp-api code-groups.service — 「이 그룹에 이미 있는 상세 코드입니다: INTERN」 등). 동시 등록 경합이면
 * 「…: A, B」처럼 여럿이라 첫 코드를 꺼낸다. 꼴이 다르면 undefined.
 */
export function conflictCode(message: string): string | undefined {
  const at = message.lastIndexOf(": ");
  if (at < 0) return undefined;
  const code = normalizeCode(message.slice(at + 2).split(",")[0]);
  return CODE_PATTERN.test(code) ? code : undefined;
}

export const UNUSABLE_CODE = "이 그룹에서 사용할 수 없는 상세 코드입니다";

/** api 가 상세 코드 등록을 겹침으로 막을 때의 문구 앞부분(플랫폼 · BP 공통코드). */
const DUPLICATE_PREFIXES = ["이 그룹에 이미 있는 상세 코드입니다", "플랫폼이 등록한 상세 코드와 겹칩니다"];

/**
 * 상세 코드 등록 409 문구를 화면 문구로 바꾼다. 겹친 코드가 지금 표(visibleCodes)에 없으면 — 화면에 안 보이는 행(플랫폼에서는 BP 의
 * BP전용, BP 에서는 받지 않았거나 지운 코드)이다 — api 문구(「이 그룹에 이미 있는 상세 코드입니다: G2」 등) 대신 「이 그룹에서 사용할 수
 * 없는 상세 코드입니다: G2」로 바꾼다. 표에 있는 코드와 겹친 것은 저장 전에 화면 검사가 막으므로 여기 오지 않는다. 다른 문구는 그대로.
 */
export function unusableCodeMessage(message: string, visibleCodes: readonly string[]): string {
  const at = message.lastIndexOf(": ");
  if (at < 0 || !DUPLICATE_PREFIXES.some((p) => message.startsWith(p))) return message;
  const codes = message.slice(at + 2);
  const visible = new Set(visibleCodes);
  return codes.split(",").some((c) => visible.has(normalizeCode(c))) ? message : `${UNUSABLE_CODE}: ${codes}`;
}

/** 주소의 검색어 다듬기(플랫폼 · BP 공통코드 그룹 검색) — 앞뒤 공백을 빼고 api 상한(그룹 코드 20 · 그룹명 50)으로 자른다. 대소문자는 api 가 가리지 않아 그대로 둔다. */
export const searchTerm = (raw: string | string[] | undefined, max: number) => (typeof raw === "string" ? raw.trim().slice(0, max) : "");

/** 필터의 관리주체 — 공통코드 그룹이 쓰는 둘(BP전용은 상세 코드에만 있다). */
export const GROUP_OWNERS = ["PLATFORM_FIXED", "PLATFORM_PROVIDED"] as const;
export type GroupOwner = (typeof GROUP_OWNERS)[number];

/** 관리주체 띠지 모양 — 플랫폼고정만 하늘색(sky), 플랫폼제공 · BP전용은 기본 회색(2026-10-27 사용자 지정). */
export const ownerTagTone = (code: string) => (code === "PLATFORM_FIXED" ? "sky" : "default");

/** 주소의 ?manageOwnerCode — 둘 중 하나만 고른 때만 값이 있다. 둘 다 고르거나 다른 값이면 전체(undefined). */
export const ownerTerm = (raw: string | string[] | undefined): GroupOwner | undefined =>
  GROUP_OWNERS.find((o) => o === raw);
