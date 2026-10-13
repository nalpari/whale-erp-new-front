// node --test src/lib/code-drafts.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { CodeGroup, CodeItem } from "./codes";
import { buildSaveGroupsInput, buildSaveItemsInput, conflictCode, groupChanged, itemChanged, type GroupDraft, type ItemDraft } from "./code-drafts.ts";

const items: CodeItem[] = [
  { itemCode: "FULL", label: "정직원", status: "ACTIVE", sortOrder: 1 },
  { itemCode: "PART", label: "파트타이머", status: "ACTIVE", sortOrder: 2 },
] as CodeItem[];
const itemDraft = (i: CodeItem, patch: Partial<ItemDraft> = {}): ItemDraft => ({ ...i, key: i.itemCode, added: false, ...patch });

const groups: CodeGroup[] = [
  { groupCode: "EMP_TYPE", groupName: "고용 형태", manageOwnerCode: "PLATFORM_PROVIDED", isBpApplied: true, status: "ACTIVE", sortOrder: 1 },
] as CodeGroup[];
const groupDraft = (g: CodeGroup, patch: Partial<GroupDraft> = {}): GroupDraft => ({ ...g, added: false, ...patch });
const newGroup = (patch: Partial<GroupDraft> = {}): GroupDraft => ({
  groupCode: "pay_cycle ",
  groupName: " 급여 주기 ",
  manageOwnerCode: "PLATFORM_FIXED",
  isBpApplied: false,
  status: "ACTIVE",
  sortOrder: 21,
  added: true,
  ...patch,
});

test("공백만 바꾼 것은 바뀐 것으로 보지 않는다 — 저장할 때 공백을 빼고 보내므로", () => {
  assert.equal(itemChanged(itemDraft(items[0], { label: " 정직원 " }), items[0]), false);
  assert.equal(groupChanged(groupDraft(groups[0], { groupName: "고용 형태 " }), groups[0]), false);
  assert.equal(itemChanged(itemDraft(items[0], { label: "정규직" }), items[0]), true);
  assert.equal(itemChanged(itemDraft(items[0], { sortOrder: 2 }), items[0]), true, "끌어서 바꾼 순서도 바뀐 것");
  assert.equal(itemChanged(itemDraft(items[0], { status: "INACTIVE" }), items[0]), true);
});

test("상세 코드 저장 요청 — 바뀐 기존 행만 updates, 새 행은 creates", () => {
  const input = buildSaveItemsInput(
    [
      itemDraft(items[0], { label: " 정규직 " }),
      itemDraft(items[1]),
      { key: "new-1", itemCode: " intern ", label: " 인턴 ", status: "ACTIVE", sortOrder: 3, added: true },
    ],
    items,
  );
  assert.deepEqual(input.updates, [{ itemCode: "FULL", label: "정규직", status: "ACTIVE", sortOrder: 1 }]);
  assert.deepEqual(input.creates, [{ itemCode: "INTERN", label: "인턴", status: "ACTIVE", sortOrder: 3 }]);
});

test("아무것도 안 바꾸면 빈 요청", () => {
  assert.deepEqual(buildSaveItemsInput(items.map((i) => itemDraft(i)), items), { updates: [], creates: [] });
});

test("그룹 저장 요청 — 새 그룹 코드는 대문자 · 공백 제거, 이름은 공백 제거", () => {
  const input = buildSaveGroupsInput([groupDraft(groups[0], { groupName: "근로 형태" }), newGroup()], groups);
  assert.deepEqual(input.updates, [{ groupCode: "EMP_TYPE", groupName: "근로 형태", status: "ACTIVE", sortOrder: 1 }]);
  assert.deepEqual(input.creates, [
    { groupCode: "PAY_CYCLE", groupName: "급여 주기", manageOwnerCode: "PLATFORM_FIXED", status: "ACTIVE", sortOrder: 21 },
  ]);
});

test("관리 주체를 고르지 않은 새 그룹은 요청에 싣지 않는다", () => {
  assert.deepEqual(buildSaveGroupsInput([newGroup({ manageOwnerCode: "" })], groups).creates, []);
});

test("409 문구에서 겹친 코드를 꺼낸다", () => {
  assert.equal(conflictCode("이 그룹에 이미 있는 상세 코드입니다: INTERN"), "INTERN");
  assert.equal(conflictCode("한 요청 안에서 상세 코드가 겹칩니다: PART_TIME"), "PART_TIME");
  assert.equal(conflictCode("이미 있는 그룹 코드입니다"), undefined, "코드가 없는 꼴");
  assert.equal(conflictCode("겹칩니다: 인턴"), undefined, "코드 형식이 아니면 쓰지 않는다");
});
