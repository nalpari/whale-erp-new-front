// node --test src/lib/leads.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { LEAD_FAILED, leadBodyOf, leadFailureOf } from "./leads.ts";

function formOf(entries: [string, string][]): FormData {
  const form = new FormData();
  for (const [k, v] of entries) form.append(k, v);
  return form;
}

const BASE: [string, string][] = [
  ["contactName", "  김도윤 "],
  ["phone", "02-1234-5678"],
  ["email", "a@b.co"],
  ["interests", "STORE_OPERATION"],
  ["interests", "FINANCE"],
  ["body", " 궁금합니다 "],
  ["privacyAgreed", "on"],
];

test("값을 다듬고 관심 서비스는 여러 개, 고르지 않은 도입 시기는 null, 동의는 boolean 으로 보낸다", () => {
  assert.deepEqual(leadBodyOf(formOf([...BASE, ["industryCode", "CAFE"], ["planPeriodCode", ""]])), {
    contactName: "김도윤",
    industryCode: "CAFE",
    phone: "02-1234-5678",
    email: "a@b.co",
    interests: ["STORE_OPERATION", "FINANCE"],
    planPeriodCode: null,
    body: "궁금합니다",
    privacyAgreed: true,
    marketingAgreed: false,
  });
});

test("업종 직접 입력은 업종이 기타(ETC)일 때만 싣는다", () => {
  assert.equal(leadBodyOf(formOf([...BASE, ["industryCode", "ETC"], ["industryDetail", " 꽃집 "]])).industryDetail, "꽃집");
  assert.equal("industryDetail" in leadBodyOf(formOf([...BASE, ["industryCode", "CAFE"], ["industryDetail", "꽃집"]])), false);
});

test("400 · 429 는 api 문구를 보이고, 그 밖과 응답 없음은 정해진 문구에 로그를 남긴다", () => {
  const dup = "이미 접수된 문의가 있습니다. 담당자가 영업일 기준 1~2일 안에 연락드립니다";
  assert.deepEqual(leadFailureOf(429, dup), { message: dup, log: false });
  assert.deepEqual(leadFailureOf(400, "전화번호 형식"), { message: "전화번호 형식", log: false });
  assert.deepEqual(leadFailureOf(500, "Internal server error"), { message: LEAD_FAILED, log: true });
  assert.deepEqual(leadFailureOf(null, ""), { message: LEAD_FAILED, log: true });
});
