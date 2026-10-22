"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Button, DateField, Pagination, Select, SlidePanel, Tag } from "@/components/common";
import { useScope, useStores } from "@/components/site/session-gate";
import { formatDateTime } from "@/lib/format";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";
import { openStores } from "@/lib/store-scope";
import type { WorkScheduleHistoryList } from "@/lib/work-schedules-api";
import { mondayOf, moved, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";
import { CHANGE_LABEL, historyLine } from "./work-schedule-view";

function useScheduleNavigation(today: string) {
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
  return (
    <div className="w-[220px] shrink-0">
      <Select aria-label="근무지" value={query.storeId} onChange={(e) => navigate({ ...query, storeId: Number(e.target.value), history: false })}>
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

const TAG_DANGER = "inline-block rounded-[2px] bg-erp-off-bg px-[4px] py-px text-[14px] font-medium whitespace-nowrap text-erp-off";

// 변경 이력(#608). 도구 줄의 「변경 이력」으로 연다 — 열림 · 필터 · 쪽은 주소에 둔다(목록 화면과 같은 규칙). 데이터는 서버가 읽어 넘긴다.
// 줄은 목업 「09-01 14:22 · 수정 · 서지안 09-04 13:00-21:30 → 09:00-17:00 · 정하윤」. 삭제는 빨강 꼬리표에 글자로도 「삭제」다.
export function ScheduleHistory({
  query,
  today,
  data,
  staffOptions,
}: {
  query: ScheduleQuery;
  today: string;
  data: WorkScheduleHistoryList | null;
  staffOptions: { staffMemberId: number; name: string }[];
}) {
  const navigate = useScheduleNavigation(today);
  const trigger = useRef<HTMLButtonElement>(null);
  const go = (next: Partial<ScheduleQuery>) => navigate({ ...query, historyPage: 1, ...next });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / query.historyPageSize)) : 1;
  // 「10-22 10:11」(한국 시간)
  const time = (iso: string) => formatDateTime(iso).slice(5);

  return (
    <>
      <Button ref={trigger} variant="off" aria-controls="schedule-history" aria-expanded={query.history} onClick={() => navigate({ ...query, history: true })}>
        변경 이력
      </Button>
      <SlidePanel id="schedule-history" open={query.history} onClose={() => navigate({ ...query, history: false })} label="변경 이력" trigger={trigger} closeOnBackdrop>
        <div className="flex flex-col gap-[12px] p-[24px]">
          <h2 className="text-[18px] font-semibold">변경 이력</h2>
          <div className="flex flex-col gap-[6px]">
            <div className="grid grid-cols-2 gap-[6px]">
              <DateField aria-label="변경일 시작" value={query.historyFrom} onChange={(v) => go({ historyFrom: v })} />
              <DateField aria-label="변경일 끝" value={query.historyTo} onChange={(v) => go({ historyTo: v })} />
            </div>
            <Select aria-label="직원" value={query.historyStaffId ?? ""} onChange={(e) => go({ historyStaffId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">전체 직원</option>
              {staffOptions.map((s) => (
                <option key={s.staffMemberId} value={s.staffMemberId}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-erp-label">{data?.total ?? 0}건</span>
            <div className="w-[80px]">
              <Select aria-label="페이지당 건수" value={String(query.historyPageSize)} onChange={(e) => go({ historyPageSize: Number(e.target.value) as PageSize })}>
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <ul className="flex flex-col">
            {data?.items.length === 0 && <li className="py-[14px] text-[14px] text-erp-label">변경 이력이 없습니다.</li>}
            {data?.items.map((h) => (
              <li key={h.workScheduleHistoryId} className="flex items-start gap-[8px] border-b border-erp-thead-line py-[10px] text-[14px]">
                <span className="w-[86px] shrink-0 text-[13px] text-erp-muted">{time(h.changedAt)}</span>
                {h.changeType === "DELETED" ? <span className={TAG_DANGER}>{CHANGE_LABEL.DELETED}</span> : <Tag>{CHANGE_LABEL[h.changeType]}</Tag>}
                <span className="min-w-0 flex-1">{historyLine(h)}</span>
              </li>
            ))}
          </ul>
          {data && data.total > query.historyPageSize && (
            <Pagination page={query.historyPage} totalPages={totalPages} onPageChange={(page) => navigate({ ...query, historyPage: page })} />
          )}
        </div>
      </SlidePanel>
    </>
  );
}
