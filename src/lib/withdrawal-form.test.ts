// node --test src/lib/withdrawal-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api-error.ts";
import { withdrawFormField, withdrawVerifyFailureOf, withdrawWarningText } from "./withdrawal-form.ts";

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
  assert.match(blocks[0] as string, /관리자·가맹 계정 \*\*0개\*\*/);
  assert.match((blocks[1] as { head: string }).head, /점포 \*\*0개\*\*/);
});

test("BP명·관리자수·점포수가 실제 값으로 들어간다(굵게 표시용 ** 로 감싼다)", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false });
  assert.match(blocks[0] as string, /\*\*테스트상회\*\*/);
  assert.match(blocks[0] as string, /\*\*3개\*\*/);
  assert.match((blocks[1] as { head: string }).head, /\*\*7개\*\*/);
});

test("탈퇴 1단계 비밀번호 확인 실패 — 확인하지 못하면 모두 막는다(통과로 보지 않는다)", () => {
  assert.deepEqual(withdrawVerifyFailureOf(new ApiError(401, "Unauthorized")), {
    ok: false,
    status: 401,
    message: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  });
  assert.deepEqual(withdrawVerifyFailureOf(new ApiError(400, "현재 비밀번호가 올바르지 않습니다.")), {
    ok: false,
    status: 400,
    message: "현재 비밀번호가 올바르지 않습니다.",
  });
  assert.deepEqual(withdrawVerifyFailureOf(new ApiError(429, "ThrottlerException: Too Many Requests")), {
    ok: false,
    message: "너무 많이 시도했습니다. 10분 뒤 다시 시도해 주세요.",
  });
  assert.deepEqual(withdrawVerifyFailureOf(new ApiError(403, "서비스 이용을 위해 비밀번호를 변경해 주세요.")), {
    ok: false,
    message: "서비스 이용을 위해 비밀번호를 변경해 주세요.",
  });
  // 경로가 없는 404(api 배포 전) · 5xx · 연결 실패는 통과가 아니라 일반 실패 문구다
  for (const error of [new ApiError(404, "Cannot POST"), new ApiError(500, "Internal"), new TypeError("fetch failed")])
    assert.deepEqual(withdrawVerifyFailureOf(error), { ok: false, message: "비밀번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." });
});

test("점포 폐점·개인정보 삭제 제목은 마침표로 끝난다", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false });
  assert.match((blocks[1] as { head: string }).head, /\.$/);
  assert.match((blocks[2] as { head: string }).head, /\.$/);
});
