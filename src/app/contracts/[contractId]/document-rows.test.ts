// node --test "src/app/contracts/[contractId]/document-rows.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { NO_SIGNED_COPY, SENT_ORIGINAL_PENDING, documentRowsOf } from "./document-rows.ts";

const doc = (contractDocumentId: number, kind: string, fileName = `${kind}.pdf`) => ({ contractDocumentId, kind, fileName });
const signedHistory = [{ fromStatus: "PENDING_SIGNATURE", toStatus: "SIGNED" }];

test("documentRowsOf — 종이 계약은 서명본 한 줄(근로계약서 먼저, 종류 이름을 붙인다)", () => {
  const rows = documentRowsOf({
    contractMethod: "PAPER",
    status: "SIGNED",
    histories: [],
    documents: [doc(2, "WAGE_CONTRACT"), doc(1, "PAPER_EMPLOYMENT_CONTRACT")],
  });
  assert.deepEqual(rows, [{ label: "서명본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT"), doc(2, "WAGE_CONTRACT")], withKind: true }]);
});

test("documentRowsOf — 체결된 전자계약은 처리 완료본(서명 확인)과 보낸 원본(최근 것 먼저), 필기 서명은 보이지 않는다", () => {
  const rows = documentRowsOf({
    contractMethod: "ELECTRONIC",
    status: "SIGNED",
    histories: signedHistory,
    documents: [doc(3, "SENT_ORIGINAL", "a.pdf"), doc(5, "SIGNED_COPY"), doc(4, "SENT_ORIGINAL", "b.pdf"), doc(6, "SIGNATURE")],
  });
  assert.deepEqual(rows, [
    { label: "처리 완료본", documents: [doc(5, "SIGNED_COPY")], withKind: false },
    { label: "보낸 원본", documents: [doc(4, "SENT_ORIGINAL", "b.pdf"), doc(3, "SENT_ORIGINAL", "a.pdf")], withKind: false },
  ]);
});

test("documentRowsOf — 체결됐는데 처리 완료본이 없으면 「아직 없음」 안내 — 체결 완료 · 체결 완료에서 종료 · 이력 없는 옛 종료(api 와 같은 기준)", () => {
  const empty = [{ label: "처리 완료본", documents: [], withKind: false, empty: NO_SIGNED_COPY }];
  for (const [status, histories] of [
    ["SIGNED", signedHistory],
    ["ENDED", [...signedHistory, { fromStatus: "SIGNED", toStatus: "ENDED" }]],
    ["ENDED", []],
  ] as const)
    assert.deepEqual(documentRowsOf({ contractMethod: "ELECTRONIC", status, histories, documents: [] }), empty);
  // 종이 계약은 처리 완료본이 없다
  assert.deepEqual(documentRowsOf({ contractMethod: "PAPER", status: "SIGNED", histories: [], documents: [] }), []);
});

test("documentRowsOf — 체결 없이 종료 · 서명 대기 · 거부는 보낸 원본만", () => {
  for (const [status, histories] of [
    ["PENDING_SIGNATURE", []],
    ["ENDED", [{ fromStatus: "PENDING_SIGNATURE", toStatus: "ENDED" }]],
    ["REJECTED", []],
  ] as const)
    assert.deepEqual(documentRowsOf({ contractMethod: "ELECTRONIC", status, histories, documents: [doc(3, "SENT_ORIGINAL")] }), [
      { label: "보낸 원본", documents: [doc(3, "SENT_ORIGINAL")], withKind: false },
    ]);
});

test("documentRowsOf — 줄은 파일 종류로 나눈다: 계약 방식이 빈 옛 계약의 서명본 · 방식이 섞인 파일 · 모르는 종류도 빠지지 않는다", () => {
  assert.deepEqual(
    documentRowsOf({
      contractMethod: null,
      status: "SIGNED",
      histories: signedHistory,
      documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT"), doc(5, "SIGNED_COPY"), doc(7, "NEW_KIND")],
    }),
    [
      { label: "서명본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT")], withKind: true },
      { label: "처리 완료본", documents: [doc(5, "SIGNED_COPY")], withKind: false },
      { label: "기타 파일", documents: [doc(7, "NEW_KIND")], withKind: true },
    ],
  );
  assert.deepEqual(
    documentRowsOf({ contractMethod: "PAPER", status: "SIGNED", histories: [], documents: [doc(3, "SENT_ORIGINAL")] }),
    [{ label: "보낸 원본", documents: [doc(3, "SENT_ORIGINAL")], withKind: false }],
  );
});

test("documentRowsOf — 계약 방식이 빈 옛 종이 계약(서명본만)에는 「처리 완료본 없음」을 붙이지 않는다", () => {
  assert.deepEqual(
    documentRowsOf({ contractMethod: null, status: "SIGNED", histories: [], documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT")] }),
    [{ label: "서명본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT")], withKind: true }],
  );
});

test("documentRowsOf — 마지막 발송의 보낸 원본이 아직 없으면 만드는 중 안내(하루 안, 전자계약만)", () => {
  // 마지막 발송 2026-11-13 11:59 KST
  const now = Date.parse("2026-11-13T03:00:00Z");
  const base = { contractMethod: "ELECTRONIC", status: "PENDING_SIGNATURE", histories: [], lastSentAt: "2026-11-13T02:59:00Z", now };
  const old = doc(3, "SENT_ORIGINAL", "근로계약서-보낸원본-7-202611120900.pdf");
  const last = doc(4, "SENT_ORIGINAL", "근로계약서-보낸원본-7-202611131159.pdf");
  // 재발송 직후 — 앞 발송 원본만 있다
  assert.deepEqual(documentRowsOf({ ...base, documents: [old] }), [{ label: "보낸 원본", documents: [old], withKind: false, note: SENT_ORIGINAL_PENDING }]);
  // 첫 발송 직후 — 원본이 아직 없다
  assert.deepEqual(documentRowsOf({ ...base, documents: [] }), [{ label: "보낸 원본", documents: [], withKind: false, empty: SENT_ORIGINAL_PENDING }]);
  // 마지막 발송 원본이 있으면 앞 발송 원본이 빠졌어도(옛 계약 · 원본 전에 다시 보냄) 안내하지 않는다
  assert.deepEqual(documentRowsOf({ ...base, documents: [last] }), [{ label: "보낸 원본", documents: [last], withKind: false }]);
  // 보낸 적 없거나, 마지막 발송이 하루를 넘었거나(api 가 다시 만들지 않는다), 종이 계약이면 안내하지 않는다
  assert.deepEqual(documentRowsOf({ ...base, lastSentAt: null, documents: [] }), []);
  assert.deepEqual(documentRowsOf({ ...base, lastSentAt: "2026-11-12T02:59:00Z", documents: [] }), []);
  assert.deepEqual(documentRowsOf({ ...base, contractMethod: "PAPER", documents: [] }), []);
});
