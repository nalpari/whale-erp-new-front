// node --test src/lib/withdrawal.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { withdrawFormField, withdrawWarningText } from "./withdrawal.ts";

test("비밀번호 불일치 메시지는 currentPassword 칸", () => {
  assert.equal(withdrawFormField(400, "현재 비밀번호가 올바르지 않습니다."), "currentPassword");
});

test("상세 사유 누락 메시지는 reasonDetail 칸", () => {
  assert.equal(withdrawFormField(400, "탈퇴 사유 상세를 입력해 주세요."), "reasonDetail");
});

test("진행중 근로계약 메시지는 칸이 아니라 띠(null)", () => {
  assert.equal(
    withdrawFormField(400, "진행 중인 근로계약이 있어 탈퇴할 수 없습니다. 근로계약을 모두 종료한 뒤 다시 시도해 주세요."),
    null,
  );
});

test("400이 아니면 null", () => {
  assert.equal(withdrawFormField(401, "현재 비밀번호가 올바르지 않습니다."), null);
});

test("관리자·점포가 0개여도 문장이 깨지지 않는다", () => {
  const blocks = withdrawWarningText({ bpName: "웨일분식", adminCount: 0, storeCount: 0, hasInProgressContract: false });
  assert.equal(blocks.length, 4);
  assert.match(blocks[0] as string, /관리자·가맹 계정 0개/);
  assert.match((blocks[1] as { head: string }).head, /점포 0개/);
});

test("BP명·관리자수·점포수가 실제 값으로 들어간다", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false });
  assert.match(blocks[0] as string, /테스트상회/);
  assert.match(blocks[0] as string, /3개/);
  assert.match((blocks[1] as { head: string }).head, /7개/);
});
