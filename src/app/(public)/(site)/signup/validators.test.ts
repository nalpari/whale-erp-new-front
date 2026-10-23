// node --test "src/app/(public)/(site)/signup/validators.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agreeErrorMessage,
  normalizeLoginId,
  validateBizRegistrationNumber,
  validateEmail,
  validateLoginId,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
  validateTradeName,
} from "./validators.ts";

test("아이디 — 영문 하나 이상 포함, 영문·숫자만, 4~20자", () => {
  assert.equal(validateLoginId(""), "아이디를 입력해 주세요.");
  assert.ok(validateLoginId("1234"), "숫자만");
  assert.ok(validateLoginId("abc"), "3자");
  assert.ok(validateLoginId("a".repeat(21)), "21자");
  assert.ok(validateLoginId("abc_123"), "밑줄");
  assert.equal(validateLoginId("abcd"), undefined);
  assert.equal(validateLoginId("hangang01"), undefined);
  assert.equal(validateLoginId("a".repeat(20)), undefined, "20자는 통과");
  assert.ok(validateLoginId("한강01ab"), "한글");
  // api 가 소문자로 바꿔 저장한다 — 화면이 대문자를 막으면 api 와 어긋난다.
  assert.equal(validateLoginId("Hangang01"), undefined, "대문자는 통과");
});

test("비밀번호 — 영문·숫자·특수문자를 모두 포함해 8~20자", () => {
  assert.equal(validatePassword(""), "비밀번호를 입력해 주세요.");
  assert.ok(validatePassword("abc12345"), "특수문자 없음");
  assert.ok(validatePassword("abcdefg!"), "숫자 없음");
  assert.ok(validatePassword("12345678!"), "영문 없음");
  assert.ok(validatePassword("a1!aaaa"), "7자");
  assert.ok(validatePassword(`a1!${"a".repeat(18)}`), "21자");
  assert.ok(validatePassword("ab 1!cde"), "공백 포함");
  // 허용 특수문자 중 괄호·대괄호·중괄호·하이픈처럼 정규식 글자 집합에서 이스케이프를 깜빡하기 쉬운 것들.
  assert.equal(validatePassword("a1(aaaaa"), undefined, "괄호");
  assert.equal(validatePassword("a1[aaaaa"), undefined, "대괄호");
  assert.equal(validatePassword("a1{aaaaa"), undefined, "중괄호");
  assert.equal(validatePassword("a1-aaaaa"), undefined, "하이픈");
  assert.equal(validatePassword("whale-2026!"), undefined);
  assert.equal(validatePassword("a1!aaaaa"), undefined, "8자 경계값");
});

test("비밀번호 확인 — 비어 있으면 입력 요청, 다르면 불일치", () => {
  assert.equal(validatePasswordConfirm("whale-2026!", ""), "비밀번호를 한 번 더 입력해 주세요.");
  assert.equal(validatePasswordConfirm("whale-2026!", "whale-2027!"), "비밀번호가 일치하지 않습니다.");
  assert.equal(validatePasswordConfirm("whale-2026!", "whale-2026!"), undefined);
});

test("이름 — 한글 또는 영문 2~20자", () => {
  assert.equal(validateName(""), "이름을 입력해 주세요.");
  assert.ok(validateName("김"), "1자");
  assert.ok(validateName("김지영1"), "숫자 섞임");
  assert.ok(validateName("a".repeat(21)), "21자");
  assert.equal(validateName("김지영"), undefined);
  assert.equal(validateName("Kim"), undefined);
});

test("연락처 — 숫자만, 세 칸 합쳐 10~11자리", () => {
  assert.equal(validatePhone("", "", ""), "연락처를 입력해 주세요.");
  assert.ok(validatePhone("010", "123", "456"), "9자리");
  assert.ok(validatePhone("010", "12345", "6789"), "12자리");
  assert.ok(validatePhone("010", "12a4", "5678"), "숫자가 아닌 글자 섞임");
  assert.equal(validatePhone("010", "123", "4567"), undefined, "10자리 경계값");
  assert.equal(validatePhone("010", "1234", "5678"), undefined, "11자리 경계값");
});

test("이메일 — 형식 검사", () => {
  assert.equal(validateEmail(""), "이메일을 입력해 주세요.");
  assert.ok(validateEmail("hayoon@"), "@ 뒤가 없음");
  assert.ok(validateEmail("hayoon.co.kr"), "@ 없음");
  assert.ok(validateEmail("hayoon @hangang.co.kr"), "공백 포함");
  assert.equal(validateEmail("hayoon@hangang.co.kr"), undefined);
  // api @IsEmail 이 막는 값(규칙 자체는 lib/email-format.test.ts)
  for (const bad of ["hayoon@hangang.c", "hayoon@hangang..kr", "hayoon@hangang.co.kr,"]) assert.equal(validateEmail(bad), "이메일 형식으로 입력해 주세요.", bad);
});

test("상호명 — 비어 있으면 입력 요청, 50자 넘으면 오류, 공백만 있으면 입력 요청", () => {
  assert.equal(validateTradeName(""), "상호명을 입력해 주세요.");
  assert.equal(validateTradeName("   "), "상호명을 입력해 주세요.", "api 가 trim 하고 보므로 공백만으론 안 됨");
  assert.ok(validateTradeName("가".repeat(51)));
  assert.equal(validateTradeName("가".repeat(50)), undefined, "50자 경계값");
  assert.equal(validateTradeName("㈜한강상회"), undefined);
});

test("사업자등록번호 — 숫자 10자리만 통과", () => {
  assert.ok(validateBizRegistrationNumber(""));
  assert.ok(validateBizRegistrationNumber("123456789"), "9자리");
  assert.ok(validateBizRegistrationNumber("12345678901"), "11자리");
  assert.ok(validateBizRegistrationNumber("211-87-0123"), "하이픈 포함");
  assert.equal(validateBizRegistrationNumber("2118701234"), undefined);
});

test("비밀번호 — 경계값과 허용 특수문자 목록(api 와 같은 !@#$%^&*()-_=+[]{}?)", () => {
  assert.equal(validatePassword(`a1!${"a".repeat(17)}`), undefined, "20자 경계값");
  // 글자 집합 안에서 이스케이프가 가장 깨지기 쉬운 글자들.
  for (const pw of ["a1]aaaaa", "a1}aaaaa", "a1?aaaaa", "a1-aaaaa", "a1[aaaaa"]) assert.equal(validatePassword(pw), undefined, pw);
  for (const pw of ["a1~aaaaa", "a1.aaaaa", "a1<aaaaa", "a1 aaaaa"]) assert.ok(validatePassword(pw), pw);
});

test("이름 — 20자 경계값, 한글 · 영문 섞임은 통과, 공백은 거절(api 와 같은 정규식)", () => {
  assert.equal(validateName("가".repeat(20)), undefined, "20자 경계값");
  assert.ok(validateName("가".repeat(21)), "21자");
  assert.equal(validateName("Kim지영"), undefined);
  assert.ok(validateName("Kim Jiyoung"), "공백");
});

test("약관 미동의 문구 — 안 한 항목만 이름을 든다", () => {
  assert.equal(agreeErrorMessage(true, true), undefined);
  assert.equal(agreeErrorMessage(false, false), "이용약관과 개인정보 수집·이용에 모두 동의해 주세요.");
  assert.equal(agreeErrorMessage(false, true), "이용약관에 동의해 주세요.");
  assert.equal(agreeErrorMessage(true, false), "개인정보 수집·이용에 동의해 주세요.");
});

test("아이디 입력은 소문자로 바꿔 보인다 — api 가 소문자로 저장하고 관리자 웹 로그인은 대소문자를 구분하므로, 저장되는 그대로를 입력 단계부터 본다", () => {
  assert.equal(normalizeLoginId("HanGang01"), "hangang01");
  assert.equal(normalizeLoginId("hangang01"), "hangang01");
  // 입력 중이라 공백은 지우지 않는다 — 형식 검사가 막는다.
  assert.equal(normalizeLoginId("Ab 1"), "ab 1");
});
