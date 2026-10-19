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
 * 409 문구에서 겹친 코드를 꺼낸다. api 문구가 「…: CODE」 꼴이라는 데 기댄다
 * (whale-erp-api code-groups.service — 「이 그룹에 이미 있는 상세 코드입니다: INTERN」 등). 꼴이 다르면 undefined.
 */
export function conflictCode(message: string): string | undefined {
  const at = message.lastIndexOf(": ");
  if (at < 0) return undefined;
  const code = normalizeCode(message.slice(at + 2));
  return CODE_PATTERN.test(code) ? code : undefined;
}
