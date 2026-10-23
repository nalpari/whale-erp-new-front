// node --test src/lib/email-format.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  // 끝 마디(TLD)도 63자까지다
  assert.equal(isEmailFormat(`a@b.${"x".repeat(63)}`), true);
  assert.equal(isEmailFormat(`a@b.${"x".repeat(64)}`), false);
  assert.equal(isEmailFormat(`a@${"b.".repeat(126)}co`), false, "256자");
});

// 데모 erp.js · guest.js 는 이 함수를 옮겨 적었다(모듈을 불러올 수 없는 정적 html). 고칠 때 한쪽만 고치지 않게 같은 값에 같은 답인지 본다.
test("데모 사본(erp.js · guest.js)도 같은 답을 낸다", () => {
  const values = ["kim@whale.co", "kim@회사.한국", "a@a.xn-1a", "kim@whale.c", "kim@whale.co,", "kim😀@whale.co", `${"가".repeat(22)}@x.co`, `a@b.${"x".repeat(64)}`, "kim@ｗhale.co", "6a@0.한　"];
  for (const file of ["erp.js", "guest.js"]) {
    const src = readFileSync(new URL(`../../docs/demo/assets/${file}`, import.meta.url), "utf8");
    const start = src.indexOf("  const EMAIL_LOCAL_ATOM");
    const end = src.indexOf("\n  };", src.indexOf("  const isEmailFormat")) + 5;
    assert.ok(start > 0 && end > start, `${file} 에서 isEmailFormat 을 찾지 못했다`);
    const demo = new Function(`${src.slice(start, end)}\nreturn isEmailFormat;`)() as (value: string) => boolean;
    for (const v of values) assert.equal(demo(v), isEmailFormat(v), `${file}: ${JSON.stringify(v)}`);
  }
});
