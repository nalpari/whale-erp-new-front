// node --test src/lib/bp-admin-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { BpAdminDetail } from "./bp-admins.ts";
import {
  bpAdminFormOf,
  bpAdminServerErrorField,
  EMPTY_BP_ADMIN_FORM,
  emailError,
  toCreateBpAdminInput,
  toUpdateBpAdminInput,
  validateBpAdminForm,
  withRole,
  type BpAdminForm,
} from "./bp-admin-form.ts";

const filled: BpAdminForm = {
  ...EMPTY_BP_ADMIN_FORM,
  loginId: " hgcs ",
  name: "문가은",
  phone: ["010", "3308", "6214"],
  email: " Gaeun.Moon@hangang.co.kr ",
  roleTypeCode: "BA",
  roleGroupId: "6",
  stores: [{ storeId: 1, name: "모리커피 서초점", storeCode: "ST000001" }],
};

const detail: BpAdminDetail = {
  adminAccountId: 4,
  loginId: "hghr",
  name: "이서아",
  roleTypeCode: "BA",
  roleGroup: { roleGroupId: 4, roleCode: "BA000004", name: "인사 담당", roleTypeCode: "BA" },
  accountStatus: "ACTIVE",
  isAllStores: false,
  storeCount: 3,
  createdAt: "2025-04-01T00:12:00.000Z",
  lastLoginAt: null,
  isInitialPasswordUnsent: false,
  phone: "01022905173",
  email: "seoa.lee@hangang.co.kr",
  statusChangedAt: null,
  createdByName: "정하윤",
  updatedAt: "2026-02-03T06:10:00.123Z",
  updatedByName: null,
  bpStoreCount: 12,
  stores: [
    { storeId: 2, storeCode: "ST000002", name: "강남점", storeStatusCode: "OPERATING", isOutOfScope: false },
    { storeId: 7, storeCode: "ST000007", name: "방화점", storeStatusCode: "OPERATING", isOutOfScope: true },
    { storeId: 8, storeCode: "ST000008", name: "월곡점", storeStatusCode: "CLOSED", isOutOfScope: true },
  ],
  franchiseMaster: null,
  actions: { isSelf: false, canUpdate: true, canResetPassword: true, canChangeScope: true, canChangeRoleGroup: true },
};

test("채운 등록 칸은 오류가 없다", () => {
  assert.deepEqual(validateBpAdminForm(filled, { mode: "create" }), {});
});

test("빈 등록 칸 — 필수 칸마다 문구, 휴대전화도 필수다", () => {
  const errors = validateBpAdminForm({ ...EMPTY_BP_ADMIN_FORM, phone: ["", "", ""] }, { mode: "create" });
  assert.deepEqual(Object.keys(errors).sort(), ["email", "loginId", "name", "phone", "roleGroupId", "roleTypeCode", "stores"]);
  assert.equal(errors.phone, "연락처를 입력해 주세요.");
});

test("수정은 아이디 · 계정 역할을 보지 않는다", () => {
  const errors = validateBpAdminForm({ ...filled, loginId: "", roleTypeCode: "" }, { mode: "edit" });
  assert.deepEqual(errors, {});
});

test("일부 점포는 1곳 이상 — 범위 밖 매핑도 센다, 전체 점포 · 막힌 칸은 보지 않는다", () => {
  const empty = { ...filled, stores: [] };
  assert.equal(validateBpAdminForm(empty, { mode: "edit" }).stores, "대상점포를 1곳 이상 골라 주세요.");
  assert.equal(validateBpAdminForm(empty, { mode: "edit", outOfScopeCount: 2 }).stores, undefined);
  assert.equal(validateBpAdminForm({ ...empty, isAllStores: true }, { mode: "create" }).stores, undefined);
  assert.equal(validateBpAdminForm(empty, { mode: "edit", storesLocked: true }).stores, undefined);
});

test("상세로 채운 칸 — 범위 밖 매핑은 칩에서 빼고, 휴대전화는 세 칸으로", () => {
  const form = bpAdminFormOf(detail);
  assert.deepEqual(form.stores, [{ storeId: 2, name: "강남점", storeCode: "ST000002" }]);
  assert.deepEqual(form.phone, ["010", "2290", "5173"]);
  assert.equal(form.roleGroupId, "4");
});

test("요청 — 이메일은 소문자로, 전체 점포면 storeIds 를 비운다, 수정은 범위 안 점포만 보낸다", () => {
  assert.deepEqual(toCreateBpAdminInput(filled), {
    loginId: "hgcs",
    roleTypeCode: "BA",
    name: "문가은",
    phone: "01033086214",
    email: "gaeun.moon@hangang.co.kr",
    roleGroupId: 6,
    isAllStores: false,
    storeIds: [1],
  });
  assert.deepEqual(toCreateBpAdminInput({ ...filled, isAllStores: true }).storeIds, []);
  const update = toUpdateBpAdminInput(bpAdminFormOf(detail), detail.updatedAt);
  assert.deepEqual(update.storeIds, [2]);
  assert.equal(update.updatedAt, "2026-02-03T06:10:00.123Z");
  assert.equal(update.accountStatus, "ACTIVE");
});

test("이메일 형식 — 중복 확인 전에 칸을 벗어날 때도 같은 문구", () => {
  assert.equal(emailError(" a@b.co "), undefined);
  assert.equal(emailError("  "), "이메일을 입력해 주세요.");
  assert.equal(emailError("a@b"), "이메일 형식이 올바르지 않습니다.");
  assert.equal(emailError(`${"a".repeat(95)}@b.com`), "이메일 형식이 올바르지 않습니다.");
});

test("api 오류를 붙일 칸 — 문구로 가른다", () => {
  assert.equal(bpAdminServerErrorField(409, "사용할 수 없는 아이디라 계정을 만들지 않았습니다", "create"), "loginId");
  assert.equal(bpAdminServerErrorField(409, "사용할 수 없는 아이디라 계정을 만들지 않았습니다", "edit"), null);
  assert.equal(bpAdminServerErrorField(409, "이미 사용 중인 이메일입니다", "edit"), "email");
  assert.equal(bpAdminServerErrorField(400, "점포 범위를 벗어나 저장하지 않았습니다", "edit"), "stores");
  assert.equal(bpAdminServerErrorField(400, "선택할 수 없는 권한입니다.", "create"), "roleGroupId");
  assert.equal(bpAdminServerErrorField(403, "점포 범위를 벗어났습니다", "edit"), null);
  assert.equal(bpAdminServerErrorField(409, "아이디 또는 이메일이 이미 쓰였습니다", "create"), null);
  // 여러 칸의 검증 실패는 한 칸에 몰지 않고 띠로
  assert.equal(bpAdminServerErrorField(400, "아이디는 4~20자입니다, 이메일 형식이 아닙니다", "create"), null);
});

test("계정 역할을 바꾸면 그 역할로 다시 맞춘다 — 전체 점포는 BP 관리자만, 점포는 비우고, 그룹이 하나면 미리 고른다", () => {
  const groups = [
    { roleGroupId: 1, roleCode: "FM000001", name: "가맹 마스터(고정)", roleTypeCode: "FM" as const },
    { roleGroupId: 4, roleCode: "BA000004", name: "인사 담당", roleTypeCode: "BA" as const },
    { roleGroupId: 5, roleCode: "BA000005", name: "정산 조회", roleTypeCode: "BA" as const },
  ];
  const allStoresBa = { ...filled, isAllStores: true, roleGroupId: "4" };
  const fm = withRole(allStoresBa, "FM", groups);
  assert.deepEqual([fm.roleTypeCode, fm.isAllStores, fm.stores, fm.roleGroupId], ["FM", false, [], "1"]);
  const ba = withRole(allStoresBa, "BA", groups);
  assert.deepEqual([ba.isAllStores, ba.roleGroupId], [true, ""]);
  assert.equal(withRole(filled, "", groups).roleGroupId, "");
});

test("연락처 — 숫자 9~12자리(02 유선 · 050X 평생번호 포함), 문구는 이 화면 것", () => {
  const phoneError = (phone: [string, string, string]) => validateBpAdminForm({ ...filled, phone }, { mode: "create" }).phone;
  assert.equal(phoneError(["010", "1", "5678"]), "연락처는 숫자 9~12자리입니다.", "8자리");
  assert.equal(phoneError(["02", "123", "4567"]), undefined, "9자리");
  assert.equal(phoneError(["0507", "2033", "1334"]), undefined, "12자리");
  assert.ok(phoneError(["0507", "2033", "13345"]), "13자리");
});

test("bpAdminFormOf — 050X 평생번호(12자리)는 4-4-4 로 나눈다", () => {
  assert.deepEqual(bpAdminFormOf({ ...detail, phone: "050720331334" }).phone, ["0507", "2033", "1334"]);
});
