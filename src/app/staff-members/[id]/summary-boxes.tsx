import type { ReactNode } from "react";
import { Badge, DataTable } from "@/components/common";
import { labelOf } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { formatAmount } from "@/lib/payslips";
import { kstToday } from "@/lib/staff-members";
import { MENU_CODE } from "@/lib/menus";
import { getStaffMemberPayslipSummary, getStaffMemberTodoSummary, getStaffMemberWeekSchedule } from "@/lib/staff-members-api";
import { getStaffMemberTodos } from "@/lib/todos-api";
import { STATUS_STYLE } from "../../payslips/payslip-row";
import { endLabel } from "../../work-schedules/work-schedule-view";
import { CellView } from "../staff-table";
import { AreaFailure, BoxMessage } from "./detail-box";
import { RetryButton } from "./retry-button";
import { MenuTextLink } from "./manage-link";
import { loadArea, loadLabels } from "./summary-load";
import { TodoTitleLink } from "./todo-links";
import {
  hoursText,
  isAreaForbidden,
  isPayslipSummaryEmpty,
  payslipRows,
  todoFootText,
  todoHistoryText,
  payPeriodText,
  todoAssignText,
  todoStatusMark,
  workDateText,
  type TodoItem,
  type WeekScheduleItem,
} from "./summary-view";

// 직원 상세 오른쪽 영역(WHALEERP-184, api #183 GET /staff-members/:id/summary/…). 영역마다 Suspense 안의 서버 컴포넌트라
// 기본 정보 · 다른 영역은 먼저 그려지고, 한 영역을 못 받으면 그 영역에만 안내를 그리고 throw 하지 않는다.

/** 표 아래 요약 한 줄 — 데모 detail.mjs 의 foot(오른쪽 끝에 이름 + 값, 모서리를 둥글리지 않는다) */
function Foot({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-[46px] items-center justify-end gap-[12px] border-x border-b border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px]">
      <span className="text-erp-thead-text">{label}</span>
      <b className="font-semibold text-erp-ink">{children}</b>
    </div>
  );
}

/** 요약 줄 자리의 안내 — 목록은 그대로 두고 이 줄만 못 받았을 때 */
function FootMessage({ children, alert = false }: { children: ReactNode; alert?: boolean }) {
  return (
    <div
      role={alert ? "alert" : undefined}
      className="flex min-h-[46px] items-center justify-end gap-[12px] border-x border-b border-erp-thead-line bg-erp-thead-bg px-[12px] py-[6px] text-[14px] text-erp-muted"
    >
      {children}
    </div>
  );
}

/**
 * 「근무스케줄」 영역 — 한 주(월~일)의 근무스케줄 표(api 순서 = 시작 일시 순) + 주간 근무시간 합계(데모 detail.mjs). 주 넘김은 영역 머리(week-nav.tsx)가
 * 주소의 week 로 한다. 빈 주에도 합계 0.0h 를 보인다(2026-10-22 노영주).
 */
export async function ScheduleBox({ staffMemberId, weekStart }: { staffMemberId: number; weekStart: string }) {
  const result = await loadArea("근무스케줄 영역", () => getStaffMemberWeekSchedule(staffMemberId, weekStart));
  if (result.kind !== "ok") return <AreaFailure kind={result.kind} subject="근무스케줄을" />;
  const { items, totalWorkMinutes } = result.data;
  return (
    <>
      <DataTable<WeekScheduleItem>
        headVariant="plain"
        columns={[
          { header: "날짜", cell: (r) => workDateText(r.workDate) },
          { header: "근무지", cell: (r) => <span className="block truncate">{r.storeName}</span> },
          { header: "시작", cell: (r) => r.startTime },
          // 근무스케줄 화면과 같은 글자 — 다음 날이면 「익일 02:00」, 다음 날 0시면 「24:00」
          { header: "종료", cell: (r) => endLabel(r.startTime, r.endTime) },
        ]}
        rows={items}
        rowKey={(r) => r.workScheduleId}
        empty="이 주에 잡힌 근무스케줄이 없습니다."
      />
      <Foot label="주간 근무시간 합계">{hoursText(totalWorkMinutes)}</Foot>
    </>
  );
}

type PayslipRow = ReturnType<typeof payslipRows>[number];

/** 「급여명세서」 영역 — 이번 달 · 최근 확정 명세서 줄 + 미발송 건수. 둘 다 없고 미발송도 없으면 빈 상태 */
export async function PayslipBox({ staffMemberId }: { staffMemberId: number }) {
  const [result, statuses] = await Promise.all([
    loadArea("급여명세서 영역", () => getStaffMemberPayslipSummary(staffMemberId)),
    loadLabels("PayslipStatus"),
  ]);
  if (result.kind !== "ok") return <AreaFailure kind={result.kind} subject="급여명세서를" />;
  const summary = result.data;
  if (isPayslipSummaryEmpty(summary)) return <BoxMessage>급여명세서가 없습니다.</BoxMessage>;
  return (
    <>
      <DataTable<PayslipRow>
        headVariant="plain"
        columns={[
          { header: "구분", width: "w-[130px]", cell: (r) => r.label },
          // 데모의 지급월 링크 — 명세서 상세로. 급여명세서 관리 조회 권한이 없으면 글자만
          {
            header: "급여 기간",
            cell: (r) => (
              <MenuTextLink menuCode={MENU_CODE.payslips} href={`/payslips/${r.payslip.payslipId}`}>
                {payPeriodText(r.payslip)}
              </MenuTextLink>
            ),
          },
          { header: "지급", width: "w-[110px]", cell: (r) => formatAmount(r.payslip.grossPayAmount) },
          { header: "공제", width: "w-[100px]", cell: (r) => formatAmount(r.payslip.totalDeductionAmount) },
          { header: "실지급액", width: "w-[110px]", cell: (r) => <b className="font-semibold">{formatAmount(r.payslip.netPayAmount)}</b> },
          {
            header: "상태",
            width: "w-[90px]",
            cell: (r) => (statuses ? <CellView cell={{ text: labelOf(statuses, r.payslip.status), style: STATUS_STYLE[r.payslip.status] }} /> : "-"),
          },
        ]}
        rows={payslipRows(summary)}
        rowKey={(r) => r.payslip.payslipId}
        empty="이번 달 · 확정한 명세서가 없습니다."
      />
      <Foot label="미발송">{summary.unsentCount}건</Foot>
    </>
  );
}

/** 직원 상세 TO-DO 영역에 보일 건수. api 순서(미완료 긴급 → 미완료 → 완료)의 앞쪽이다 */
const STAFF_TODO_COUNT = 5;

type TodoSummary = Awaited<ReturnType<typeof getStaffMemberTodoSummary>>;

/**
 * 「TO-DO」 영역 — 목록(GET /staff-members/:id/todos, #118) 앞쪽 5건 + 요약 줄(전체 · 완료 · 미완료) + 최근 처리 이력 5건.
 * 다른 영역과 같이 그 영역 메뉴(TO-DO 관리) 조회 권한으로 막는다(2026-10-22 노영주, front #90 리뷰). api 가 목록 · 요약 두 경로에 같은 영역
 * 권한을 걸어(api #113) 권한이 없으면 둘 다 403 「조회 권한이 없습니다.」다 — 한쪽이라도 그러면 영역 전체에 권한 안내만 보인다(isAreaForbidden).
 * 그 밖에는 목록과 요약이 따로 실패한다(각자 그 자리에 다시 하기).
 */
export async function TodoBox({ staffMemberId }: { staffMemberId: number }) {
  const [summary, list, statuses, actors, assigneeTypes, executionModes] = await Promise.all([
    loadArea("TO-DO 영역 요약", () => getStaffMemberTodoSummary(staffMemberId)),
    loadArea("TO-DO 목록", () => getStaffMemberTodos(staffMemberId, STAFF_TODO_COUNT)),
    loadLabels("TodoStatus"),
    loadLabels("StatusChangeActor"),
    loadLabels("TodoAssigneeType"),
    loadLabels("TodoExecutionMode"),
  ]);
  if (isAreaForbidden(summary, list)) return <AreaFailure kind="forbidden" subject="TO-DO 를" />;
  const labeler = (labels: Awaited<ReturnType<typeof loadLabels>>) => (labels ? (value: string) => labelOf(labels, value) : null);
  const statusLabel = labeler(statuses);
  return (
    <>
      {list.kind === "ok" ? (
        <TodoList items={list.data.items} statusLabel={statusLabel} assigneeLabel={labeler(assigneeTypes)} modeLabel={labeler(executionModes)} />
      ) : (
        <AreaFailure kind={list.kind} subject="TO-DO 를" />
      )}
      {summary.kind === "ok" ? (
        <TodoSummaryFoot summary={summary.data} statusLabel={statusLabel} actorLabel={labeler(actors)} />
      ) : (
        <FootMessage alert>
          TO-DO 건수를 불러오지 못했습니다.
          <RetryButton />
        </FootMessage>
      )}
    </>
  );
}

type Labeler = ((value: string) => string) | null;

/**
 * TO-DO 목록 — 데모 detail.mjs 처럼 열 이름 줄 없는 표: 제목(+ 긴급) · 배정(220px) · 상태(110px, 색 글자). 한글을 받지 못한 조각은 빠지거나
 * 「-」다(영문 값을 보이지 않는다).
 */
function TodoList({ items, statusLabel, assigneeLabel, modeLabel }: { items: TodoItem[]; statusLabel: Labeler; assigneeLabel: Labeler; modeLabel: Labeler }) {
  if (items.length === 0) return <BoxMessage>배정된 TO-DO 가 없습니다.</BoxMessage>;
  const today = kstToday();
  return (
    <DataTable<TodoItem>
      headVariant="none"
      columns={[
        {
          header: "제목",
          align: "left",
          cell: (t) => (
            <span className="flex min-w-0 items-center gap-[10px]">
              <TodoTitleLink todoId={t.todoId} title={t.title} />
              {t.isUrgent && <Badge tone="off">긴급</Badge>}
            </span>
          ),
        },
        { header: "배정", width: "w-[220px]", cell: (t) => <span className="block truncate">{todoAssignText(t, assigneeLabel, modeLabel, today)}</span> },
        {
          header: "상태",
          width: "w-[110px]",
          cell: (t) => {
            const mark = todoStatusMark(t, statusLabel, today);
            return mark ? <CellView cell={mark} /> : "-";
          },
        },
      ]}
      rows={items}
      rowKey={(t) => t.todoId}
    />
  );
}

/**
 * TO-DO 요약 줄과 최근 처리 이력. 배정이 없으면 목록의 빈 상태가 말하므로 요약 줄을 그리지 않는다. 이력은 api 순서(최신이 위) 그대로이고
 * 바꾼 사람 이름은 오지 않아 바꾼 쪽(관리자 · 직원 · 시스템)만 보인다.
 */
function TodoSummaryFoot({
  summary,
  statusLabel,
  actorLabel,
}: {
  summary: TodoSummary;
  statusLabel: ((status: string) => string) | null;
  actorLabel: ((actor: string) => string) | null;
}) {
  const foot = todoFootText(summary);
  const histories = summary.recentHistories;
  return (
    <>
      {foot && <Foot label={foot.label}>{foot.value}</Foot>}
      {histories.length > 0 && (
        <section aria-label="최근 처리 이력" className="mt-[12px]">
          <h4 className="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[12px] text-[14px] font-medium text-erp-thead-text">
            최근 처리 이력
          </h4>
          <ul className="rounded-b-[2px] border-x border-b border-erp-thead-line bg-white text-[14px]">
            {histories.map((h) => (
              <li key={h.todoStatusHistoryId} className="flex h-[46px] items-center gap-[10px] border-b border-erp-thead-line px-[12px] last:border-b-0">
                <span className="w-[100px] shrink-0 text-erp-label">{formatDateTime(h.changedAt).slice(5)}</span>
                <span className="min-w-0 flex-1 truncate text-erp-ink">{h.title}</span>
                <span className="w-[140px] shrink-0 text-center text-erp-ink">{todoHistoryText(h, statusLabel)}</span>
                <span className="w-[60px] shrink-0 text-center text-erp-label">{actorLabel ? actorLabel(h.actor) : "-"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
