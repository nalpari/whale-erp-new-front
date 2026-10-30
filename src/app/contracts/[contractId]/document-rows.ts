// 근로계약 상세의 계약서 파일 줄(WHALEERP-155). 종이 계약은 올린 날인본(근로계약서 · 임금계약서, CTR-23), 전자계약은 api 가 만든
// 처리 완료본(서명을 합성한 PDF — 관리자는 이것으로 서명을 확인한다)과 보낸 원본(발송마다 한 장, WHALEERP-131). 직원 필기 서명은
// api 가 싣지 않는다. 처리 완료본은 날인 뒤 api 가 곧바로(늦으면 10분 배치가) 만든다 — 체결됐는데 아직 없으면 그렇다고 알린다.

export type ContractFile = { contractDocumentId: number; kind: string; fileName: string };
/** withKind — 링크에 파일 종류 이름을 붙이는가. 종이 날인본 줄은 두 종류가 섞여 붙이고, 전자계약 줄은 줄 이름이 곧 종류라 뗀다 */
export type DocumentRow = { label: string; documents: ContractFile[]; empty: string | null; withKind: boolean };

type Source = {
  contractMethod: string | null;
  status: string | null;
  histories: readonly { fromStatus: string | null; toStatus: string }[];
  documents: readonly ContractFile[];
};

const PAPER_ORDER = ["PAPER_EMPLOYMENT_CONTRACT", "WAGE_CONTRACT"];

/**
 * 체결됐는데 처리 완료본이 없을 때. 날인 직후면 곧 생기지만, 필기 서명 없이 체결된 옛 계약처럼 api 가 만들 수 없는 경우도 있어
 * 「잠시 뒤 생긴다」고 약속하지 않는다.
 */
export const NO_SIGNED_COPY = "처리 완료본이 아직 없습니다. 날인 직후라면 잠시 뒤 새로 고쳐 주세요.";

/** 체결된 계약 — 체결 완료이거나 체결 완료에서 종료됐다(api 직원 앱 처리 완료본 내려받기와 같은 기준) */
const executed = (c: Source) =>
  c.status === "SIGNED" || (c.status === "ENDED" && c.histories.some((h) => h.fromStatus === "SIGNED" && h.toStatus === "ENDED"));

const newestFirst = (a: ContractFile, b: ContractFile) => b.contractDocumentId - a.contractDocumentId;

export function documentRowsOf(c: Source): DocumentRow[] {
  if (c.contractMethod === "PAPER") {
    const paper = c.documents
      .filter((d) => PAPER_ORDER.includes(d.kind))
      .sort((a, b) => PAPER_ORDER.indexOf(a.kind) - PAPER_ORDER.indexOf(b.kind));
    return paper.length ? [{ label: "날인본", documents: paper, empty: null, withKind: true }] : [];
  }
  const rows: DocumentRow[] = [];
  const signed = c.documents.filter((d) => d.kind === "SIGNED_COPY").sort(newestFirst);
  if (signed.length) rows.push({ label: "처리 완료본", documents: signed, empty: null, withKind: false });
  else if (executed(c)) rows.push({ label: "처리 완료본", documents: [], empty: NO_SIGNED_COPY, withKind: false });
  const sent = c.documents.filter((d) => d.kind === "SENT_ORIGINAL").sort(newestFirst);
  if (sent.length) rows.push({ label: "보낸 원본", documents: sent, empty: null, withKind: false });
  return rows;
}
