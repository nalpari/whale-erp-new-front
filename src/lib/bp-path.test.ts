import assert from "node:assert/strict";
import { test } from "node:test";
import { bpOfPath, bpPath, isBpPathScreen, stripBp } from "./bp-path.ts";

test("bpOfPath 는 /bp/{양의 정수} 만 읽는다", () => {
  assert.equal(bpOfPath("/bp/8/bp-role-groups"), 8);
  assert.equal(bpOfPath("/bp/8"), 8);
  assert.equal(bpOfPath("/bp/0/x"), null);
  assert.equal(bpOfPath("/bp/abc/x"), null);
  assert.equal(bpOfPath("/bp/1234567890/x"), null); // int4 밖
  assert.equal(bpOfPath("/bp-role-groups"), null); // /bp- 로 시작하는 옛 경로
  assert.equal(bpOfPath("/bp/8x/y"), null);
});

test("stripBp 는 접두만 뗀다", () => {
  assert.equal(stripBp("/bp/8/bp-role-groups"), "/bp-role-groups");
  assert.equal(stripBp("/bp/8"), "/");
  assert.equal(stripBp("/bp-role-groups"), "/bp-role-groups");
  assert.equal(stripBp("/bp/8//evil.com"), "//evil.com");
});

test("bpPath 는 늘 /bp/{숫자} 로 시작한다", () => {
  assert.equal(bpPath(8, "/bp-role-groups"), "/bp/8/bp-role-groups");
  assert.equal(bpPath(8, "//evil.com"), "/bp/8//evil.com");
  assert.equal(bpPath(8, "x"), "/bp/8/x");
});

test("isBpPathScreen 은 옮긴 화면만", () => {
  assert.equal(isBpPathScreen("/bp-role-groups"), true);
  assert.equal(isBpPathScreen("/bp/8/bp-role-groups"), true);
  assert.equal(isBpPathScreen("/bp-role-groups-x"), false);
  assert.equal(isBpPathScreen("/stores"), false);
});
