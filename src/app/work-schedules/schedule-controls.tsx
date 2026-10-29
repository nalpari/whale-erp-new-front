"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { DataTable, DateField, Pagination, Select, type Column } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { formatDateTime } from "@/lib/format";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";
import { openStores } from "@/lib/store-scope";
import type { WorkScheduleHistoryList } from "@/lib/work-schedules-api";
import { mondayOf, moved, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";
import { CHANGE_LABEL, historyLine } from "./work-schedule-view";

export function useScheduleNavigation(today: string) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (next: ScheduleQuery) => startTransition(() => router.replace(`/work-schedules${toScheduleSearch(next, today)}`, { scroll: false }));
}

// 근무지. 로그인 정보의 관리 점포(useStores)에서 고른다 — 점포 목록 api 는 「점포 정보 관리」 권한이 있어야 열린다.
// 근무스케줄은 점포 하나씩 본다. 주소에 점포가 없으면 헤더 범위의 점포(점포 하나일 때) · 폐점이 아닌 첫 점포로 옮긴다.
export function SchedulePicker({ query, today }: { query: ScheduleQuery; today: string }) {
  const stores = useStores();
  const [scope] = useScope();
  const navigate = useScheduleNavigation(today);
  const fallback = scope.type === "STORE" ? scope.storeId : (openStores(stores)[0] ?? stores[0])?.storeId;
  useEffect(() => {
    if (query.storeId === null && fallback !== undefined) navigate({ ...query, storeId: fallback });
    // 처음 한 번 — 주소에 점포가 없을 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.storeId, fallback]);
  if (query.storeId === null)
    return <p className="text-[14px] text-erp-label">{stores.length ? "점포를 고르는 중입니다…" : "관리하는 점포가 없습니다."}</p>;
  // 점포를 바꾸면 복사 미리보기를 닫고, 앞 점포 직원으로 건 변경 이력 조건 · 쪽을 푼다
  return (
    <div className="w-[220px] shrink-0">
      <Select aria-label="근무지" value={query.storeId} onChange={(e) => navigate({ ...query, storeId: Number(e.target.value), copy: false, historyStaffId: null, historyPage: 1 })}>
        {stores.map((s) => (
          <option key={s.storeId} value={s.storeId}>
            {s.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

// 주 이동의 날짜 고르기 — 고른 날이 든 주로 간다(#202)
export function WeekJump({ query, today }: { query: ScheduleQuery; today: string }) {
  const navigate = useScheduleNavigation(today);
  return (
    <div className="w-[150px] shrink-0">
      <DateField aria-label="날짜로 주 고르기" value={query.day} onChange={(v) => v && navigate(moved(query, { week: mondayOf(v), day: v }))} />
    </div>
  );
}

// 변경 이력(#608). 데모 schedLog 처럼 근무표 아래에 늘 보이는 표다(2026-10-22 재영) — 조건 · 쪽은 주소에 둔다(목록 화면과 같은 규칙). 데이터는 서버가 읽어 넘긴다.
// 줄은 목업 「09-01 14:22 · 수정 · 서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤」. 삭제는 데모처럼 빨강 글자다.
export function ScheduleHistory({
  query,
  today,
  data,
  staffOptions,
}: {
  query: ScheduleQuery;
  today: string;
  /** "failed" 는 받지 못한 것 */
  data: WorkScheduleHistoryList | "failed";
  staffOptions: { staffMemberId: number; name: string }[];
}) {
  const navigate = useScheduleNavigation(today);
  const go = (next: Partial<ScheduleQuery>) => navigate({ ...query, historyPage: 1, ...next });
  const list = data === "failed" ? null : data;
  const totalPages = list ? Math.max(1, Math.ceil(list.total / query.historyPageSize)) : 1;
  // 「10-22 10:11」(한국 시간)
  const time = (iso: string) => formatDateTime(iso).slice(5);
  const columns: Column<WorkScheduleHistoryList["items"][number]>[] = [
    { header: "일시", width: "w-[120px]", cell: (h) => time(h.changedAt) },
    { header: "구분", width: "w-[80px]", cell: (h) => <span className={h.changeType === "DELETED" ? "text-erp-off" : undefined}>{CHANGE_LABEL[h.changeType]}</span> },
    { header: "내용", align: "left", cell: (h) => <span title={historyLine(h)}>{historyLine(h)}</span> },
  ];

  return (
    <section aria-labelledby="schedule-history" className="flex min-w-0 flex-col gap-[12px] pt-[12px]">
      <div className="flex items-end gap-[6px]">
        <h2 id="schedule-history" className="flex-1 text-[18px] font-semibold text-erp-ink">
          변경이력
        </h2>
        <div className="w-[150px] shrink-0">
          <DateField aria-label="변경일 시작" value={query.historyFrom} onChange={(v) => go({ historyFrom: v })} />
        </div>
        <div className="w-[150px] shrink-0">
          <DateField aria-label="변경일 끝" value={query.historyTo} onChange={(v) => go({ historyTo: v })} />
        </div>
        <div className="w-[160px] shrink-0">
          <Select aria-label="직원" value={query.historyStaffId ?? ""} onChange={(e) => go({ historyStaffId: e.target.value ? Number(e.target.value) : null })}>
            <option value="">전체 직원</option>
            {/* 주를 옮겨 고른 직원이 이 주 목록에 없어도 조건은 남아 있다 — 「전체 직원」으로 보이지 않게 둔다 */}
            {query.historyStaffId !== null && !staffOptions.some((s) => s.staffMemberId === query.historyStaffId) && <option value={query.historyStaffId}>고른 직원</option>}
            {staffOptions.map((s) => (
              <option key={s.staffMemberId} value={s.staffMemberId}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-[80px] shrink-0">
          <Select aria-label="페이지당 건수" value={String(query.historyPageSize)} onChange={(e) => go({ historyPageSize: Number(e.target.value) as PageSize })}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={list?.items ?? []}
        rowKey={(h) => h.workScheduleHistoryId}
        empty={
          list ? (
            "변경이력이 없습니다."
          ) : (
            // 이력을 받지 못해도 근무표는 그린다 — 이 표 안에만 알린다(front #93 리뷰)
            <span role="alert" className="text-erp-off">
              변경이력을 불러오지 못했습니다. 잠시 뒤 다시 열어 주세요.
            </span>
          )
        }
      />
      {list && list.total > query.historyPageSize && (
        <Pagination page={query.historyPage} totalPages={totalPages} onPageChange={(page) => navigate({ ...query, historyPage: page })} />
      )}
    </section>
  );
}
