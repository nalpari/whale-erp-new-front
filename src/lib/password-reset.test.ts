// node --test src/lib/password-reset.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { canResetPassword, refreshesAfterReset, resetFailureMessage, resetRecipientText } from "./password-reset.ts";

const direct = { storeId: 1, name: "직영점", storeType: "DIRECT" };
const franchise = { storeId: 2, name: "가맹점", storeType: "FRANCHISE" };
const joined = { joinState: "JOINED", employmentStatus: "EMPLOYED", retiredDate: null, store: direct, email: "jian.seo@example.com" } as const;

test("버튼 — 가입 완료 · 재직 · 수정 권한이면 보인다", () => {
  assert.equal(canResetPassword(joined, "FM", true), true);
});

test("버튼 — 퇴직 예정(재직 + 퇴직일)에도 보인다. api 는 퇴직만 막는다", () => {
  const scheduled = { ...joined, retiredDate: "2026-11-30" };
  assert.equal(canResetPassword(scheduled, "FM", true), true);
});

test("버튼 — 수정 권한이 없으면 숨긴다. 조회 권한만 있어도 email 은 오므로 email 로는 가릴 수 없다(WHALEERP-180)", () => {
  assert.equal(canResetPassword({ ...joined, email: "jian.seo@example.com" }, "FM", false), false);
});

test("버튼 — 퇴직 직원에게는 숨긴다", () => {
  const retired = { ...joined, employmentStatus: "RETIRED", retiredDate: "2026-10-01" } as const;
  assert.equal(canResetPassword(retired, "FM", true), false);
});

test("버튼 — 가입 전 직원(초안 · 초대 · 연결 보류 등)에게는 숨긴다", () => {
  for (const joinState of ["DRAFT", "INVITED", "EXPIRED", "REJECTED", "LINK_HOLD", "AFFILIATION_PENDING", "RETURN_PENDING", "UNDER_AGE", null] as const)
    assert.equal(canResetPassword({ ...joined, joinState }, "FM", true), false, String(joinState));
});

test("버튼 — 본사 역할(BM · BA)은 직영 점포 직원에게만. 가맹 직원은 동의해 상세가 보여도 api 가 404 다(ATT-30)", () => {
  for (const role of ["BM", "BA"]) {
    assert.equal(canResetPassword(joined, role, true), true, `${role} 직영`);
    assert.equal(canResetPassword({ ...joined, store: franchise }, role, true), false, `${role} 가맹`);
  }
});

test("버튼 — 본사 역할에게 점포 유형을 모르면 숨긴다(api 와 같이 직영만 받는다)", () => {
  assert.equal(canResetPassword({ ...joined, store: { ...direct, storeType: "" } }, "BM", true), false);
});

test("버튼 — 가맹 역할(FM · FA)은 점포 유형과 상관없다", () => {
  for (const role of ["FM", "FA"]) assert.equal(canResetPassword({ ...joined, store: franchise }, role, true), true, role);
});

test("버튼 — 탈퇴 계정(가입 완료인데 계정 이메일 없음)에게는 숨긴다(데모 주석, api #56)", () => {
  assert.equal(canResetPassword({ ...joined, email: null }, "FM", true), false);
});

test("버튼 — 응답에 email 칸이 없으면(api #56 전 배포) 숨긴다. 탈퇴인지 알 수 없다", () => {
  const withoutEmail = { joinState: joined.joinState, employmentStatus: joined.employmentStatus, store: joined.store };
  assert.equal(canResetPassword(withoutEmail as typeof joined, "FM", true), false);
});

test("버튼 — 본사 역할이 아니면(플랫폼 · 모르는 코드 포함) 점포 유형을 보지 않는다. 막는 것은 api 다", () => {
  for (const role of ["PM", "PA", ""]) assert.equal(canResetPassword({ ...joined, store: franchise }, role, true), true, role);
});

test("버튼 — 재직 상태가 없으면 숨긴다", () => {
  assert.equal(canResetPassword({ ...joined, employmentStatus: null }, "FM", true), false);
});

test("받는 곳 문구 — 주소가 있으면 주소(데모 문구), 없으면 「직원의 이메일 아이디로」", () => {
  assert.equal(resetRecipientText("jian.seo@example.com"), "이메일 아이디 jian.seo@example.com 으로");
  assert.equal(resetRecipientText(null), "직원의 이메일 아이디로");
});

test("실패 문구 — 429 는 api 문구 그대로. 이미 보냈다는 사실을 알려 다시 보내 앞 링크를 무효로 만들지 않게(2026-10-16 노영주)", () => {
  assert.equal(
    resetFailureMessage({ status: 429, message: "방금 재설정 링크를 보냈습니다. 1분 뒤에 다시 보낼 수 있습니다" }),
    "방금 재설정 링크를 보냈습니다. 1분 뒤에 다시 보낼 수 있습니다",
  );
});

test("실패 문구 — 그 밖에 status 가 있으면 문구 그대로(401 은 서버 액션의 로그인 만료 문구)", () => {
  for (const status of [401, 404, 409, 503])
    assert.equal(resetFailureMessage({ status, message: "api 문구" }), "api 문구", String(status));
});

test("실패 문구 — 결과를 모르면(5xx · 연결 실패) 다시 보내도 된다고 알린다. 화면을 새로 받아도 알 수 없다", () => {
  assert.equal(
    resetFailureMessage({ message: "재설정 링크 발송 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요." }),
    "발송 결과를 확인하지 못했습니다. 직원이 메일을 받지 못했다면 1분 뒤 다시 보내 주세요.",
  );
});

test("409(가입 전 · 퇴직 · 탈퇴)만 상세를 다시 받는다 — 화면이 낡았으니 버튼을 거둔다", () => {
  assert.equal(refreshesAfterReset({ status: 409 }), true);
  for (const status of [401, 404, 429, 503, undefined]) assert.equal(refreshesAfterReset({ status }), false, String(status));
});
