// node --test src/app/auth/_components/validators.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
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
});

test("비밀번호 — 영문·숫자·특수문자를 모두 포함해 8~20자", () => {
  assert.equal(validatePassword(""), "비밀번호를 입력해 주세요.");
  assert.ok(validatePassword("abc12345"), "특수문자 없음");
  assert.ok(validatePassword("abcdefg!"), "숫자 없음");
  assert.ok(validatePassword("12345678!"), "영문 없음");
  assert.ok(validatePassword("ab1!"), "7자");
  assert.ok(validatePassword(`a1!${"a".repeat(18)}`), "21자");
  assert.ok(validatePassword("ab 1!cde"), "공백 포함");
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
  assert.equal(validatePhone("010", "123", "4567"), undefined, "10자리 경계값");
  assert.equal(validatePhone("010", "1234", "5678"), undefined, "11자리 경계값");
});

test("이메일 — 형식 검사", () => {
  assert.equal(validateEmail(""), "이메일을 입력해 주세요.");
  assert.ok(validateEmail("hayoon@"), "@ 뒤가 없음");
  assert.ok(validateEmail("hayoon.co.kr"), "@ 없음");
  assert.ok(validateEmail("hayoon @hangang.co.kr"), "공백 포함");
  assert.equal(validateEmail("hayoon@hangang.co.kr"), undefined);
});

test("상호명 — 비어 있으면 입력 요청, 50자 넘으면 오류", () => {
  assert.equal(validateTradeName(""), "상호명을 입력해 주세요.");
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
