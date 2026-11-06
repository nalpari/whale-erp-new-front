// 근로계약 상세의 계약서 파일 줄(WHALEERP-155). 종이 계약은 올린 날인본(근로계약서 · 임금계약서, CTR-23), 전자계약은 api 가 만든
// 처리 완료본(서명을 합성한 PDF — 관리자는 이것으로 서명을 확인한다)과 보낸 원본(발송마다 한 장, WHALEERP-131). 직원 필기 서명은
// api 가 싣지 않고 여기서도 보이지 않는다. 처리 완료본은 날인 뒤 api 가 곧바로(늦으면 10분 배치가) 만든다 — 체결됐는데 아직 없으면
// 그렇다고 알린다. 줄은 계약 방식이 아니라 파일 종류로 나눈다 — 계약 방식이 빈 옛 계약이나 작성 중 방식을 바꾼 계약의 파일도
// 빠지지 않게(front #196 code-review). 관리자는 상태와 상관없이 저장된 파일을 모두 본다.

export type ContractFile = { contractDocumentId: number; kind: string; fileName: string };
/** withKind — 링크에 파일 종류 이름을 붙인다(날인본 · 기타 줄은 종류가 섞인다). 처리 완료본 · 보낸 원본 줄은 줄 이름이 곧 종류다 */
export type DocumentRow = { label: string; documents: ContractFile[]; withKind: boolean; empty?: string };

type Source = {
  contractMethod: string | null;
  status: string | null;
  histories: readonly { fromStatus: string | null; toStatus: string }[];
  documents: readonly ContractFile[];
};

const PAPER_ORDER = ["PAPER_EMPLOYMENT_CONTRACT", "WAGE_CONTRACT"];
const KNOWN = new Set([...PAPER_ORDER, "SIGNED_COPY", "SENT_ORIGINAL", "SIGNATURE"]);

/**
 * 체결됐는데 처리 완료본이 없을 때. 날인 직후면 곧 생기지만, 필기 서명 없이 체결된 옛 계약처럼 api 가 만들 수 없는 경우도 있어
 * 「잠시 뒤 생긴다」고 약속하지 않는다.
 */
export const NO_SIGNED_COPY = "처리 완료본이 아직 없습니다. 날인 직후라면 잠시 뒤 새로 고쳐 주세요.";

/**
 * 체결된 계약 — api 의 직원 앱 처리 완료본 내려받기(MyContractDocumentsService.executed)와 같은 기준: 체결 완료, 체결 완료에서 닫힌
 * 종료, 이력이 아예 없는 옛 종료. 재계약 버튼의 canRenew 는 일부러 더 좁다(배치가 닫은 종료만, api SIGNED_ONCE).
 */
const executed = (c: Source) =>
  c.status === "SIGNED" ||
  (c.status === "ENDED" && (c.histories.length === 0 || c.histories.some((h) => h.fromStatus === "SIGNED" && h.toStatus === "ENDED")));

const newestFirst = (a: ContractFile, b: ContractFile) => b.contractDocumentId - a.contractDocumentId;

export function documentRowsOf(c: Source): DocumentRow[] {
  const ofKind = (kind: string) => c.documents.filter((d) => d.kind === kind).sort(newestFirst);
  const rows: DocumentRow[] = [];
  const paper = c.documents
    .filter((d) => PAPER_ORDER.includes(d.kind))
    .sort((a, b) => PAPER_ORDER.indexOf(a.kind) - PAPER_ORDER.indexOf(b.kind));
  if (paper.length) rows.push({ label: "날인본", documents: paper, withKind: true });
  const signed = ofKind("SIGNED_COPY");
  if (signed.length) rows.push({ label: "처리 완료본", documents: signed, withKind: false });
  // 종이 계약이면(계약 방식이 빈 옛 계약은 날인본이 있으면) 처리 완료본이 없다 — 「아직 없음」이 영영 남지 않게(front #196 리뷰)
  else if (c.contractMethod !== "PAPER" && paper.length === 0 && executed(c)) rows.push({ label: "처리 완료본", documents: [], withKind: false, empty: NO_SIGNED_COPY });
  const sent = ofKind("SENT_ORIGINAL");
  if (sent.length) rows.push({ label: "보낸 원본", documents: sent, withKind: false });
  // api 가 새 종류를 더하면 이름표(getEnum)와 함께 보인다 — 말없이 사라지지 않게
  const other = c.documents.filter((d) => !KNOWN.has(d.kind)).sort(newestFirst);
  if (other.length) rows.push({ label: "기타 파일", documents: other, withKind: true });
  return rows;
}
