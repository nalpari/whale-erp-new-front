// node --test src/lib/withdrawal-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api-error.ts";
import { IN_PROGRESS_CONTRACTS_HREF, withdrawFormField, withdrawVerifyFailureOf, withdrawWarningText } from "./withdrawal-form.ts";

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

type Block = { head: string; text?: string };

test("관리자 계정·점포가 0개면 그 줄·블록을 뺀다 — 첫 블록은 제목 한 줄만", () => {
  const blocks = withdrawWarningText({ bpName: "웨일분식", adminCount: 0, storeCount: 0, hasInProgressContract: false });
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks[0], { head: "「**웨일분식**」님의 서비스 이용이 종료됩니다." });
  assert.ok(!blocks.some((b) => typeof b !== "string" && b.head.includes("폐점")));
});

test("관리자 계정만 0개면 점포 블록은 남는다", () => {
  const blocks = withdrawWarningText({ bpName: "웨일분식", adminCount: 0, storeCount: 2, hasInProgressContract: false });
  assert.equal((blocks[0] as Block).text, undefined);
  assert.equal((blocks[1] as Block).head, "점포 **2개**의 상태가 「폐점」으로 바뀝니다.");
});

test("BP명·관리자수·점포수가 실제 값으로 들어간다(굵게 표시용 ** 로 감싼다)", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false });
  assert.deepEqual(blocks[0], {
    head: "「**테스트상회**」님의 서비스 이용이 종료됩니다.",
    text: "관리자 계정 **3개**도 미사용 처리되어 로그인할 수 없습니다.",
  });
  assert.equal((blocks[1] as Block).head, "점포 **7개**의 상태가 「폐점」으로 바뀝니다.");
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

test("블록 제목은 마침표로 끝난다", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false });
  for (const b of blocks) if (typeof b !== "string") assert.match(b.head, /\.$/);
});

test("직원 자료 안내는 일괄 저장 화면으로 보내고, 가맹 점포 직원은 가맹마스터가 받는다고 말한다", () => {
  const block = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false })[3] as {
    head: string;
    text: string;
    link?: { href: string; label: string };
  };
  assert.equal(block.head, "직원 자료는 조회할 수 없습니다.");
  assert.ok(block.text.startsWith("필요한 자료는 탈퇴 전에 내려받아 주세요.\n"));
  assert.equal(block.link?.label, "직원 자료 일괄 저장");
  assert.match(block.text, /가맹마스터만 내려받을 수 있으니, 탈퇴 전에 가맹마스터에게 알려 주세요\.$/);
  assert.equal(block.link?.href, "/staff-members/export");
});

test("마지막 블록은 복구할 수 없다는 제목 한 줄이고, 「정말 탈퇴하시겠습니까?」는 두지 않는다", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false });
  assert.deepEqual(blocks.at(-1), { head: "탈퇴한 계정은 복구할 수 없습니다." });
  assert.ok(!JSON.stringify(blocks).includes("정말 탈퇴하시겠습니까"));
});

test("[근로계약 확인]은 근로계약 목록을 점포 「전체」 · 진행 중 다섯 상태로 연다", () => {
  const url = new URL(IN_PROGRESS_CONTRACTS_HREF, "http://x");
  assert.equal(url.pathname, "/contracts");
  assert.deepEqual(url.searchParams.getAll("status"), ["DRAFT", "PENDING_SEND", "PENDING_SIGNATURE", "CORRECTION_REQUESTED", "SIGNED"]);
  // 빈 storeIds 가 없으면 목록이 헤더 범위(점포 하나 등)로 채워져 탈퇴를 막은 다른 점포의 계약이 안 보일 수 있다
  assert.equal(url.searchParams.get("storeIds"), "");
});

test("직영만 있는 BP 는 가맹마스터에게 알리라는 줄을 뺀다", () => {
  const blocks = withdrawWarningText({ bpName: "테스트상회", adminCount: 3, storeCount: 7, hasInProgressContract: false }, false);
  assert.equal((blocks[3] as { text: string }).text, "필요한 자료는 탈퇴 전에 내려받아 주세요.");
});
