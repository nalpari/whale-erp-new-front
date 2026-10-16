// node --test src/app/staff-members/staff-row.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { staffEmailText, type StaffMemberListItem } from "../../lib/staff-members.ts";
import { contractCell, employmentStatusCells, formatPhone, joinCell, rowNumber, statusCells } from "./staff-row.ts";

const TODAY = "2026-10-12";
const item = (over: Partial<StaffMemberListItem> = {}): StaffMemberListItem => ({
  staffMemberId: 1,
  isMasked: false,
  name: "서지안",
  phone: "01028417702",
  store: { storeId: 1, name: "모리커피 서초점", storeType: "DIRECT" },
  employmentType: "FULL_TIME",
  joinState: "JOINED",
  invitation: null,
  linkHold: null,
  contract: { contractId: 1, status: "SIGNED", signDeadlineAt: null, endDate: null, updatedAt: null },
  employmentStatus: "EMPLOYED",
  retiredDate: null,
  ...over,
});
const contract = (status: NonNullable<StaffMemberListItem["contract"]>["status"], over = {}) => ({
  contract: { contractId: 1, status, signDeadlineAt: null, endDate: null, updatedAt: null, ...over },
});

test("번호는 3-4-4, 10자리는 3-3-4", () => {
  assert.equal(formatPhone("01028417702"), "010-2841-7702");
  assert.equal(formatPhone("0212345678"), "021-234-5678");
  assert.equal(formatPhone("12345"), "12345");
});

test("가입·인증 — 가입 완료 · 초대 발송 · 연결 보류", () => {
  assert.deepEqual(joinCell(item(), TODAY), { text: "가입 완료", style: "badge-on" });
  assert.deepEqual(
    joinCell(item({ joinState: "INVITED", invitation: { invitationType: "SIGNUP", status: "SENT", lastSentAt: "2026-08-31T09:12:00+09:00", expiresAt: "2026-09-30T09:12:00+09:00", canResend: true } }), TODAY),
    { text: "초대 발송 · 08-31", style: "badge-off" },
  );
  assert.deepEqual(
    joinCell(item({ joinState: "LINK_HOLD", linkHold: { linkHoldId: 1, mismatchReason: "PHONE_MISMATCH", verifiedPhoneLast4: "4418", heldAt: "2026-10-08T09:00:00+09:00" } }), TODAY),
    { text: "연결 보류 · 4일", style: "badge-off" },
  );
});

test("가입·인증 — 초대 발송일은 한국 날짜다(UTC 로 전날이어도)", () => {
  const cell = joinCell(item({ joinState: "INVITED", invitation: { invitationType: "SIGNUP", status: "SENT", lastSentAt: "2026-08-30T15:30:00Z", expiresAt: "2026-09-29T15:30:00Z", canResend: true } }), TODAY);
  assert.equal(cell.text, "초대 발송 · 08-31");
});

test("가입·인증 — 나머지 상태", () => {
  const cases: [StaffMemberListItem["joinState"], string, string][] = [
    ["EXPIRED", "초대 만료", "badge-off"],
    ["REJECTED", "거절", "badge-off"],
    ["AFFILIATION_PENDING", "소속 추가 확인", "badge-on"],
    ["RETURN_PENDING", "복귀 확인", "badge-on"],
    ["UNDER_AGE", "가입 불가(만 19세 미만)", "badge-off"],
    ["DRAFT", "초안", "badge-neutral"],
  ];
  for (const [joinState, text, style] of cases) assert.deepEqual(joinCell(item({ joinState }), TODAY), { text, style });
});

test("가입·인증 — 퇴직한 가입 완료는 회색", () => {
  assert.deepEqual(joinCell(item({ employmentStatus: "RETIRED" }), TODAY), { text: "가입 완료", style: "badge-neutral" });
});

test("계약 — 상태별 표시", () => {
  assert.equal(contractCell(item({ contract: null }), TODAY), null);
  assert.deepEqual(contractCell(item(contract("DRAFT")), TODAY), { text: "임시저장", style: "badge-neutral" });
  assert.deepEqual(contractCell(item(contract("PENDING_SEND")), TODAY), { text: "발송 대기", style: "badge-neutral" });
  assert.deepEqual(contractCell(item(contract("SIGNED")), TODAY), { text: "체결 완료", style: "badge-on" });
  assert.deepEqual(contractCell(item(contract("REJECTED")), TODAY), { text: "거부", style: "badge-off" });
  assert.deepEqual(contractCell(item(contract("EXPIRED")), TODAY), { text: "만료", style: "badge-off" });
  assert.deepEqual(contractCell(item(contract("ENDED")), TODAY), { text: "종료", style: "badge-neutral" });
});

test("계약 — 서명 대기 D-day 는 한국 날짜로", () => {
  assert.deepEqual(
    contractCell(item(contract("PENDING_SIGNATURE", { signDeadlineAt: "2026-11-05T09:00:00+09:00" })), TODAY),
    { text: "서명 대기 · D-24", style: "badge-off" },
  );
});

test("서명 기한이 지났으면 D-day 없이 서명 대기 — 만료 배치 전의 잠깐", () => {
  assert.deepEqual(
    contractCell(item(contract("PENDING_SIGNATURE", { signDeadlineAt: "2026-10-11T09:00:00+09:00" })), TODAY),
    { text: "서명 대기", style: "badge-off" },
  );
});

test("거부는 최종 수정일을 한국 날짜로 붙인다 — 거부일을 따로 저장하지 않는다", () => {
  assert.deepEqual(
    contractCell(item(contract("REJECTED", { updatedAt: "2026-09-01T15:30:00Z" })), TODAY),
    { text: "거부 · 09-02", style: "badge-off" },
  );
});

test("오늘이 기한이면 D-0", () => {
  assert.equal(contractCell(item(contract("PENDING_SIGNATURE", { signDeadlineAt: "2026-10-12T23:00:00+09:00" })), TODAY)?.text, "서명 대기 · D-0");
  assert.equal(contractCell(item(contract("SIGNED", { endDate: TODAY })), TODAY)?.text, "갱신 예정 D-0");
});

test("계약 — 종료일 30일 안이면 갱신 예정, 31일이면 체결 완료", () => {
  assert.deepEqual(contractCell(item(contract("SIGNED", { endDate: "2026-11-01" })), TODAY), { text: "갱신 예정 D-20", style: "badge-off" });
  assert.equal(contractCell(item(contract("SIGNED", { endDate: "2026-11-11" })), TODAY)?.text, "갱신 예정 D-30");
  assert.equal(contractCell(item(contract("SIGNED", { endDate: "2026-11-12" })), TODAY)?.text, "체결 완료");
});

test("종료일이 지났으면 체결 완료", () => {
  assert.equal(contractCell(item(contract("SIGNED", { endDate: "2026-10-11" })), TODAY)?.text, "체결 완료");
});

test("재직 칸 — 위에서부터 처음 맞는 것", () => {
  const cases: [Partial<StaffMemberListItem>, { text: string; style: string }[]][] = [
    [{ employmentStatus: "RETIRED", retiredDate: "2026-07-31" }, [{ text: "퇴직 07-31", style: "muted" }]],
    [{ joinState: "LINK_HOLD" }, [{ text: "확인 필요", style: "mark-off" }]],
    [{ joinState: "UNDER_AGE" }, [{ text: "삭제 대상", style: "mark-off" }]],
    [{ joinState: "AFFILIATION_PENDING" }, [{ text: "응답 대기", style: "muted" }]],
    [{ joinState: "RETURN_PENDING" }, [{ text: "응답 대기", style: "muted" }]],
    [{ joinState: "INVITED" }, [{ text: "가입 대기", style: "muted" }]],
    [contract("PENDING_SIGNATURE"), [{ text: "날인 대기", style: "mark-off" }]],
    [contract("REJECTED"), [{ text: "재발송 필요", style: "mark-off" }]],
    [contract("EXPIRED"), [{ text: "재발송 필요", style: "mark-off" }]],
    [{}, [{ text: "재직", style: "mark-on" }]],
    [{ retiredDate: "2026-10-30" }, [{ text: "재직", style: "mark-on" }, { text: "퇴직 예정 10-30", style: "badge-off" }]],
  ];
  for (const [over, expected] of cases) assert.deepEqual(statusCells(item(over)), expected, JSON.stringify(over));
});

test("상세 재직 상태 — 가입 · 계약 상태와 상관없이 재직 · 퇴직 예정 · 퇴직만", () => {
  const cases: [Partial<StaffMemberListItem>, { text: string; style: string }[]][] = [
    [{}, [{ text: "재직", style: "mark-on" }]],
    [contract("PENDING_SIGNATURE"), [{ text: "재직", style: "mark-on" }]],
    [contract("REJECTED"), [{ text: "재직", style: "mark-on" }]],
    [{ joinState: "INVITED" }, [{ text: "재직", style: "mark-on" }]],
    [{ joinState: "LINK_HOLD" }, [{ text: "재직", style: "mark-on" }]],
    [{ joinState: "UNDER_AGE" }, [{ text: "재직", style: "mark-on" }]],
    [{ retiredDate: "2026-10-30" }, [{ text: "재직", style: "mark-on" }, { text: "퇴직 예정 10-30", style: "badge-off" }]],
    [{ employmentStatus: "RETIRED", retiredDate: "2026-07-31" }, [{ text: "퇴직 07-31", style: "muted" }]],
    [{ employmentStatus: "RETIRED" }, [{ text: "퇴직", style: "muted" }]],
    [{ employmentStatus: null }, []],
  ];
  for (const [over, expected] of cases) assert.deepEqual(employmentStatusCells(item(over)), expected, JSON.stringify(over));
});

test("순번은 내림차순 — 전체 건수에서 거꾸로 센다", () => {
  assert.equal(rowNumber(63, 1, 20, 0), 63);
  assert.equal(rowNumber(63, 1, 20, 19), 44);
  assert.equal(rowNumber(63, 4, 20, 2), 1);
});

test("상세 이메일 칸의 가입 상태 글자는 목록 「가입·인증」 칸(날짜 · 일수 없을 때)과 같다", () => {
  for (const joinState of ["EXPIRED", "REJECTED", "LINK_HOLD", "AFFILIATION_PENDING", "RETURN_PENDING", "UNDER_AGE"] as const) {
    assert.equal(staffEmailText({ email: null, joinState }), joinCell(item({ joinState }), TODAY).text, joinState);
  }
});
