// node --test src/lib/email-format.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { isEmailFormat } from "./email-format.ts";

// 아래 값은 2026-10-23 에 api 의 validator(13.15) isEmail 결과와 손으로 맞춰 보았다 — 저장소에 비교 검사는 없다
test("api @IsEmail 이 받는 값은 받는다", () => {
  const accepted = ["kim@whale.co", "SeoJun@Whale.Test", "kim.lee@mail.whale.kr", "kim@회사.한국", "kim@whale.xn--3e0b707e", "a+b_c@wh-ale.io"];
  accepted.push("a@1.co", "é@x.co", "a'b@x.co", "a@a.xn-1a", "가나다라마바사아자차카타파하가나다라마바사@whale.co", `a@${"b".repeat(63)}.co`);
  for (const ok of accepted) assert.equal(isEmailFormat(ok), true, ok);
});

test("api @IsEmail 이 막는 값은 막는다", () => {
  const rejected = ["kim@whale.c", "kim@whale..co", "kim@.whale.co", ".kim@whale.co", "kim.@whale.co", "kim..lee@whale.co", "kim@whale.123", "kim@whale"];
  rejected.push("kim@-whale.co", "kim@whale-.co", "kim@whale_x.co", "a,b@x.co", "a(b@x.co", "kim@whale.co-", "kim@whale.xn--", "a@b@c.co", "@x.co", "a@");
  // 주소 목록에서 복사하면 따라오는 쉼표 · 괄호, 도메인의 기호 · 전각 영문
  rejected.push("kim@whale.co,", "kim@naver.com)", "kim@whale.co;", "kim@wh+ale.co", "kim@whale.co!", "kim@ｗhale.co", "kim@whale.ｃｏｍ");
  // @ 앞의 이모지 · 제어문자, 전각 공백이 든 끝 마디
  rejected.push("kim😀@whale.co", "kim\u0001@whale.co", "a\u0080@a.com", "6a@0.한　");
  for (const bad of rejected) assert.equal(isEmailFormat(bad), false, JSON.stringify(bad));
});

test("길이 — @ 앞 64바이트 · 마디 63자 · 전체 254자", () => {
  assert.equal(isEmailFormat(`${"a".repeat(64)}@x.co`), true);
  assert.equal(isEmailFormat(`${"a".repeat(65)}@x.co`), false);
  // 한글은 한 글자에 3바이트 — 21자(63바이트)는 되고 22자(66바이트)는 안 된다
  assert.equal(isEmailFormat(`${"가".repeat(21)}@x.co`), true);
  assert.equal(isEmailFormat(`${"가".repeat(22)}@x.co`), false);
  assert.equal(isEmailFormat(`a@${"b".repeat(64)}.co`), false);
  assert.equal(isEmailFormat(`a@${"b.".repeat(126)}co`), false, "256자");
});
