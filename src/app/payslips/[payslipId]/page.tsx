import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, DataTable, DetailTable, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { formatAmount, type PayslipReviewReasonValue } from "@/lib/payslips";
import { getPayslip } from "@/lib/payslips-api";
import { kstToday } from "@/lib/staff-members";
import { payslipListHref } from "../payslip-list-query";
import { reviewBand } from "../payslip-row";
import { PayslipReview, SectionHead } from "./payslip-review";

export const metadata: Metadata = {
  title: "급여명세서 검토 · Whale ERP",
};

const REVIEW_REASONS: readonly PayslipReviewReasonValue[] = ["MISSING_ATTENDANCE", "AFTER_CONTRACT_END", "CONTRACT_CHANGED", "DEDUCTION_MISSING"];
const muted = (text: string) => <span className="text-erp-muted">{text}</span>;

// 급여명세서 검토. 데모 docs/demo/staff/payrolls-detail.html(원본 src/pages/staff/payrolls-detail.mjs)의 틀 — 머리(목록 · 임시저장 ·
// 확정) + 경고 띠, 7:5 두 단(왼쪽 지급 내역, 오른쪽 검토 사유 · 참조한 것 · 처리 이력). 데이터는 GET /payslips/:id(getPayslip)이고
// 상태 · 사유 · 처리 구분 한글은 GET /enums 로 받는다. 없는 명세서 · 관리 범위 밖 · 가린 명세서 · 이상한 id 는 404 다.
export default async function PayslipDetailPage({ params, searchParams }: PageProps<"/payslips/[payslipId]">) {
  const [payslip, reasonLabels, logTypes, contractStatuses] = await Promise.all([
    getPayslip((await params).payslipId),
    getEnum("PayslipReviewReason"),
    getEnum("PayslipLogType"),
    getEnum("ContractStatus"),
  ]);
  if (!payslip) notFound();
  const listHref = payslipListHref(await searchParams, kstToday());
  const reasonOf = (value: string) => labelOf(reasonLabels, value);
  const present = new Set(payslip.reviewReasons.map((r) => r.reviewReason));
  const { contract } = payslip;

  const aside = (
    <>
      <section className="flex min-w-0 flex-col gap-[12px]">
        <SectionHead title="검토 사유">{payslip.reviewReasons.length > 0 && <Badge tone="off">{payslip.reviewReasons.length}건</Badge>}</SectionHead>
        <DataTable
          columns={[
            { header: "사유", width: "w-[140px]", cell: (r) => <Badge tone="off">{reasonOf(r.reviewReason)}</Badge> },
            { header: "내용", align: "left", cell: (r) => r.detail ?? "-" },
          ]}
          rows={payslip.reviewReasons}
          rowKey={(r) => r.payslipReviewReasonId}
          empty="검토 사유가 없습니다."
        />
        {present.size < REVIEW_REASONS.length && (
          <DetailTable
            title="그 밖의 사유"
            rows={REVIEW_REASONS.filter((r) => !present.has(r)).map((r) => ({ label: reasonOf(r), value: muted("해당 없음") }))}
          />
        )}
      </section>
      <section className="flex min-w-0 flex-col gap-[12px]">
        <SectionHead title="참조한 것">
          {/* 출퇴근 현황 화면이 아직 없다 */}
          <Button variant="soft" disabled title="준비 중입니다.">
            출퇴근 기록 보기
          </Button>
        </SectionHead>
        <DetailTable
          title="근로계약 · 출퇴근"
          rows={[
            {
              label: "근로계약",
              value: (
                <span>
                  <Link href={`/contracts/${contract.contractId}`} className="text-erp-link hover:underline">
                    근로계약 #{contract.contractId}
                  </Link>{" "}
                  · {contract.status ? labelOf(contractStatuses, contract.status) : "-"}
                </span>
              ),
            },
            // 월급 · 시급은 근로계약에 칸이 없어 고용형태로 단위를 붙인다(정직원 월급 · 파트타이머 시급)
            {
              label: "계약 급여",
              value: contract.wageAmount === null ? "-" : `${formatAmount(contract.wageAmount)} 원 / ${payslip.employmentType === "FULL_TIME" ? "월" : "시간"}`,
            },
            { label: "출퇴근 기간", value: `${payslip.attendanceStartDate} ~ ${payslip.attendanceEndDate.slice(5)}` },
            // 집계 근로시간 · 근무스케줄 기준 시간은 api 에 칸이 없어 두지 않는다
          ]}
        />
      </section>
      <section className="flex min-w-0 flex-col gap-[12px]">
        <SectionHead title="처리 이력" />
        <DataTable
          columns={[
            { header: "일시", width: "w-[110px]", cell: (l) => formatDateTime(l.changedAt).slice(5) },
            { header: "구분", width: "w-[90px]", cell: (l) => labelOf(logTypes, l.logType) },
            { header: "내용", align: "left", cell: (l) => (l.changedByName ? `${l.summary} · ${l.changedByName}` : l.summary) },
          ]}
          rows={payslip.logs}
          rowKey={(l) => l.payslipLogId}
        />
      </section>
    </>
  );

  return (
    <>
      <PageBar title="급여명세서 검토" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <PayslipReview
            payslip={payslip}
            band={reviewBand(payslip.reviewReasons, reasonOf)}
            listHref={listHref}
            aside={aside}
          />
        </div>
      </div>
    </>
  );
}
