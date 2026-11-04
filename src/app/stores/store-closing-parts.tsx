"use client";

import { ConfirmDialog } from "@/components/common";
import { WarnBand } from "@/components/site/side-parts";
import {
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

function Lines({ lines }: { lines: ClosingLine[] }) {
  return (
    <ul className="mt-[6px] list-disc pl-[18px]">
      {lines.map((line) => (
        <li key={line.key}>
          {line.text}
          {line.note && <span className="text-erp-label"> — {line.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * 폐점 조건 — 퇴근하지 않은 출근 N건(가려진 직원 것 포함). 막히면 첫 건(이름 · 출근 시각)과 할 일을 덧붙인다.
 * counts 가 없으면(이미 폐점했거나 확인 전) 그리지 않는다.
 */
export function ClosingCondition({ counts }: { counts: Pick<StoreClosingCounts, "openCheckIns"> | null | undefined }) {
  if (!counts) return null;
  const block = closingBlockOf(counts);
  return (
    <div className={BOX}>
      <p className="font-semibold">폐점 조건</p>
      <ul className="mt-[6px] list-disc pl-[18px]">
        <li className={block ? "text-erp-off" : undefined}>
          퇴근하지 않은 출근 <b className="font-semibold">{(block?.count ?? 0).toLocaleString("ko-KR")}건</b>
        </li>
      </ul>
      {block && (
        <p className="mt-[6px] text-erp-label">
          {block.first && (
            <>
              첫 건: {block.first.name} · {block.first.recordedAt} 출근
              <br />
            </>
          )}
          {block.guide}
        </p>
      )}
    </div>
  );
}

/**
 * 폐점하면 함께 처리될 것 — 폐점 확인 창 안. 되돌릴 수 없는 결과(퇴직 · 계약 종료)라 빨간 안내 상자로 둔다(DESIGN.md 1팀 확인창).
 * 0건인 줄은 뺀다. 확정하지 않은 급여명세서는 처리하지 않으므로 상자 밖 회색 안내로 둔다. 체결 완료 계약은 남고 직원 알림은 가지 않는다.
 */
export function ClosingCheckList({ counts }: { counts: StoreClosingCounts }) {
  const lines = closingCheckLines(counts);
  const payslip = closingPayslipText(counts);
  return (
    <div className="mt-[12px] flex flex-col gap-[6px]">
      {lines.length ? (
        <WarnBand>
          <p className="font-medium">폐점하면 함께 처리됩니다.</p>
          <Lines lines={lines} />
        </WarnBand>
      ) : (
        <p className={BOX}>함께 처리할 직원 · 근로계약이 없습니다.</p>
      )}
      <p className="text-[13px] text-erp-label">
        {payslip && (
          <>
            {payslip}
            <br />
          </>
        )}
        체결 완료 근로계약은 그대로 남고, 직원에게 알림을 보내지 않습니다.
      </p>
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
