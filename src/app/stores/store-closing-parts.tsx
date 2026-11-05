"use client";

import { ConfirmDialog } from "@/components/common";
import { WarnBand } from "@/components/site/side-parts";
import {
  CLOSING_COUNTS_UNKNOWN,
  closingBlockOf,
  closingCheckLines,
  closingPayslipText,
  closingResultLines,
  type ClosingLine,
  type StoreClosingCounts,
  type StoreClosingResult,
} from "@/lib/store-closing";

// 점포 폐점의 막힘 · 확인 목록 · 결과 안내. 상세의 상태 변경과 수정 화면의 폐점이 같이 쓴다.
// 폐점은 퇴근하지 않은 출근만 막는다 — 근로계약은 막지 않고 대기 계약을 폐점이 닫는다(api 2026-11-04). 직원 알림은 없다.

/** 회색 안내 상자 — 상태 변경 팝업의 운영 · 폐점 조건과 같은 모양 */
const BOX = "rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[16px]";

/** 줄 목록 — 설명(note)은 다음 줄에 작은 회색 글씨로 둔다(2026-11-05 사용자 지정, 전엔 「 — 설명」으로 이어 붙였다) */
function Lines({ lines, numbered = false }: { lines: ClosingLine[]; numbered?: boolean }) {
  const List = numbered ? "ol" : "ul";
  return (
    <List className={`mt-[6px] space-y-[6px] pl-[18px] ${numbered ? "list-decimal" : "list-disc"}`}>
      {lines.map((line) => (
        <li key={line.key}>
          {line.text}
          {line.note && <span className="block text-[13px] text-erp-label">{line.note}</span>}
        </li>
      ))}
    </List>
  );
}

/**
 * 폐점 조건 — 「퇴근 기록이 없는 출근 N건」(가려진 직원 것 포함, 2026-11-05 「퇴근하지 않은 출근」에서 바꿈). 건수만 보인다 — api 는 직원 이름 · 시각을 주지 않고, 할 일 안내는 두지 않는다(2026-11-05 사용자 지정).
 * counts 가 없으면(이미 폐점 · 확인 실패 · 출근 말고 다른 이유로 막힘) 그리지 않는다.
 */
export function ClosingCondition({ counts }: { counts: Pick<StoreClosingCounts, "openCheckIns"> | null | undefined }) {
  if (!counts) return null;
  const block = closingBlockOf(counts);
  return (
    <div className={BOX}>
      <p className="font-semibold">폐점 조건</p>
      <ul className="mt-[6px] list-disc pl-[18px]">
        <li className={block ? "text-erp-off" : undefined}>
          퇴근 기록이 없는 출근 <b className="font-semibold">{(block?.count ?? 0).toLocaleString("ko-KR")}건</b>
        </li>
      </ul>
    </div>
  );
}

/**
 * 폐점하면 함께 처리될 것 — 폐점 확인 창 안. 되돌릴 수 없는 결과(퇴직 · 계약 종료)라 빨간 안내 상자로 둔다(DESIGN.md 1팀 확인창).
 * 0건인 줄은 뺀다. 확정하지 않은 급여명세서는 처리하지 않으므로 상자 밖 회색 안내로 둔다. 체결 완료 계약 · 직원 알림 안내는 두지 않는다(2026-11-05 사용자 지정).
 * counts 가 없으면(확인 값을 받지 못함) 목록을 빼지 않고 무엇이 처리되는지만 같은 상자로 알린다.
 */
export function ClosingCheckList({ counts }: { counts: StoreClosingCounts | null }) {
  const lines = counts ? closingCheckLines(counts) : [];
  const payslip = counts ? closingPayslipText(counts) : null;
  return (
    <div className="mt-[12px] flex flex-col gap-[6px]">
      {!counts ? (
        <WarnBand>{CLOSING_COUNTS_UNKNOWN}</WarnBand>
      ) : lines.length ? (
        <WarnBand>
          <p className="font-medium">폐점 시 다음 항목이 함께 처리됩니다.</p>
          {/* 확인 창은 번호를 매긴다(2026-11-05 사용자 지정) — 결과 창은 점 목록 그대로 */}
          <Lines lines={lines} numbered />
        </WarnBand>
      ) : (
        <p className={BOX}>함께 처리할 직원 · 근로계약이 없습니다.</p>
      )}
      {payslip && <p className="text-[13px] text-erp-label">{payslip}</p>}
    </div>
  );
}

/** 폐점 저장 결과 — 처리한 것이 있을 때만 연다(없으면 부르는 쪽이 토스트만 띄운다). [확인] 하나뿐이다 */
export function ClosingResultDialog({ result, onClose }: { result: StoreClosingResult | null; onClose: () => void }) {
  const lines = result ? closingResultLines(result.total) : [];
  return (
    <ConfirmDialog open={Boolean(result)} title="폐점했습니다." cancelLabel={null} wide onConfirm={onClose} onCancel={onClose}>
      <div className={BOX}>
        <p className="font-semibold">함께 처리한 것</p>
        <Lines lines={lines} />
      </div>
    </ConfirmDialog>
  );
}

/** 처리한 것이 있는 결과인가 — 없으면 결과 창 대신 토스트만 */
export const hasClosingResult = (result: StoreClosingResult | null | undefined): result is StoreClosingResult =>
  Boolean(result && closingResultLines(result.total).length);
