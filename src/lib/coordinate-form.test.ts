// node --test src/lib/coordinate-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { coordinateBody, coordinateChange, coordinateErrors, coordinateFormOf, coordinateText, hasCoordinate } from "./coordinate-form.ts";

const form = (latitude: string, longitude: string, isLocationApplied = false) => ({ latitude, longitude, isLocationApplied });

test("coordinateErrors — 범위 끝값은 받고, 넘거나 소수 7자리면 막는다(음수 포함)", () => {
  assert.deepEqual(coordinateErrors(form("-90", "180")), {});
  assert.deepEqual(coordinateErrors(form("90.000000", "-180.000000")), {});
  assert.equal(coordinateErrors(form("-90.000001", "127")).latitude, "위도는 -90~90, 소수 6자리까지입니다.");
  assert.equal(coordinateErrors(form("37.5", "180.000001")).longitude, "경도는 -180~180, 소수 6자리까지입니다.");
  assert.equal(coordinateErrors(form("37.5", "127.1234567")).longitude, "경도는 -180~180, 소수 6자리까지입니다.");
  assert.equal(coordinateErrors(form("", "127")).latitude, "위도와 경도는 함께 적습니다.");
  assert.deepEqual(coordinateErrors(form("", "")), {});
});

test("coordinateText — 숫자 · 마침표 · 마이너스만 남긴다", () => {
  assert.equal(coordinateText("37.5a,6 "), "37.56");
  assert.equal(coordinateText("-126.9"), "-126.9");
});

test("coordinateFormOf · coordinateBody — 없으면 빈 칸 · null, 좌표 없이 위치적용은 미사용", () => {
  assert.deepEqual(coordinateFormOf({}), form("", ""));
  assert.deepEqual(coordinateFormOf({ latitude: 37.5, longitude: 127, isLocationApplied: true }), form("37.5", "127", true));
  assert.deepEqual(coordinateBody(form("", "", true)), { latitude: null, longitude: null, isLocationApplied: false });
  assert.equal(hasCoordinate(form(" ", "127")), false);
});

test("coordinateChange — 불러온 값과 같으면 싣지 않고, 바뀌면 셋을 함께 싣는다", () => {
  const saved = form("37.5", "127", true);
  assert.deepEqual(coordinateChange(form("37.5", "127", true), saved), {});
  // 글자 모양만 달라도(37.50) 같은 값이면 싣지 않는다
  assert.deepEqual(coordinateChange(form("37.50", "127", true), saved), {});
  assert.deepEqual(coordinateChange(form("37.5", "127", false), saved), { latitude: 37.5, longitude: 127, isLocationApplied: false });
  assert.deepEqual(coordinateChange(form("", ""), saved), { latitude: null, longitude: null, isLocationApplied: false });
});
