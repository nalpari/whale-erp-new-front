// node --test src/lib/code-drafts.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { CodeGroup, CodeItem } from "./codes";
import {
  buildSaveGroupsInput,
  buildSaveItemsInput,
  codePanelAccess,
  conflictCode,
  dropCreatedAdded,
  followSameRows,
  groupChanged,
  itemChanged,
  renumberAdded,
  withKeptAdded,
  type GroupDraft,
  type ItemDraft,
} from "./code-drafts.ts";

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
  assert.equal(conflictCode("이 그룹에 이미 있는 상세 코드입니다: INTERN, PART_TIME"), "INTERN", "동시 등록 경합은 첫 코드");
  assert.equal(conflictCode("이미 있는 그룹 코드입니다"), undefined, "코드가 없는 꼴");
  assert.equal(conflictCode("겹칩니다: 인턴"), undefined, "코드 형식이 아니면 쓰지 않는다");
  assert.equal(conflictCode("이미 있는 그룹 코드입니다: INTERN ,PART_TIME"), "INTERN", "쉼표 앞뒤 공백은 다듬는다");
});

test("권한 — [추가]는 등록, 기존 행 고치기는 수정, [저장]은 둘 중 하나. 상세를 못 불러왔으면 모두 막는다", () => {
  const cases: [boolean, boolean, { manage: boolean; canAdd: boolean; canSave: boolean }][] = [
    [false, true, { manage: false, canAdd: true, canSave: true }],
    [true, false, { manage: true, canAdd: false, canSave: true }],
    [true, true, { manage: true, canAdd: true, canSave: true }],
    [false, false, { manage: false, canAdd: false, canSave: false }],
  ];
  for (const [update, create, expected] of cases) assert.deepEqual(codePanelAccess({ update, create }), expected, `수정 ${update} · 등록 ${create}`);
  assert.deepEqual(codePanelAccess({ update: true, create: true, loadFailed: true }), { manage: false, canAdd: false, canSave: false });
});

const added = (key: string, itemCode: string): ItemDraft => ({ key, itemCode, label: key, status: "ACTIVE", sortOrder: 0, added: true });

test("새 목록 — 저장을 시작한 목록을 대신하면 새 행을 뒤에 이어 두고 번호를 다시 매긴다", () => {
  const current = [itemDraft(items[0]), added("new-1", "INTERN")];
  const fresh = items.map((i) => itemDraft(i, { label: `${i.label}!` }));
  const kept = renumberAdded(withKeptAdded(fresh, current, true));
  assert.deepEqual(kept.slice(0, items.length), fresh, "새 목록 값으로 다시 시작");
  assert.equal(kept.at(-1)?.key, "new-1", "새 행은 키 그대로 뒤에 — 칸 오류가 제자리에 붙는다");
  assert.equal(kept.at(-1)?.sortOrder, Math.max(...items.map((i) => i.sortOrder)) + 1, "마지막 저장된 순서 다음 번호");
  assert.deepEqual(withKeptAdded(fresh, current, false), fresh, "다른 목록이면 새 행을 버린다");
});

test("같은 내용의 목록이 새 참조로 오면 저장 기준을 옮긴다 — 다음 진짜 목록에서 새 행을 이어 둔다", () => {
  const started = [...items]; // 저장을 시작한 목록
  const sameContent = [...items]; // 다른 패널 저장으로 온 같은 내용의 새 참조
  const revalidated = items.map((i) => ({ ...i, label: `${i.label}!` })); // 이 패널 저장 뒤의 진짜 목록

  // 옮기지 않으면 진짜 목록이 왔을 때 기준(started)이 지금 목록(sameContent)과 달라 새 행을 버린다
  const followed = followSameRows(started, started, sameContent);
  assert.equal(followed, sameContent);
  const current = [itemDraft(items[0]), added("new-1", "INTERN")];
  assert.equal(withKeptAdded(revalidated.map((i) => itemDraft(i)), current, followed === sameContent).at(-1)?.key, "new-1");

  assert.equal(followSameRows(null, started, sameContent), null, "저장 중이 아니면 그대로");
  assert.equal(followSameRows(started, sameContent, revalidated), started, "기준이 지금 목록이 아니면 그대로");
});

test("등록한 새 행은 뺀다 — 코드는 대문자 · 공백을 맞춰 견주고, 겹치지 않는 새 행은 남는다", () => {
  const rows = [itemDraft(items[0]), added("new-1", " intern "), added("new-2", "TEMP")];
  assert.deepEqual(dropCreatedAdded(rows, ["INTERN"]).map((d) => d.key), [items[0].itemCode, "new-2"]);
});
