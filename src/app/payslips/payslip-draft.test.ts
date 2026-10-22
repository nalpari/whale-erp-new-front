// node --test src/app/payslips/payslip-draft.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import type { PayslipCandidate } from "../../lib/payslips.ts";
import { bulkSummary, canDraft, candidateStores, contractCell, filterCandidates, payslipCell } from "./payslip-draft.ts";

const candidate = (over: Partial<PayslipCandidate> = {}): PayslipCandidate => ({
  staffMemberId: 30,
  staffName: "서지안",
  storeId: 5,
  storeName: "모리커피 서초점",
  employmentType: "PART_TIME",
  contractId: 7,
  payslipId: null,
  hasAttendance: true,
  ...over,
});

test("고를 수 있는 줄 — 유효한 계약이 있고 이 달 명세서가 아직 없을 때만", () => {
  assert.equal(canDraft(candidate()), true);
  assert.equal(canDraft(candidate({ contractId: null })), false);
  assert.equal(canDraft(candidate({ payslipId: 55 })), false);
});

test("칸 — 근로계약 유효 · 계약 없음(빨간 꼬리표), 명세서 미작성 · 작성됨(회색 꼬리표)", () => {
  assert.deepEqual(contractCell(candidate()), { text: "유효", style: "muted" });
  assert.deepEqual(contractCell(candidate({ contractId: null })), { text: "계약 없음", style: "badge-off" });
  assert.deepEqual(payslipCell(candidate()), { text: "미작성", style: "muted" });
  assert.deepEqual(payslipCell(candidate({ payslipId: 55 })), { text: "작성됨", style: "badge-neutral" });
});

const items = [
  candidate(),
  candidate({ staffMemberId: 31, staffName: "하준서", storeId: 6, storeName: "온기식당 판교점" }),
  candidate({ staffMemberId: 32, staffName: "서하은", storeId: 6, storeName: "온기식당 판교점" }),
];

test("점포 선택지 — 작성 대상의 점포를 이름순으로 한 번씩", () => {
  assert.deepEqual(candidateStores([...items].reverse()), [
    { storeId: 5, name: "모리커피 서초점" },
    { storeId: 6, name: "온기식당 판교점" },
  ]);
});

test("좁히기 — 점포(null 은 전체)와 이름 부분 일치(앞뒤 공백 무시)", () => {
  const ids = (list: PayslipCandidate[]) => list.map((c) => c.staffMemberId);
  assert.deepEqual(ids(filterCandidates(items, null, "")), [30, 31, 32]);
  assert.deepEqual(ids(filterCandidates(items, 6, "")), [31, 32]);
  assert.deepEqual(ids(filterCandidates(items, null, " 서 ")), [30, 31, 32]);
  assert.deepEqual(ids(filterCandidates(items, 6, "하은")), [32]);
});

test("일괄 작성 결과 한 줄 — 만든 수 · 건너뛴 수와 사유, 출퇴근 누락", () => {
  assert.equal(
    bulkSummary({
      created: [
        { payslipId: 1, staffMemberId: 1, staffName: "a", hasMissingAttendance: true },
        { payslipId: 2, staffMemberId: 2, staffName: "b", hasMissingAttendance: false },
      ],
      skipped: [
        { staffMemberId: 3, staffName: "c", reason: "EXISTS" },
        { staffMemberId: 4, staffName: "d", reason: "NO_CONTRACT" },
        { staffMemberId: 5, staffName: "e", reason: "NO_CONTRACT" },
      ],
    }),
    "2건 작성 (출퇴근 누락 1건) · 3건 건너뜀 (이미 있음 1 · 계약 없음 2)",
  );
  assert.equal(
    bulkSummary({ created: [{ payslipId: 1, staffMemberId: 1, staffName: "a", hasMissingAttendance: false }], skipped: [] }),
    "1건 작성",
  );
  assert.equal(bulkSummary({ created: [], skipped: [{ staffMemberId: 3, staffName: "c", reason: "EXISTS" }] }), "0건 작성 · 1건 건너뜀 (이미 있음 1)");
});
