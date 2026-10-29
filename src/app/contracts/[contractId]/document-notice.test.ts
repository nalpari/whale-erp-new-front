// node --test "src/app/contracts/[contractId]/document-notice.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { documentNoticeOf } from "./document-notice.ts";

test("documentNoticeOf — 정해진 이름만 문장으로 바꾸고 나머지는 띄우지 않는다", () => {
  assert.equal(documentNoticeOf("missing"), "파일을 찾을 수 없습니다.");
  assert.equal(documentNoticeOf("unavailable"), "파일 저장소에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  assert.equal(documentNoticeOf("failed"), "파일을 받지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  for (const raw of [undefined, "", "toString", "__proto__", "<script>", ["missing"]]) assert.equal(documentNoticeOf(raw), null);
});
