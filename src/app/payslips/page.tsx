import { ListToolbar, PageBar, Tag } from "@/components/common";
import { getEnum, screenPath } from "@/lib/api";
import { PAYSLIP_STATUSES } from "@/lib/payslips";
import { getPayslips } from "@/lib/payslips-api";
import { kstToday } from "@/lib/staff-members";
import { PayslipFilter } from "./payslip-filter";
import { PayslipCreateAction, PayslipListActions } from "./payslip-list-actions";
import { PayslipMonthNav, PayslipPageSize, PayslipPagination } from "./payslip-list-controls";
import { parsePayslipListQuery, toPayslipListSearch } from "./payslip-list-query";
import { PayslipTable } from "./payslip-table";

// 급여명세서 관리 목록. 데모 docs/demo/staff/payslips.html(원본 src/pages/staff/payslips.mjs · staff-sections.mjs)을 공통 컴포넌트로 옮겼다.
// 칸 · 필터는 Plane WHALEERP-233 을 따라 데모와 일부러 다르다 — 왼쪽 필터는 점포 · 직원명 · 명세서 상태(점포는 업무 범위 안에서 좁히고, 범위는 공통 틀 위 업무 범위
// 선택기), 칸은 급여 기간 · 직원명 · 근무지 · 계약 유형 · 출퇴근 확인 여부 · 상태 · 발송일. 달 이동 · 상태 건수 · 명세서 목록.
// 검토 대기는 상태가 아니라 분류다 — 따로 목록을 두지 않고 상태 칸의 「검토 대기」 꼬리표 · 「분류 · 검토 대기만」 필터 · 건수 줄의 검토 대기
// 꼬리표로 보이고, 사유 내용은 상세에서 본다(WHALEERP-234, 운영 정책 PAY-01 · 06 2026-10-26 재영). 데이터는 GET /payslips(getPayslips)이고
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
  // 화면 주소는 탭 BP 주소 /bp/{id}/payslips 다 — proxy 가 그 BP 를 X-Bp-Code-Id 로 실어, 플랫폼 계정은 고른 BP 의 명세서만 본다(BP_PATH_SCREENS, WHALEERP-637).
  // 쿼리는 옛 경로로 두고, 링크로 그릴 때만 탭 BP 를 붙인다
  const at = await screenPath();
  const counts = statusLabels.map((s) => ({ label: s.label, count: statusCounts[s.value as keyof typeof statusCounts] ?? 0 }));

  return (
    <>
      <PageBar title="급여명세서 관리">
        <PayslipCreateAction month={query.month} employmentTypeLabels={employmentTypeLabels} />
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <PayslipFilter query={query} today={today} statusLabels={statusLabels} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <PayslipMonthNav key={query.month} query={query} />
          <p className="flex flex-wrap items-center gap-[10px] text-[14px] text-erp-label">
            <span>
              {counts.map((c, i) => (
                <span key={c.label}>
                  {i > 0 && " · "}
                  {c.label} <b className="font-semibold text-erp-ink">{c.count}</b>
                </span>
              ))}
            </span>
            {/* 검토 대기는 작성 중 · 검토 중 모두에 생기는 분류라 상태 넷과 떼어 꼬리표로 보인다 — 다섯째 상태로 읽혀 합계가 맞지 않아
                보이지 않게(운영 정책 v221 PAY-06) */}
            <span aria-hidden="true" className="h-[11px] w-px bg-[#d9d9d9]" />
            <Tag>검토 대기 {reviewPendingCount}</Tag>
          </p>
          <ListToolbar total={total}>
            <PayslipListActions query={query} confirmedCount={statusCounts.CONFIRMED} />
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
            at={at}
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
