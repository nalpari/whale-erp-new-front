// 공통코드 화면 두 패널(그룹 목록 · 상세 코드)의 초안 다루기 — 바뀜 판정, 저장 요청 만들기, 409 문구 해석.
// 패널(src/app/code-groups/code-*-panel.tsx)에서 뺀 순수 함수라 node --test 로 검사한다(code-drafts.test.ts).
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

/** 상세 코드 패널의 한 행. key — 기존 행은 상세 코드, 새 행은 저장 전 임시 번호(new-1 …). 새 행의 코드는 입력 중에 바뀌므로 키로 쓰지 않는다. */
export type ItemDraft = { key: string; itemCode: string; label: string; status: UseStatus; sortOrder: number; added: boolean };

/** 저장된 행과 견줘 바뀌었는지. 저장할 때 앞뒤 공백을 빼고 보내므로, 공백만 바꾼 것은 바뀐 것으로 보지 않는다. */
export function groupChanged(d: GroupDraft, saved: CodeGroup | undefined): boolean {
  return !saved || saved.groupName !== d.groupName.trim() || saved.status !== d.status || saved.sortOrder !== d.sortOrder;
}

export function itemChanged(d: ItemDraft, saved: CodeItem | undefined): boolean {
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

/** 상세 코드 패널 저장 요청. 바뀐 기존 행만 updates 에, 새 행은 모두 creates 에 싣는다. */
export function buildSaveItemsInput(drafts: readonly ItemDraft[], items: readonly CodeItem[]): SaveCodeItemsInput {
  const saved = new Map(items.map((i) => [i.itemCode, i]));
  const updates = drafts
    .filter((d) => !d.added && itemChanged(d, saved.get(d.itemCode)))
    .map(({ itemCode, label, status, sortOrder }) => ({ itemCode, label: label.trim(), status, sortOrder }));
  const creates = drafts
    .filter((d) => d.added)
    .map((d) => ({ itemCode: normalizeCode(d.itemCode), label: d.label.trim(), status: d.status, sortOrder: d.sortOrder }));
  return { updates, creates };
}

/**
 * 패널의 메뉴 권한 — 기존 행 고치기 · 순서 옮기기 · BP 적용은 수정(manage), [추가]와 새 행 입력은 등록(canAdd),
 * [저장]은 둘 중 하나(canSave). 상세 코드를 못 불러왔으면(loadFailed) 모두 막는다. 막는 것은 api 다.
 */
export function codePanelAccess({ update, create, loadFailed = false }: { update: boolean; create: boolean; loadFailed?: boolean }) {
  const manage = update && !loadFailed;
  const canAdd = create && !loadFailed;
  return { manage, canAdd, canSave: manage || canAdd };
}

/** 새 행은 저장된 행 뒤에 이어 붙고, 마지막 저장된 순서 다음부터 차례로 번호를 받는다. */
export function renumberAdded(rows: readonly ItemDraft[]): ItemDraft[] {
  let next = Math.max(0, ...rows.filter((r) => !r.added).map((r) => r.sortOrder));
  return rows.map((r) => (r.added ? { ...r, sortOrder: ++next } : r));
}

/**
 * 새 목록이 왔을 때의 행. keep 이면(저장을 시작한 목록을 대신하는 목록이다 — 등록만 실패했거나 결과를 모른다)
 * 아직 저장하지 못한 새 행을 새 목록 뒤에 이어 둔다. 아니면 새 목록으로 다시 시작한다.
 */
export function withKeptAdded<D extends { added: boolean }>(fresh: readonly D[], current: readonly D[], keep: boolean): D[] {
  return [...fresh, ...(keep ? current.filter((d) => d.added) : [])];
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
export function dropCreatedAdded(rows: readonly ItemDraft[], createdCodes: readonly string[]): ItemDraft[] {
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
