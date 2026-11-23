import { ClampText } from "./clamp-text";
import { formatAmount } from "@/lib/payslips";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, PageBar, RoundBox, RoundEmpty, RoundLink, RoundRows } from "@/components/common";
import { getEnum, screenPath } from "@/lib/api";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { getPayslip } from "@/lib/payslips-api";
import { kstToday } from "@/lib/staff-members";
import { payslipListHref } from "../payslip-list-query";
import { attendanceHref, deductionAnchor, detailReviewReasons, reviewBand, reviewDetailText } from "../payslip-row";
import { PayslipReview } from "./payslip-review";

export const metadata: Metadata = {
  title: "급여명세서 관리 · Whale ERP",
};

// 급여명세서 검토. 데모 docs/demo/staff/payrolls-detail.html(원본 src/pages/staff/payrolls-detail.mjs)의 틀 — 머리(임시저장 ·
// 확정 · 발송 · 목록) + 경고 띠, 7:5 두 단(왼쪽 지급 내역, 오른쪽 검토 대상 항목 · 급여 산정 기준 · 처리 이력 · 발송 이력). 데이터는 GET /payslips/:id(getPayslip)이고
// 상태 · 사유 · 처리 구분 한글은 GET /enums 로 받는다. 없는 명세서 · 관리 범위 밖 · 가린 명세서 · 이상한 id 는 404 다.
export default async function PayslipDetailPage({ params, searchParams }: PageProps<"/payslips/[payslipId]">) {
  const [payslip, reasonLabels, logTypes, contractStatuses, channels, results, payslipStatuses, employmentTypes] = await Promise.all([
    getPayslip((await params).payslipId),
    getEnum("PayslipReviewReason"),
    getEnum("PayslipLogType"),
    getEnum("ContractStatus"),
    getEnum("PayslipDispatchChannel"),
    getEnum("DispatchResult"),
    getEnum("PayslipStatus"),
    getEnum("EmploymentType"),
  ]);
  if (!payslip) notFound();
  // 링크는 옛 경로에 탭 BP 를 붙여 그린다(WHALEERP-637). 근로계약도 탭 BP 주소 화면이다
  const at = await screenPath();
  const today = kstToday();
  const listHref = at(payslipListHref(await searchParams, today));
  const reasonOf = (value: string) => labelOf(reasonLabels, value);
  // 공제 미입력은 사유 줄로 저장되지 않아 저장된 공제 칸으로 판정해 더한다 — 목록의 검토 대기 사유와 같다(v221 PAY-06).
  const reviewReasons = detailReviewReasons(payslip);
  const { contract } = payslip;

  // 오른쪽 상자는 모두 둥근 확인 상자(RoundBox — 8px · #c9d1de, 제목 15px 600) — 근로계약 상세와 같은 모양. 건수는 제목 줄 오른쪽 끝, 이동은 줄 오른쪽 끝
  // 점선 알약 링크(RoundLink). 왼쪽 입력 칸(회색 제목 줄 상자)과 모양으로 가른다(2026-11-19 사용자 지정, DESIGN.md 「상세 화면 틀」)
  const sameAttendance = payslip.attendanceStartDate === payslip.periodStartDate && payslip.attendanceEndDate === payslip.periodEndDate;
  const aside = (
    <>
      <section className="min-w-0">
        {/* 「검토 사유」 — 표 대신 둥근 테두리(8px) 큰 상자에 사유마다 한 덩어리: 사유 이름(600) · 오른쪽 할 일 링크, 아래 내용(회색).
            왜 검토가 필요한지만 보이면 되는데 열 이름 줄 · 칸이 무거웠다(2026-11-19 사용자 지정). 위 띠는 건수 한 줄, 내용은 여기에만 */}
        <RoundBox title="검토 사유" action={reviewReasons.length > 0 && <span className="text-[14px] font-semibold text-erp-off">{reviewReasons.length}건</span>}>
          {reviewReasons.length === 0 ? (
            <RoundEmpty>검토 사유가 없습니다.</RoundEmpty>
          ) : (
            <ul className="flex flex-col">
              {reviewReasons.map((r) => (
                <li key={r.payslipReviewReasonId} className="flex flex-col gap-[4px] border-t border-erp-divider py-[12px] last:pb-0">
                  <span className="flex items-center gap-[8px]">
                    <span className="flex-1 text-[14px] font-semibold text-erp-ink">{reasonOf(r.reviewReason)}</span>
                    {r.reviewReason === "DEDUCTION_MISSING" ? (
                      <RoundLink href={deductionAnchor(payslip)}>공제 칸으로 이동</RoundLink>
                    ) : r.reviewReason === "CONTRACT_CHANGED" ? (
                      <RoundLink href={at(`/contracts/${contract.contractId}`)}>근로계약 보기</RoundLink>
                    ) : (
                      <RoundLink href={at(attendanceHref(payslip))}>출퇴근 기록 보기</RoundLink>
                    )}
                  </span>
                  {r.detail && <span className="text-[14px] leading-[1.6] whitespace-pre-line text-erp-label">{reviewDetailText(r.detail, payslip.attendanceStartDate || payslip.periodStartDate)}</span>}
                </li>
              ))}
            </ul>
          )}
        </RoundBox>
      </section>
      {/* 「급여 산정 기준」도 「검토 사유」와 같은 둥근 테두리(8px) 큰 상자 — 제목 줄 오른쪽 끝에 [출퇴근 기록 보기], 아래 줄마다 「이름 | 값」을 옅은 선으로 나눈다
          (2026-11-19 사용자 지정, 전엔 회색 제목 줄 상세 표). 출퇴근 기간은 왼쪽 급여 기간과 같으면 두지 않는다 */}
      {/* [출퇴근 기록 보기]는 두지 않는다 — 「검토 사유」 줄마다 같은 링크가 있다(2026-11-19 사용자 지정) */}
      <RoundBox title="급여 산정 기준">
        <RoundRows
          rows={[
            // 순서: 산정기간(· 출퇴근기간) → 통상시급 → 근로계약, 이름은 띄우지 않는다 — 「급여기간」은 지급 기간으로 읽혀 노무 용어 「(임금) 산정기간」으로(2026-11-19 사용자 지정)
            // 급여 기간도 여기에 — 왼쪽 「지급」 제목 줄에도 있지만 산정 기준으로 함께 보인다(2026-11-19 사용자 지정)
            // 기간 뒤에 「출퇴근 기록 보기」 글자 링크 — 검토 사유에 출퇴근 사유가 없어도 출퇴근 기록으로 갈 길이 늘 있게(근로계약 줄의 「· 근로계약 보기」와 같은 모양, 2026-11-19 사용자 지정)
            {
              label: "산정기간",
              value: (
                // 버튼은 줄 오른쪽 끝 — 「검토 사유」의 할 일 버튼과 같은 자리(2026-11-19 사용자 지정)
                <span className="flex items-center gap-[8px]">
                  <span className="flex-1">
                    {payslip.periodStartDate} ~ {payslip.periodEndDate.slice(5)}
                  </span>
                  <RoundLink href={at(attendanceHref(payslip))}>출퇴근 기록 보기</RoundLink>
                </span>
              ),
            },
            ...(sameAttendance ? [] : [{ label: "출퇴근기간", value: `${payslip.attendanceStartDate} ~ ${payslip.attendanceEndDate.slice(5)}` }]),
            // 근로계약 급여액은 고용형태와 상관없이 시급이다(2026-10-12) — 정직원 기본급은 시급 × 월 기본시간. 이름은 세무사 사무실 급여명세서 용어
            // 「통상시급」(2026-11-19 사용자 지정 — 위 요약 띠에 올렸다가 다시 여기로)
            { label: "통상시급", value: contract.wageAmount === null ? "-" : `${formatAmount(contract.wageAmount)} 원` },
            {
              label: "근로계약",
              value: (
                // 「상태 · [근로계약 보기]」 — 내부 번호(「근로계약 #30」)는 고객이 다른 화면에서 찾을 수 없는 숫자라 뺐다(2026-11-06 사용자 지정)
                <span className="flex items-center gap-[8px]">
                  <span className="flex-1">{contract.status ? labelOf(contractStatuses, contract.status) : "-"}</span>
                  <RoundLink href={at(`/contracts/${contract.contractId}`)}>근로계약 보기</RoundLink>
                </span>
              ),
            },
            // 집계 근로시간 · 근무스케줄 기준 시간은 api 에 칸이 없어 두지 않는다
          ]}
        />
      </RoundBox>
      {/* 처리 이력 · 발송 이력도 같은 둥근 큰 상자 — 오른쪽은 확인할 것(검토 사유 · 산정 기준 · 이력), 왼쪽은 입력 칸(회색 제목 줄 상자)으로 모양을 가른다
          (2026-11-19 사용자 지정). 줄마다 위에 「구분 · 일시」, 아래 「내용 · 처리자」 — 표의 열 이름 줄 없이 읽힌다 */}
      {/* 제목은 무엇의 이력인지 드러나게 「급여명세서 수정 및 처리내역」(2026-11-19 사용자 지정, 전엔 「처리 이력」) */}
      <RoundBox title="급여명세서 수정 및 처리내역">
        {payslip.logs.length === 0 ? (
          <RoundEmpty>수정 · 처리 내역이 없습니다.</RoundEmpty>
        ) : (
          // 줄마다 왼쪽 수정내역, 오른쪽 「수정자 ┃ 처리일시」 — 누가 언제 무엇을 했는지 한 줄로 읽힌다. 열 이름 줄은 두지 않는다(2026-11-19 사용자 지정).
          // 구분(수정 · 확정 · 발송 · 초안 생성)은 굵은 글자 · 꼬리표로 따로 두지 않는다 — 요약 글자에 이미 들어 있다. 요약이 없으면 구분 이름을 글자로
          <div className="flex flex-col text-[14px]">
            <ul className="flex flex-col">
              {payslip.logs.map((l) => (
                <li key={l.payslipLogId} className="flex items-start gap-[12px] border-t border-erp-divider py-[12px] first:border-t-0 last:pb-0">
                  <ClampText text={l.summary?.trim() || labelOf(logTypes, l.logType)} />
                  <span className="flex shrink-0 items-center gap-[8px] leading-[1.6] text-erp-label">
                    <span className="max-w-[100px] truncate">{l.changedByName ?? "-"}</span>
                    {/* #d9d9d9 — DESIGN.md 값 구분선, Figma 전용 색이라 토큰이 없다 */}
                    <span aria-hidden className="h-[11px] w-px bg-[#d9d9d9]" />
                    <span className="tabular-nums">{formatDateTime(l.changedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </RoundBox>
      {/* 발송은 채널마다 한 줄 — 성공 · 실패를 따로 본다(WHALEERP-236). 처리 이력과 같이 최근 것이 위 */}
      <RoundBox title="발송 이력">
        {payslip.dispatches.length === 0 ? (
          <RoundEmpty>발송 이력이 없습니다.</RoundEmpty>
        ) : (
          <ul className="flex flex-col">
            {[...payslip.dispatches].reverse().map((d) => (
              <li key={d.payslipDispatchId} className="flex items-center gap-[8px] border-t border-erp-divider py-[12px] text-[14px] last:pb-0">
                <span className="font-semibold text-erp-ink">{labelOf(channels, d.channel)}</span>
                <Badge tone={d.status === "SUCCEEDED" ? "on" : "off"}>{labelOf(results, d.status)}</Badge>
                <span className="flex-1" />
                <span className="shrink-0 text-erp-label tabular-nums">{formatDateTime(d.sentAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </RoundBox>
    </>
  );

  return (
    <>
      <PageBar title="급여명세서 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <PayslipReview
            // 저장 · 확정 뒤 다시 받은 값으로 화면 상태(금액 칸 · 스위치)를 새로 세운다
            key={payslip.updatedAt}
            payslip={payslip}
            band={reviewBand(reviewReasons)}
            listHref={listHref}
            today={today}
            statusLabel={payslip.status ? labelOf(payslipStatuses, payslip.status) : "-"}
            employmentTypeLabel={labelOf(employmentTypes, payslip.employmentType)}
            aside={aside}
          />
        </div>
      </div>
    </>
  );
}
