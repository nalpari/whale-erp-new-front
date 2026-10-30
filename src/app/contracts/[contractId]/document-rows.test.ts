// node --test "src/app/contracts/[contractId]/document-rows.test.ts"
import assert from "node:assert/strict";
import { test } from "node:test";
import { documentRowsOf } from "./document-rows.ts";

const doc = (contractDocumentId: number, kind: string, fileName = `${kind}.pdf`) => ({ contractDocumentId, kind, fileName });
const signedHistory = [{ fromStatus: "PENDING_SIGNATURE", toStatus: "SIGNED" }];

test("documentRowsOf — 종이 계약은 날인본 한 줄(근로계약서 먼저), 전자 파일은 섞지 않는다", () => {
  const rows = documentRowsOf({
    contractMethod: "PAPER",
    status: "SIGNED",
    histories: [],
    documents: [doc(2, "WAGE_CONTRACT"), doc(1, "PAPER_EMPLOYMENT_CONTRACT")],
  });
  assert.deepEqual(rows, [{ label: "날인본", documents: [doc(1, "PAPER_EMPLOYMENT_CONTRACT"), doc(2, "WAGE_CONTRACT")], empty: null }]);
});

test("documentRowsOf — 체결된 전자계약은 처리 완료본(서명 확인)과 보낸 원본(최근 것 먼저)", () => {
  const rows = documentRowsOf({
    contractMethod: "ELECTRONIC",
    status: "SIGNED",
    histories: signedHistory,
    documents: [doc(3, "SENT_ORIGINAL", "a.pdf"), doc(5, "SIGNED_COPY"), doc(4, "SENT_ORIGINAL", "b.pdf")],
  });
  assert.deepEqual(rows, [
    { label: "처리 완료본", documents: [doc(5, "SIGNED_COPY")], empty: null },
    { label: "보낸 원본", documents: [doc(4, "SENT_ORIGINAL", "b.pdf"), doc(3, "SENT_ORIGINAL", "a.pdf")], empty: null },
  ]);
});

test("documentRowsOf — 체결됐는데 처리 완료본이 아직 없으면 만드는 중 안내", () => {
  const rows = documentRowsOf({ contractMethod: "ELECTRONIC", status: "SIGNED", histories: signedHistory, documents: [] });
  assert.deepEqual(rows, [{ label: "처리 완료본", documents: [], empty: "처리 완료본을 만드는 중입니다. 잠시 뒤 새로 고쳐 주세요." }]);
});

test("documentRowsOf — 체결 완료에서 종료된 계약도 처리 완료본을 보인다. 체결 없이 종료 · 서명 대기는 보낸 원본만", () => {
  const ended = documentRowsOf({
    contractMethod: "ELECTRONIC",
    status: "ENDED",
    histories: [...signedHistory, { fromStatus: "SIGNED", toStatus: "ENDED" }],
    documents: [doc(5, "SIGNED_COPY")],
  });
  assert.equal(ended[0].label, "처리 완료본");
  for (const status of ["PENDING_SIGNATURE", "ENDED", "REJECTED"])
    assert.deepEqual(
      documentRowsOf({ contractMethod: "ELECTRONIC", status, histories: [], documents: [doc(3, "SENT_ORIGINAL")] }),
      [{ label: "보낸 원본", documents: [doc(3, "SENT_ORIGINAL")], empty: null }],
    );
  assert.deepEqual(documentRowsOf({ contractMethod: null, status: "PENDING_SIGNATURE", histories: [], documents: [] }), []);
});

test("documentRowsOf — 체결 완료에서 종료됐는데 처리 완료본이 없으면 만드는 중 안내, 계약 방식이 빈 옛 계약은 전자로 본다", () => {
  assert.deepEqual(
    documentRowsOf({
      contractMethod: "ELECTRONIC",
      status: "ENDED",
      histories: [...signedHistory, { fromStatus: "SIGNED", toStatus: "ENDED" }],
      documents: [],
    }),
    [{ label: "처리 완료본", documents: [], empty: "처리 완료본을 만드는 중입니다. 잠시 뒤 새로 고쳐 주세요." }],
  );
  assert.deepEqual(
    documentRowsOf({ contractMethod: null, status: "SIGNED", histories: signedHistory, documents: [doc(5, "SIGNED_COPY"), doc(6, "SIGNATURE")] }),
    [{ label: "처리 완료본", documents: [doc(5, "SIGNED_COPY")], empty: null }],
  );
});
