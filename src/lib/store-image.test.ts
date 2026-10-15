// node --test src/lib/store-image.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { storeImageAccept, storeImageFailureText, storeImageFileError, storeImageTypesOf, storeImageTypesText } from "./store-image.ts";

const TYPES = storeImageTypesOf(["JPG", "PNG"]);
const MB = 1024 * 1024;

test("accept · 안내 문구는 enum 값으로 만든다 — 모르는 값은 뺀다", () => {
  assert.equal(storeImageAccept(TYPES), "image/jpeg,.jpg,.jpeg,image/png,.png");
  assert.deepEqual(storeImageTypesOf(["PNG", "GIF", "toString", "constructor"]), ["PNG"]);
  assert.equal(storeImageTypesText(TYPES), "JPG · PNG");
});

test("JPG · PNG 5MB 이하만 통과", () => {
  assert.equal(storeImageFileError({ name: "a.JPG", type: "image/jpeg", size: MB }, TYPES), null);
  assert.equal(storeImageFileError({ name: "a.png", type: "", size: 5 * MB }, TYPES), null);
  assert.equal(storeImageFileError({ name: "a.gif", type: "image/gif", size: MB }, TYPES), "JPG · PNG 파일만 올릴 수 있습니다.");
  assert.equal(storeImageFileError({ name: "a.png", type: "image/png", size: 5 * MB + 1 }, TYPES), "파일은 5MB까지 올릴 수 있습니다.");
  assert.equal(storeImageFileError({ name: "a.png", type: "image/png", size: 0 }, TYPES), "빈 파일입니다. 다른 파일을 골라 주세요.");
});

test("이미지만 실패한 상태 코드 → 고정 문구, 없으면 null", () => {
  assert.match(storeImageFailureText("503") ?? "", /저장소/);
  assert.match(storeImageFailureText("409") ?? "", /다시 올려/);
  assert.match(storeImageFailureText("error") ?? "", /확인하지 못했습니다/);
  assert.equal(storeImageFailureText(undefined), null);
  assert.equal(storeImageFailureText(["503"]), null);
});
