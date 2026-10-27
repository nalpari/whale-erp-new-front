import { ListToolbar, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { PAYSLIP_STATUSES } from "@/lib/payslips";
import { getPayslips } from "@/lib/payslips-api";
import { kstToday } from "@/lib/staff-members";
import { PayslipFilter } from "./payslip-filter";
import { PayslipListActions } from "./payslip-list-actions";
import { PayslipMonthNav, PayslipPageSize, PayslipPagination } from "./payslip-list-controls";
import { parsePayslipListQuery, toPayslipListSearch } from "./payslip-list-query";
import { PayslipTable } from "./payslip-table";

// 급여명세서 관리 목록. 데모 docs/demo/staff/payslips.html(원본 src/pages/staff/payslips.mjs · staff-sections.mjs)을 공통 컴포넌트로 옮겼다.
// 칸 · 필터는 Plane WHALEERP-233 을 따라 데모와 일부러 다르다 — 왼쪽 필터는 점포 · 직원명 · 명세서 상태(점포는 업무 범위 안에서 좁히고, 범위는 공통 틀 위 업무 범위
// 선택기), 칸은 급여 기간 · 직원명 · 근무지 · 계약 유형 · 출퇴근 확인 여부 · 상태 · 발송일. 달 이동 · 상태 건수 · 명세서 목록.
// 검토 대기는 상태가 아니라 분류다 — 따로 목록을 두지 않고 상태 칸의 「검토 대기」 배지 · 「분류 · 검토 대기만」 필터 · 건수 줄의 검토 대기
// 수로 보이고, 사유 내용은 상세에서 본다(WHALEERP-234, 운영 정책 PAY-01 · 06 2026-10-26 재영). 데이터는 GET /payslips(getPayslips)이고
// 상태 · 계약 유형 · 검토 사유 한글은 GET /enums 로 받는다. 화면 상태는 URL 에만 둔다. api 오류는 error.tsx 가 받는다.
export default async function PayslipsPage({ searchParams }: PageProps<"/payslips">) {
  const today = kstToday();
  const query = parsePayslipListQuery(await searchParams, today);
  const [{ items, total, statusCounts, reviewPendingCount }, statusLabels, employmentTypeLabels, reviewReasonLabels] = await Promise.all([
    getPayslips(query),
    getEnum("PayslipStatus"),
    getEnum("EmploymentType"),
    getEnum("PayslipReviewReason"),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const counts = statusLabels.map((s) => ({ label: s.label, count: statusCounts[s.value as keyof typeof statusCounts] ?? 0 }));

  return (
    <>
      <PageBar title="급여명세서 관리" />
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <PayslipFilter query={query} today={today} statusLabels={statusLabels} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <PayslipMonthNav key={query.month} query={query} />
          <p className="text-[14px] text-erp-label">
            {counts.map((c, i) => (
              <span key={c.label}>
                {i > 0 && " · "}
                {c.label} <b className="font-semibold text-erp-ink">{c.count}</b>
              </span>
            ))}
            {" · "}검토 대기 <b className="font-semibold text-erp-ink">{reviewPendingCount}</b>
          </p>
          {/* 검토 대기 건수는 본사 제공 동의 없는 직원 명세서도 세고, 「검토 대기만」 목록은 그 명세서를 뺀다(ATT-30) — 숫자가 다른 까닭을 알린다 */}
          {query.reviewPending && reviewPendingCount > total && (
            <p className="text-[13px] text-erp-label">본사 제공 동의 없는 직원의 명세서는 「검토 대기만」 목록에서 빠집니다.</p>
          )}
          <ListToolbar total={total}>
            <PayslipListActions query={query} confirmedCount={statusCounts.CONFIRMED} employmentTypeLabels={employmentTypeLabels} />
            <PayslipPageSize query={query} />
          </ListToolbar>
          <PayslipTable
            items={items}
            total={total}
            page={query.page}
            pageSize={query.pageSize}
            listSearch={toPayslipListSearch(query)}
            statusLabels={statusLabels}
            employmentTypeLabels={employmentTypeLabels}
            reviewReasonLabels={reviewReasonLabels}
            // 거른 목록이 비면 그달 명세서가 없는 것이 아니다
            filtered={query.reviewPending || !!query.staffName || query.statuses.length !== PAYSLIP_STATUSES.length}
          />
          {total > 0 && (
            <div className="pt-[14px]">
              <PayslipPagination query={query} totalPages={totalPages} />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
