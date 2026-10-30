// 근로계약 상세의 계약서 파일 줄(WHALEERP-155). 종이 계약은 올린 날인본(근로계약서 · 임금계약서, CTR-23), 전자계약은 api 가 만든
// 처리 완료본(서명을 합성한 PDF — 관리자는 이것으로 서명을 확인한다)과 보낸 원본(발송마다 한 장, WHALEERP-131). 직원 필기 서명은
// api 가 싣지 않는다. 처리 완료본은 날인 뒤 api 가 곧바로(늦으면 10분 배치가) 만들어, 체결됐는데 아직 없으면 만드는 중이라고 알린다.

export type ContractFile = { contractDocumentId: number; kind: string; fileName: string };
export type DocumentRow = { label: string; documents: ContractFile[]; empty: string | null };

type Source = {
  contractMethod: string | null;
  status: string | null;
  histories: readonly { fromStatus: string | null; toStatus: string }[];
  documents: readonly ContractFile[];
};

const PAPER_ORDER = ["PAPER_EMPLOYMENT_CONTRACT", "WAGE_CONTRACT"];

/** 체결된 계약 — 체결 완료이거나 체결 완료에서 종료됐다(api 직원 앱 처리 완료본 내려받기와 같은 기준) */
const executed = (c: Source) =>
  c.status === "SIGNED" || (c.status === "ENDED" && c.histories.some((h) => h.fromStatus === "SIGNED" && h.toStatus === "ENDED"));

const newestFirst = (a: ContractFile, b: ContractFile) => b.contractDocumentId - a.contractDocumentId;

export function documentRowsOf(c: Source): DocumentRow[] {
  if (c.contractMethod === "PAPER") {
    const paper = c.documents
      .filter((d) => PAPER_ORDER.includes(d.kind))
      .sort((a, b) => PAPER_ORDER.indexOf(a.kind) - PAPER_ORDER.indexOf(b.kind));
    return paper.length ? [{ label: "날인본", documents: paper, empty: null }] : [];
  }
  const rows: DocumentRow[] = [];
  const signed = c.documents.filter((d) => d.kind === "SIGNED_COPY").sort(newestFirst);
  if (signed.length) rows.push({ label: "처리 완료본", documents: signed, empty: null });
  else if (executed(c)) rows.push({ label: "처리 완료본", documents: [], empty: "처리 완료본을 만드는 중입니다. 잠시 뒤 새로 고쳐 주세요." });
  const sent = c.documents.filter((d) => d.kind === "SENT_ORIGINAL").sort(newestFirst);
  if (sent.length) rows.push({ label: "보낸 원본", documents: sent, empty: null });
  return rows;
}
