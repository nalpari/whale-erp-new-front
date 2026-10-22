// node --test src/lib/biz-verification-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BIZ_MESSAGE,
  bizDigits,
  bizNumberInput,
  bizVerifiedLabel,
  bizVerifyFailure,
  checkBizVerify,
  dateOfMillis,
  isBizVerificationExpired,
  missingMessage,
  sameBizVerifyValues,
} from "./biz-verification-rules.ts";

const filled = { bizNumber: "211-87-01234", ceoName: " 남도현 ", openDate: "2021-03-15" };

test("bizNumberInput · bizDigits — 하이픈을 넣어 쳐도 받고, 쓸 때는 숫자만", () => {
  assert.equal(bizNumberInput("211-87-01234abc"), "211-87-01234");
  assert.equal(bizNumberInput("2118701234567"), "211870123456");
  // 공백이 섞인 붙여넣기도 거른 뒤 자른다 — 입력칸에 maxLength 를 두지 않는 이유
  assert.equal(bizNumberInput("105 - 87 - 63602"), "105-87-63602");
  assert.equal(bizDigits("211-87-01234"), "2118701234");
});

test("checkBizVerify — 하이픈 번호도 10자리면 통과, 빈 칸은 missing, 채운 칸의 형식 오류는 format", () => {
  assert.deepEqual(checkBizVerify(filled), { missing: [], format: {} });
  assert.deepEqual(checkBizVerify({ bizNumber: "211-87", ceoName: "", openDate: "" }), {
    missing: ["ceoName", "openDate"],
    format: { bizNumber: BIZ_MESSAGE.NUMBER_FORMAT },
  });
  assert.equal(checkBizVerify({ ...filled, ceoName: "가".repeat(51) }).format.ceoName, "대표자명은 50자까지입니다.");
  assert.equal(checkBizVerify({ ...filled, openDate: "2021-3-5" }).format.openDate, "개업일자는 YYYY-MM-DD 입니다.");
});

test("checkBizVerify — 잠긴 칸(저장한 점포의 번호 · 개업일자)은 보지 않는다", () => {
  assert.deepEqual(checkBizVerify({ bizNumber: "", ceoName: "", openDate: "" }, { bizNumber: true, openDate: true }), { missing: ["ceoName"], format: {} });
});

test("missingMessage — 「·」로 묶는다", () => {
  assert.equal(missingMessage([]), null);
  assert.equal(missingMessage(["ceoName", "openDate"]), "대표자명·개업일자 항목을 입력해 주세요.");
  assert.equal(missingMessage(["bizNumber", "ceoName", "openDate"]), "사업자등록번호·대표자명·개업일자 항목을 입력해 주세요.");
});

test("sameBizVerifyValues — 하이픈 · 앞뒤 공백은 같은 값으로 본다", () => {
  assert.equal(sameBizVerifyValues(filled, { bizNumber: "2118701234", ceoName: "남도현", openDate: "2021-03-15" }), true);
  assert.equal(sameBizVerifyValues(filled, { ...filled, ceoName: "남도연" }), false);
});

test("isBizVerificationExpired — 10분이 되는 순간부터 만료", () => {
  assert.equal(isBizVerificationExpired(0, 599_999), false);
  assert.equal(isBizVerificationExpired(0, 600_000), true);
});

test("bizVerifyFailure — 중복만 번호 칸, 나머지는 버튼 위 한 줄. 429 는 일반 문구", () => {
  assert.deepEqual(bizVerifyFailure(409), { field: "bizNumber", message: "이미 등록된 사업자등록번호입니다." });
  assert.deepEqual(bizVerifyFailure(422), { field: null, message: BIZ_MESSAGE.MISMATCH });
  assert.deepEqual(bizVerifyFailure(503), { field: null, message: BIZ_MESSAGE.UNAVAILABLE });
  assert.deepEqual(bizVerifyFailure(429), { field: null, message: "잠시 후 다시 시도해 주세요." });
  assert.deepEqual(bizVerifyFailure(undefined), { field: null, message: BIZ_MESSAGE.FAILED });
});

test("bizVerifiedLabel · dateOfMillis — 「인증 완료 · 날짜」, 날짜는 한국 시간", () => {
  assert.equal(bizVerifiedLabel(true, "2026-10-22"), "인증 완료 · 2026-10-22");
  assert.equal(bizVerifiedLabel(true, ""), "인증 완료");
  assert.equal(bizVerifiedLabel(false, "2026-10-22"), "미인증");
  assert.equal(dateOfMillis(Date.parse("2026-10-21T15:30:00Z")), "2026-10-22");
});
