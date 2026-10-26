// node --test src/lib/menu-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { afterConflict, bodyOf, isDirty, menuFieldOf, syncMenuForm, validateMenuForm, type MenuFormBase } from "./menu-form.ts";

const base: MenuFormBase = { name: "플랫폼 메뉴 관리", url: "/platform-menus", status: "ACTIVE", updatedAt: "2026-10-16T01:00:00.000Z" };
const values = ({ name, url, status }: MenuFormBase) => ({ name, url, status });

test("isDirty — 앞뒤 공백은 고친 것으로 보지 않는다", () => {
  assert.equal(isDirty(base, { ...values(base), name: " 플랫폼 메뉴 관리 " }), false);
  assert.equal(isDirty(base, { ...values(base), status: "INACTIVE" }), true);
  assert.equal(isDirty(base, { ...values(base), url: "" }), true);
});

test("validateMenuForm — 이름 필수 · 20자, URL 선택 · 형식", () => {
  assert.deepEqual(validateMenuForm({ name: "  ", url: "", status: "ACTIVE" }), { name: "메뉴명을 입력해 주세요." });
  assert.ok(validateMenuForm({ name: "가".repeat(21), url: "", status: "ACTIVE" }).name);
  assert.deepEqual(validateMenuForm({ name: "가".repeat(20), url: "", status: "ACTIVE" }), {});
  assert.ok(validateMenuForm({ name: "a", url: "platform", status: "ACTIVE" }).url);
  assert.ok(validateMenuForm({ name: "a", url: "/Platform", status: "ACTIVE" }).url);
  assert.ok(validateMenuForm({ name: "a", url: "/platform/", status: "ACTIVE" }).url);
  assert.ok(validateMenuForm({ name: "a", url: `/${"a".repeat(200)}`, status: "ACTIVE" }).url);
  assert.deepEqual(validateMenuForm({ name: "a", url: " /staff-content-2 ", status: "ACTIVE" }), {});
});

test("validateMenuForm — 새 URL 은 1뎁스만, 수정에서 그대로 둔 여러 구간 URL 은 통과", () => {
  assert.ok(validateMenuForm({ name: "a", url: "/staff/content", status: "ACTIVE" }).url);
  assert.ok(validateMenuForm({ name: "a", url: "//staff", status: "ACTIVE" }).url);
  assert.deepEqual(validateMenuForm({ name: "a", url: "/staff-content", status: "ACTIVE" }), {});
  // 등록(keptUrl 없음)은 여러 구간을 받지 않는다
  const legacy = "/stores/contract-templates";
  assert.ok(validateMenuForm({ ...values(base), url: legacy }).url);
  // 수정: 아직 여러 구간인 메뉴(사용중지 메뉴 등)는 URL 을 그대로 두면 이름 · 상태만 고칠 수 있고, 다른 여러 구간으로 바꾸면 막는다
  assert.deepEqual(validateMenuForm({ ...values(base), url: legacy, name: "새 이름" }, legacy), {});
  assert.deepEqual(validateMenuForm({ ...values(base), url: ` ${legacy} ` }, legacy), {});
  assert.ok(validateMenuForm({ ...values(base), url: "/stores/other-templates" }, legacy).url);
});

test("bodyOf — 공백을 지우고 빈 URL 은 null", () => {
  assert.deepEqual(bodyOf({ name: " 새 메뉴 ", url: "  ", status: "INACTIVE" }), { name: "새 메뉴", url: null, status: "INACTIVE" });
});

test("syncMenuForm — 옮기기처럼 updatedAt 만 바뀌면 칸은 그대로 두고 기준만 올린다", () => {
  const form = { ...values(base), name: "고치는 중" };
  const next = syncMenuForm(base, form, { ...base, updatedAt: "2026-10-16T02:00:00.000Z" });
  assert.equal(next.base.updatedAt, "2026-10-16T02:00:00.000Z");
  assert.equal(next.form, form);
});

test("syncMenuForm — 남이 바꿨고 손대지 않았으면 새 값으로, 고치던 중이면 기준을 그대로", () => {
  const server = { ...base, name: "새 이름", updatedAt: "2026-10-16T02:00:00.000Z" };
  assert.deepEqual(syncMenuForm(base, values(base), server).form.name, "새 이름");
  const editing = { ...values(base), url: "/platform/x" };
  const kept = syncMenuForm(base, editing, server);
  assert.equal(kept.base, base);
  assert.equal(kept.form, editing);
  assert.equal(syncMenuForm(base, editing, server, true).form.name, "새 이름");
});

test("afterConflict — 받아 둔 새 값이 있으면 바로, 없으면 refresh 를 기다린다", () => {
  const editing = { ...values(base), name: "고치는 중" };
  assert.equal(afterConflict(base, editing, base).waitForRefresh, true);
  const server = { ...base, name: "남이 바꾼 이름", updatedAt: "2026-10-16T02:00:00.000Z" };
  const next = afterConflict(base, editing, server);
  assert.equal(next.waitForRefresh, false);
  assert.equal(next.form.name, "남이 바꾼 이름");
  assert.equal(next.base.updatedAt, server.updatedAt);
});

test("menuFieldOf — api 문구로 칸을 가른다", () => {
  assert.equal(menuFieldOf("노출 메뉴명은 20자까지입니다"), "name");
  assert.equal(menuFieldOf("메뉴 URL 은 200자까지입니다"), "url");
  assert.equal(menuFieldOf("같거나 겹치는 URL 을 쓰는 사용 중 메뉴가 있습니다(MN000215)"), "url");
  assert.equal(menuFieldOf("다른 관리자가 먼저 수정했습니다. 최신 정보를 불러온 뒤 다시 저장해 주세요"), null);
});
