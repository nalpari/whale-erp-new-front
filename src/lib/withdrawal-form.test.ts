// node --test src/lib/withdrawal-form.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError } from "./api-error.ts";
import {
  blockedStoresOf,
  moveTargetOf,
  openCheckInConditionText,
  withdrawBlockedReason,
  withdrawFailureOf,
  withdrawFormField,
  withdrawVerifyFailureOf,
  withdrawPayslipText,
  withdrawWarningText,
  type WithdrawEligibility,
  type WithdrawWarningBlock,
} from "./withdrawal-form.ts";

type ClosingStore = WithdrawEligibility["closing"]["stores"][number];
const counts = { retiringStaff: 0, draftContracts: 0, pendingSendContracts: 0, pendingSignatureContracts: 0, unconfirmedPayslips: 0 };
const store = (storeId: number, count = 0, hiddenCount = 0): ClosingStore => ({
  storeId,
  storeName: `점포${storeId}`,
  storeCode: `ST${String(storeId).padStart(6, "0")}`,
  openCheckIns: { count, hiddenCount },
  ...counts,
  isBlocked: count + hiddenCount > 0,
});
/** 점포 목록으로 탈퇴 조건을 만든다 — total 은 점포 합계 */
function eligibilityOf(base: { bpName: string; adminCount: number; storeCount: number }, stores: ClosingStore[] = []): WithdrawEligibility {
  const count = stores.reduce((n, s) => n + s.openCheckIns.count, 0);
  const hiddenCount = stores.reduce((n, s) => n + s.openCheckIns.hiddenCount, 0);
  const isBlocked = count + hiddenCount > 0;
  return { ...base, closing: { stores, total: { openCheckIns: { count, hiddenCount }, ...counts, isBlocked }, isBlocked } };
}

test("비밀번호 불일치 메시지는 currentPassword 칸", () => {
  assert.equal(withdrawFormField(400, "현재 비밀번호가 올바르지 않습니다."), "currentPassword");
});

test("상세 사유 누락 메시지는 reasonDetail 칸", () => {
  assert.equal(withdrawFormField(400, "탈퇴 사유 상세를 입력해 주세요."), "reasonDetail");
});

test("폐점이 막은 409 는 칸이 아니라 띠(null) — 칸 문구가 들어 있어도 400 이 아니면 칸으로 보내지 않는다", () => {
  assert.equal(withdrawFormField(409, "퇴근 기록이 없는 출근이 있어 폐점할 수 없습니다."), null);
  assert.equal(withdrawFormField(409, "현재 비밀번호가 올바르지 않습니다."), null);
});

test("400 이어도 칸을 가리킬 수 없는 문구는 띠(null) — 비밀번호 단계로 되돌리지 않는다", () => {
  assert.equal(withdrawFormField(400, "reasonCode must be one of the following values"), null);
});

test("회원 탈퇴 저장 실패 — 409 는 status 를 유지하고 탈퇴되지 않았다고 말한다(화면이 이 status 로 조건을 다시 받는다)", () => {
  assert.deepEqual(withdrawFailureOf(new ApiError(409, "이미 폐점한 점포입니다. (역삼점)")), {
    ok: false,
    status: 409,
    message: "회원 탈퇴가 처리되지 않았습니다. 이미 폐점한 점포입니다. (역삼점)",
  });
  assert.deepEqual(withdrawFailureOf(new ApiError(401, "Unauthorized")), { ok: false, status: 401, message: "로그인이 만료되었습니다. 다시 로그인해 주세요." });
  assert.deepEqual(withdrawFailureOf(new ApiError(400, "현재 비밀번호가 올바르지 않습니다.")), { ok: false, status: 400, message: "현재 비밀번호가 올바르지 않습니다." });
  assert.deepEqual(withdrawFailureOf(new ApiError(429, "ThrottlerException")), { ok: false, message: "너무 많이 시도했습니다. 10분 뒤 다시 시도해 주세요." });
  assert.deepEqual(withdrawFailureOf(new ApiError(403, "권한이 없습니다.")), { ok: false, message: "권한이 없습니다." });
  // 폐점 시간 초과는 전체가 되돌아간 것이 확실하다 — 조건은 그대로라 status 는 주지 않는다(다시 받지 않는다)
  const timedOut = "처리 시간이 초과되어 폐점하지 못했습니다.";
  assert.deepEqual(withdrawFailureOf(new ApiError(503, timedOut, [timedOut], { code: "STORE_CLOSING_TIMEOUT" })), { ok: false, message: `회원 탈퇴가 처리되지 않았습니다. ${timedOut}` });
  // 탈퇴됐는지 모르는 경우는 실패라고 단정하지 않는다 — code 없는 503(게이트웨이)도 같다
  for (const error of [new ApiError(500, "Internal"), new ApiError(503, "요청이 실패했습니다 (HTTP 503)"), new TypeError("fetch failed")])
    assert.deepEqual(withdrawFailureOf(error), { ok: false, message: "회원 탈퇴 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." });
});

test("400이 아니면 null", () => {
  assert.equal(withdrawFormField(401, "현재 비밀번호가 올바르지 않습니다."), null);
});

type Block = { head: string; text?: string };

test("관리자 계정·점포가 0개면 그 줄·블록을 뺀다 — 첫 블록은 제목 한 줄만", () => {
  const blocks = withdrawWarningText(eligibilityOf({ bpName: "웨일분식", adminCount: 0, storeCount: 0 }));
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks[0], { head: "「**웨일분식**」님의 서비스 이용이 종료됩니다." });
  assert.ok(!blocks.some((b) => typeof b !== "string" && b.head.includes("폐점")));
});

test("관리자 계정만 0개면 점포 블록은 남는다", () => {
  const blocks = withdrawWarningText(eligibilityOf({ bpName: "웨일분식", adminCount: 0, storeCount: 2 }));
  assert.equal((blocks[0] as Block).text, undefined);
  assert.equal((blocks[1] as Block).head, "점포 **2개**의 상태가 「폐점」으로 바뀝니다.");
});

test("BP명·관리자수·점포수가 실제 값으로 들어간다(굵게 표시용 ** 로 감싼다)", () => {
  const blocks = withdrawWarningText(eligibilityOf({ bpName: "테스트상회", adminCount: 3, storeCount: 7 }));
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
  const blocks = withdrawWarningText(eligibilityOf({ bpName: "테스트상회", adminCount: 3, storeCount: 7 }));
  for (const b of blocks) if (typeof b !== "string") assert.match(b.head, /\.$/);
});

// 블록 위치는 0개 빼기로 바뀌므로 제목으로 찾는다
const STAFF_HEAD = "직원 자료는 조회할 수 없습니다.";
function staffBlockOf(blocks: WithdrawWarningBlock[]) {
  const block = blocks.find((b) => typeof b !== "string" && b.head === STAFF_HEAD);
  assert.ok(block && typeof block !== "string" && block.text !== undefined);
  return block as { head: string; text: string; link?: { href: string; label: string } };
}

test("직원 자료 안내는 일괄 저장 화면으로 보내고, 가맹 점포 직원은 가맹마스터가 받는다고 말한다", () => {
  const block = staffBlockOf(withdrawWarningText(eligibilityOf({ bpName: "테스트상회", adminCount: 3, storeCount: 7 })));
  assert.ok(block.text.startsWith("필요한 자료는 탈퇴 전에 내려받아 주세요.\n"));
  assert.equal(block.link?.label, "직원 자료 일괄 저장");
  assert.match(block.text, /가맹마스터만 내려받을 수 있으니, 탈퇴 전에 가맹마스터에게 알려 주세요\.$/);
  assert.equal(block.link?.href, "/staff-members/export");
});

test("마지막 블록은 복구할 수 없다는 제목 한 줄이고, 「정말 탈퇴하시겠습니까?」는 두지 않는다", () => {
  const blocks = withdrawWarningText(eligibilityOf({ bpName: "테스트상회", adminCount: 3, storeCount: 7 }));
  assert.deepEqual(blocks.at(-1), { head: "탈퇴한 계정은 복구할 수 없습니다." });
  assert.ok(!JSON.stringify(blocks).includes("정말 탈퇴하시겠습니까"));
});

test("직영만 있는 BP 는 가맹마스터에게 알리라는 줄을 빼고, 일괄 저장 버튼은 남긴다", () => {
  const block = staffBlockOf(withdrawWarningText(eligibilityOf({ bpName: "테스트상회", adminCount: 3, storeCount: 0 }), false));
  assert.equal(block.text, "필요한 자료는 탈퇴 전에 내려받아 주세요.");
  assert.equal(block.link?.href, "/staff-members/export");
});

test("이동 버튼 주소 — 메뉴 판정은 쿼리 뗀 경로, 탭 BP 주소로 옮긴 화면만 /bp/{id} 를 씌우고 쿼리를 다시 붙인다", () => {
  const contracts = moveTargetOf("/contracts?status=DRAFT", 8);
  assert.equal(contracts.menuPath, "/contracts");
  assert.equal(contracts.href, "/bp/8/contracts?status=DRAFT");
  // 일괄 저장 화면도 직원 정보 관리 아래라 탭 BP 를 씌운다
  assert.deepEqual(moveTargetOf("/staff-members/export", 8), { menuPath: "/staff-members/export", href: "/bp/8/staff-members/export" });
  // 옮기지 않은 화면은 접두가 없다
  assert.deepEqual(moveTargetOf("/notifications", 8), { menuPath: "/notifications", href: "/notifications" });
});

test("점포 블록에만 폐점 시 함께 처리될 것(closing)을 붙인다", () => {
  const blocks = withdrawWarningText(eligibilityOf({ bpName: "테스트상회", adminCount: 3, storeCount: 7 }));
  const withClosing = blocks.filter((b) => typeof b !== "string" && b.closing);
  assert.equal(withClosing.length, 1);
  assert.equal((withClosing[0] as Block).head, "점포 **7개**의 상태가 「폐점」으로 바뀝니다.");
});

test("막힌 점포 없음 — 칸은 「-」, [회원 탈퇴] 막힘 이유 없음", () => {
  const e = eligibilityOf({ bpName: "웨일분식", adminCount: 0, storeCount: 2 }, [store(1), store(2)]);
  assert.deepEqual(blockedStoresOf(e), []);
  assert.equal(openCheckInConditionText(e), "-");
  assert.equal(withdrawBlockedReason(e), undefined);
  // 점포가 하나도 없어도 같다
  assert.equal(openCheckInConditionText(eligibilityOf({ bpName: "웨일분식", adminCount: 0, storeCount: 0 })), "-");
});

test("10개 중 3개 막힘 — 막힌 점포만 api 순서대로, 건수는 가려진 직원 것까지 더한다", () => {
  const stores = Array.from({ length: 10 }, (_, i) => store(i + 1));
  stores[1] = store(2, 1, 1);
  stores[4] = store(5, 1);
  stores[7] = store(8, 0, 4);
  const e = eligibilityOf({ bpName: "웨일분식", adminCount: 0, storeCount: 10 }, stores);
  assert.deepEqual(blockedStoresOf(e).map((s) => s.storeId), [2, 5, 8]);
  assert.equal(openCheckInConditionText(e), "점포 3개 7건");
  assert.equal(withdrawBlockedReason(e), "퇴근 기록이 없는 출근이 있는 점포가 3개 있어 탈퇴할 수 없습니다.");
});

test("탈퇴 급여명세서 안내 — 탈퇴 뒤에는 처리할 수 없다고 말하고, 없으면 null", () => {
  assert.equal(withdrawPayslipText({ unconfirmedPayslips: 1200 }), "확정되지 않은 급여명세서 1,200건은 탈퇴 후 처리할 수 없습니다. 탈퇴 전에 확정해 주세요.");
  assert.equal(withdrawPayslipText({ unconfirmedPayslips: 0 }), null);
});
