// node --test src/lib/role-form-sync.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isChangedMeanwhile, isDirty, roleFieldOf, syncRoleForm, validateRoleForm } from "./role-form-sync.ts";

const base = { name: "고객지원 담당", description: "커뮤니티관리", updatedAt: "t1" };

test("메뉴 권한만 바뀌어 updatedAt 만 올라오면 — 기준 updatedAt 만 올리고 고치던 칸은 그대로", () => {
  const form = { name: "고객지원 담당(수정 중)", description: "커뮤니티관리" };
  const next = syncRoleForm(base, form, { ...base, updatedAt: "t2" });
  assert.equal(next.base.updatedAt, "t2");
  assert.deepEqual(next.form, form);
});

test("남이 권한명을 바꿨고 칸을 손대지 않았으면 — 새 값으로 다시 채운다", () => {
  const server = { name: "정산 담당", description: "커뮤니티관리", updatedAt: "t2" };
  const next = syncRoleForm(base, { name: base.name, description: base.description }, server);
  assert.deepEqual(next.base, server);
  assert.deepEqual(next.form, { name: "정산 담당", description: "커뮤니티관리" });
});

test("남이 바꿨는데 칸을 고치던 중이면 — 기준값을 그대로 둬 저장 때 api 가 409 로 알린다(덮어쓰지 않는다)", () => {
  const form = { name: "내가 고친 이름", description: "커뮤니티관리" };
  const next = syncRoleForm(base, form, { name: "정산 담당", description: "커뮤니티관리", updatedAt: "t2" });
  assert.equal(next.base.updatedAt, "t1");
  assert.deepEqual(next.form, form);
});

test("409 뒤 최신 정보(reload)면 고치던 중이어도 새 값으로 다시 채운다", () => {
  const server = { name: "정산 담당", description: "", updatedAt: "t2" };
  const next = syncRoleForm(base, { name: "내가 고친 이름", description: "x" }, server, true);
  assert.deepEqual(next.base, server);
  assert.deepEqual(next.form, { name: "정산 담당", description: "" });
});

test("고친 것은 앞뒤 공백을 지우고 본다", () => {
  assert.equal(isDirty(base, { name: " 고객지원 담당 ", description: "커뮤니티관리 " }), false);
  assert.equal(isDirty(base, { name: "고객지원", description: "커뮤니티관리" }), true);
});

test("권한명 1~20자 · 설명 100자 — 앞뒤 공백을 지우고 센다", () => {
  assert.deepEqual(validateRoleForm({ name: "  ", description: "" }), { name: "권한명을 입력해 주세요." });
  assert.deepEqual(validateRoleForm({ name: "가".repeat(20), description: "나".repeat(100) }), {});
  assert.ok(validateRoleForm({ name: "가".repeat(21), description: "" }).name);
  assert.ok(validateRoleForm({ name: "가", description: " " + "나".repeat(101) }).description);
});

test("api 문구를 붙일 칸 — 이름 중복은 권한명, 설명 형식은 설명, 동시 수정 · 고정 권한은 띠", () => {
  assert.equal(roleFieldOf("같은 이름의 권한이 있습니다"), "name");
  assert.equal(roleFieldOf("권한명은 20자까지입니다"), "name");
  assert.equal(roleFieldOf("설명은 100자까지입니다"), "description");
  assert.equal(roleFieldOf("다른 관리자가 먼저 수정했습니다. 최신 정보를 불러온 뒤 다시 저장해 주세요"), null);
  assert.equal(roleFieldOf("고정 권한은 지울 수 없습니다"), null);
});

test("동시 수정 409 만 칸을 다시 채운다", () => {
  assert.equal(isChangedMeanwhile("다른 관리자가 먼저 수정했습니다. 최신 정보를 불러온 뒤 다시 저장해 주세요"), true);
  assert.equal(isChangedMeanwhile("고정 권한은 지울 수 없습니다"), false);
});
