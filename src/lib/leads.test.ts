// node --test src/lib/leads.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { LEAD_FAILED, LEAD_INVALID, LEAD_UNKNOWN, leadBodyOf, leadFailureOf, leadInputProblem } from "./leads.ts";

function formOf(entries: [string, string][]): FormData {
  const form = new FormData();
  for (const [k, v] of entries) form.append(k, v);
  return form;
}

const BASE: [string, string][] = [
  ["contactName", "  김도윤 "],
  ["phone", "02-1234-5678"],
  ["email", "a@b.co"],
  ["industryCode", "CAFE"],
  ["interests", "STORE_OPERATION"],
  ["interests", "FINANCE"],
  ["body", " 궁금합니다 "],
  ["privacyAgreed", "on"],
];
const without = (name: string) => BASE.filter(([k]) => k !== name);
const replaced = (name: string, value: string): [string, string][] => [...without(name), [name, value]];

test("값을 다듬고 관심 서비스는 여러 개, 고르지 않은 도입 시기는 null, 동의는 boolean 으로 보낸다", () => {
  assert.deepEqual(leadBodyOf(formOf([...BASE, ["planPeriodCode", ""]])), {
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
  // 칸이 아예 없어도 빈 문자열이 아니라 null 이다 — api 는 "" 를 400 으로 거절한다.
  assert.equal(leadBodyOf(formOf(BASE)).planPeriodCode, null);
});

test("동의 두 개는 각자 체크된 것만 true 다", () => {
  assert.equal(leadBodyOf(formOf([...BASE, ["marketingAgreed", "on"]])).marketingAgreed, true);
  assert.equal(leadBodyOf(formOf(without("privacyAgreed"))).privacyAgreed, false);
  assert.equal(leadBodyOf(formOf(without("privacyAgreed"))).marketingAgreed, false);
});

test("문의 내용의 줄바꿈은 화면과 같이 1자(LF)로 보낸다 — 브라우저가 보낸 CRLF 를 되돌린다", () => {
  const body = leadBodyOf(formOf(replaced("body", "첫 줄\r\n둘째 줄\r셋째 줄\n넷째 줄"))).body;
  assert.equal(body, "첫 줄\n둘째 줄\n셋째 줄\n넷째 줄");
  // 화면에서 2000자(줄바꿈 60개 포함)면 보내는 글도 2000자다.
  const screen = `${"가".repeat(32)}\n`.repeat(60) + "가".repeat(20);
  assert.equal(screen.length, 2000);
  assert.equal(leadBodyOf(formOf(replaced("body", screen.replaceAll("\n", "\r\n")))).body.length, 2000);
});

test("업종 직접 입력은 업종이 기타(ETC)일 때만 싣는다", () => {
  assert.equal(leadBodyOf(formOf([...replaced("industryCode", "ETC"), ["industryDetail", " 꽃집 "]])).industryDetail, "꽃집");
  assert.equal("industryDetail" in leadBodyOf(formOf([...BASE, ["industryDetail", "꽃집"]])), false);
});

test("빈칸만 적은 칸과 api 가 받지 않는 전화번호를 확인 창 전에 잡는다", () => {
  assert.equal(leadInputProblem(formOf(BASE)), null);
  assert.equal(leadInputProblem(formOf(replaced("contactName", "   ")))?.name, "contactName");
  assert.equal(leadInputProblem(formOf(replaced("body", "\n  ")))?.name, "body");
  assert.equal(leadInputProblem(formOf([...replaced("industryCode", "ETC"), ["industryDetail", " "]]))?.name, "industryDetail");
  // 기타가 아니면 직접 입력칸은 보지 않는다.
  assert.equal(leadInputProblem(formOf([...BASE, ["industryDetail", " "]])), null);
  for (const ok of ["021234567", "010-1234-5678", " 031 123 4567 ", "1588-1234", "16001234"]) assert.equal(leadInputProblem(formOf(replaced("phone", ok))), null, ok);
  for (const bad of ["1234", "010-1234-56789", "1700-1234", "02)1234-5678", "abc"]) assert.equal(leadInputProblem(formOf(replaced("phone", bad)))?.name, "phone", bad);
  // 브라우저 type=email 은 통과시키지만 api @IsEmail 은 막는 값
  for (const bad of ["kim@whale", "kim@whale.c", "kim@whale.co,"]) assert.equal(leadInputProblem(formOf(replaced("email", bad)))?.name, "email", bad);
});

test("429 · 한글 400 은 api 문구를, 영문 400 은 입력 확인 문구를, 응답 없음은 결과 모름을, 그 밖은 접수 실패를 보인다", () => {
  const dup = "이미 접수된 문의가 있습니다. 담당자가 영업일 기준 1~2일 안에 연락드립니다";
  assert.deepEqual(leadFailureOf(429, [dup]), { message: dup, log: false });
  assert.deepEqual(leadFailureOf(400, ["전화번호 형식이 올바르지 않습니다"]), { message: "전화번호 형식이 올바르지 않습니다", log: false });
  assert.deepEqual(leadFailureOf(400, ["email must be an email"]), { message: LEAD_INVALID, log: true });
  // 한글 · 영문이 섞이면 영문을 보이지 않는다.
  assert.deepEqual(leadFailureOf(400, ["전화번호 형식이 올바르지 않습니다", "email must be an email"]), { message: LEAD_INVALID, log: true });
  assert.deepEqual(leadFailureOf(null, []), { message: LEAD_UNKNOWN, log: true });
  assert.deepEqual(leadFailureOf(500, ["Internal server error"]), { message: LEAD_FAILED, log: true });
});
