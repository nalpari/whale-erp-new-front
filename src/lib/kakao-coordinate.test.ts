// node --test src/lib/kakao-coordinate.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { coordinateOfKakao } from "./kakao-coordinate.ts";

test("y 가 위도 · x 가 경도, 소수 6자리로 자른다", () => {
  const body = { documents: [{ x: "127.036508620542", y: "37.5000242405515" }] };
  assert.deepEqual(coordinateOfKakao(body), { kind: "found", latitude: 37.500024, longitude: 127.036509 });
});

test("찾은 것이 없으면 none — 다음 주소로 다시 묻는다", () => {
  assert.deepEqual(coordinateOfKakao({ documents: [] }), { kind: "none" });
});

test("응답 모양이 다르면 malformed", () => {
  assert.deepEqual(coordinateOfKakao({ documents: [{ x: 127, y: "x" }] }), { kind: "malformed" });
  assert.deepEqual(coordinateOfKakao({}), { kind: "malformed" });
  assert.deepEqual(coordinateOfKakao(null), { kind: "malformed" });
});

test("빈 글자 · 공백 · 16진 · 범위 밖은 malformed — (0, 0) 같은 틀린 좌표를 채우지 않는다", () => {
  for (const [x, y] of [["", ""], [" ", "37.5"], ["127.0", "0x10"], ["127.0", "1e2"], ["181", "37.5"], ["127.0", "-90.1"]]) {
    assert.deepEqual(coordinateOfKakao({ documents: [{ x, y }] }), { kind: "malformed" }, `x=${x} y=${y}`);
  }
  assert.deepEqual(coordinateOfKakao({ documents: [{ x: "-180", y: "90" }] }), { kind: "found", latitude: 90, longitude: -180 });
});
