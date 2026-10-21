// 급여명세서 작성 팝업(WHALEERP-226)의 칸 · 좁히기 · 결과 문구. node --test 가 이 파일을 직접 읽으므로 import 는 상대 경로 + .ts 로 쓴다.
import type { PayslipBulkResult, PayslipCandidate } from "../../lib/payslips.ts";
import type { Cell } from "../staff-members/staff-row.ts";

/** 유효한 근로계약이 있고 이 달 명세서가 아직 없을 때만 고른다 — 나머지는 api 도 409 · 422 로 막는다. */
export const canDraft = (c: PayslipCandidate) => c.contractId !== null && c.payslipId === null;

/** 데모 pickRow — 유효는 그냥 글자, 계약 없음은 빨간 꼬리표(risk). */
export const contractCell = (c: PayslipCandidate): Cell =>
  c.contractId !== null ? { text: "유효", style: "muted" } : { text: "계약 없음", style: "badge-off" };

/** 데모 pickRow — 미작성은 그냥 글자, 작성됨은 회색 꼬리표(quiet). */
export const payslipCell = (c: PayslipCandidate): Cell =>
  c.payslipId !== null ? { text: "작성됨", style: "badge-neutral" } : { text: "미작성", style: "muted" };

/** 점포 선택지 — 작성 대상(관리 범위 직원)의 점포를 이름순으로 한 번씩. */
export function candidateStores(items: readonly PayslipCandidate[]): { storeId: number; name: string }[] {
  const byId = new Map(items.map((c) => [c.storeId, c.storeName]));
  return [...byId].map(([storeId, name]) => ({ storeId, name })).sort((a, b) => a.name.localeCompare(b.name, "ko") || a.storeId - b.storeId);
}

/** 점포(null 은 전체)와 이름 부분 일치로 좁힌다. */
export function filterCandidates(items: readonly PayslipCandidate[], storeId: number | null, name: string): PayslipCandidate[] {
  const q = name.trim();
  return items.filter((c) => (storeId === null || c.storeId === storeId) && (!q || c.staffName.includes(q)));
}

const SKIP_LABEL = { EXISTS: "이미 있음", NO_CONTRACT: "계약 없음" } as const;

/** 일괄 작성 결과 한 줄(토스트). 「2건 작성 (출퇴근 누락 1건) · 3건 건너뜀 (이미 있음 1 · 계약 없음 2)」 */
export function bulkSummary({ created, skipped }: PayslipBulkResult): string {
  const missing = created.filter((c) => c.hasMissingAttendance).length;
  let text = `${created.length}건 작성${missing > 0 ? ` (출퇴근 누락 ${missing}건)` : ""}`;
  if (skipped.length > 0) {
    const reasons = (Object.keys(SKIP_LABEL) as (keyof typeof SKIP_LABEL)[])
      .map((reason) => [reason, skipped.filter((s) => s.reason === reason).length] as const)
      .filter(([, n]) => n > 0)
      .map(([reason, n]) => `${SKIP_LABEL[reason]} ${n}`);
    text += ` · ${skipped.length}건 건너뜀 (${reasons.join(" · ")})`;
  }
  return text;
}
