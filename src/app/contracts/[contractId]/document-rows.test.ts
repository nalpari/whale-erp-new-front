// node --test "src/app/contracts/[contractId]/document-rows.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { NO_SIGNED_COPY, documentRowsOf } from "./document-rows.ts";

const doc = (contractDocumentId: number, kind: string, fileName = `${kind}.pdf`) => ({ contractDocumentId, kind, fileName });
const signedHistory = [{ fromStatus: "PENDING_SIGNATURE", toStatus: "SIGNED" }];

test("documentRowsOf — 종이 계약은 날인본 한 줄(근로계약서 먼저, 종류 이름을 붙인다)", () => {
  const rows = documentRowsOf({
    contractMethod: "PAPER",
    status: "SIGNED",
    histories: [],
    documents: [doc(2, "WAGE_CONTRACT"), doc(1, "PAPER_EMPLOYMENT_CONTRACT")],
  });
  assert.deepEqual(rows, [{ label: "날인본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT"), doc(2, "WAGE_CONTRACT")], withKind: true }]);
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

test("documentRowsOf — 줄은 파일 종류로 나눈다: 계약 방식이 빈 옛 계약의 날인본 · 방식이 섞인 파일 · 모르는 종류도 빠지지 않는다", () => {
  assert.deepEqual(
    documentRowsOf({
      contractMethod: null,
      status: "SIGNED",
      histories: signedHistory,
      documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT"), doc(5, "SIGNED_COPY"), doc(7, "NEW_KIND")],
    }),
    [
      { label: "날인본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT")], withKind: true },
      { label: "처리 완료본", documents: [doc(5, "SIGNED_COPY")], withKind: false },
      { label: "기타 파일", documents: [doc(7, "NEW_KIND")], withKind: true },
    ],
  );
  assert.deepEqual(
    documentRowsOf({ contractMethod: "PAPER", status: "SIGNED", histories: [], documents: [doc(3, "SENT_ORIGINAL")] }),
    [{ label: "보낸 원본", documents: [doc(3, "SENT_ORIGINAL")], withKind: false }],
  );
});

test("documentRowsOf — 계약 방식이 빈 옛 종이 계약(날인본만)에는 「처리 완료본 없음」을 붙이지 않는다", () => {
  assert.deepEqual(
    documentRowsOf({ contractMethod: null, status: "SIGNED", histories: [], documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT")] }),
    [{ label: "날인본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT")], withKind: true }],
  );
});
