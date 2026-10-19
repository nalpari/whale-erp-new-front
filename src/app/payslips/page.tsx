import { ListToolbar, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
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
// 검토 대기 목록은 두지 않는다 — 사유는 상세에서만 보인다(STAFF-32, 2026-10-12 재영). 데이터는 GET /payslips(getPayslips)이고
// 상태 · 계약 유형 한글은 GET /enums 로 받는다. 화면 상태는 URL 에만 둔다. api 오류는 error.tsx 가 받는다.
export default async function PayslipsPage({ searchParams }: PageProps<"/payslips">) {
  const today = kstToday();
  const query = parsePayslipListQuery(await searchParams, today);
  const [{ items, total, statusCounts }, statusLabels, employmentTypeLabels] = await Promise.all([
    getPayslips(query),
    getEnum("PayslipStatus"),
    getEnum("EmploymentType"),
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
          </p>
          <ListToolbar total={total}>
            <PayslipListActions month={query.month} confirmedCount={statusCounts.CONFIRMED} employmentTypeLabels={employmentTypeLabels} />
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
