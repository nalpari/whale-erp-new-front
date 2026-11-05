"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition, type ReactNode } from "react";
import { DataTable, DateField, Pagination, Select, type Column } from "@/components/common";
import { useAccount, useCurrentBp, useScope, useStores } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { isPlatformRole } from "@/lib/auth-routes";
import { formatDateTime } from "@/lib/format";
import { PAGE_SIZES, type PageSize } from "@/lib/staff-members";
import { isClosedStore, openStores } from "@/lib/store-scope";
import type { WorkScheduleHistoryList } from "@/lib/work-schedules-api";
import { mondayOf, moved, toScheduleSearch, type ScheduleQuery } from "./work-schedule-query";
import { CHANGE_LABEL, historyLine } from "./work-schedule-view";

export function useScheduleNavigation(today: string) {
  const router = useRouter();
  // 화면 주소는 탭 BP 주소다(/bp/{id}/work-schedules)
  const bp = useCurrentBp().bpCodeId;
  const [, startTransition] = useTransition();
  return (next: ScheduleQuery) => startTransition(() => router.replace(bpPath(bp, `/work-schedules${toScheduleSearch(next, today)}`), { scroll: false }));
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
  // 점포가 없거나 고르는 중이면 같은 자리에 「선택」 하나뿐인 근무지 칸을 둔다(막지 않는다) — 도구 줄 모양은 그대로, 안내는 본문 가운데(ScheduleNoStore)
  if (query.storeId === null)
    return (
      <Labeled>
        {/* 막지 않는다 — 막힌 칸은 생김새가 같아 눌러도 안 열리는 고장처럼 보였다. 열면 「선택」 하나뿐이다(2026-11-05 사용자 지적) */}
        <div className="w-[300px]">
          <Select aria-label="근무지" value="" onChange={() => undefined}>
            <option value="">선택</option>
          </Select>
        </div>
      </Labeled>
    );
  const picked = stores.find((s) => s.storeId === query.storeId);
  const closed = !!picked && isClosedStore(picked);
  // 점포를 바꾸면 복사 미리보기를 닫고, 앞 점포 직원으로 건 변경 이력 조건 · 쪽을 푼다
  return (
    <Labeled>
      {/* 폐점 점포를 고르면 근무지 칸 바로 아래에 빨간 안내 — 도구 줄 높이를 늘리지 않게 칸 아래로 띄운다(아래 요일 줄과는 24px 사이).
          등록 · 복사 버튼은 흐리게 막힌다(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <div className="relative w-[300px]">
        <Select aria-label="근무지" value={query.storeId} onChange={(e) => navigate({ ...query, storeId: Number(e.target.value), copy: false, historyStaffId: null, historyPage: 1 })}>
          {stores.map((s) => (
            <option key={s.storeId} value={s.storeId}>
              {s.name}
            </option>
          ))}
        </Select>
        {closed && <p className="absolute top-full left-0 mt-[4px] text-[13px] whitespace-nowrap text-erp-off">폐점 점포는 근무스케줄을 등록할 수 없습니다.</p>}
      </div>
    </Labeled>
  );
}

/** 근무지 칸 앞 회색 라벨 — 무엇을 고르는 칸인지 보이게(2026-11-05 사용자 지정, 3팀 확인 필요). 라벨은 폼 라벨과 같은 14px 500 회색 */
function Labeled({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center gap-[8px]">
      <span aria-hidden="true" className="text-[14px] font-medium text-erp-label">
        근무지
      </span>
      {/* 점포명이 길어 220 → 300px(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      {children}
    </div>
  );
}

/**
 * 점포가 없을 때 근무표 자리 가운데 안내 — 홈처럼 기본 틀은 두고 데이터 없음으로 보인다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 왼쪽 위 한 줄
 * 「관리하는 점포가 없습니다.」만 있고 아래가 비었다). 앞 문장은 점포 화면 · 점포 없음 띠와 같은 규칙(BP 마스터 · 플랫폼은 「등록된」, 그 밖은 「담당」),
 * 아랫줄은 무엇을 하면 쓸 수 있는지. 점포가 있는데 주소에 없으면 SchedulePicker 가 첫 점포로 옮기는 동안만 보인다.
 */
export function ScheduleNoStore() {
  const account = useAccount();
  const stores = useStores();
  const owner = account.roleTypeCode === "BM" || isPlatformRole(account.roleTypeCode);
  const [lead, next] = stores.length
    ? ["점포를 불러오는 중입니다.", null]
    : owner
      ? ["등록된 점포가 없습니다.", "점포를 등록하면 직원의 근무스케줄을 등록하고 관리할 수 있습니다."]
      : ["담당 점포가 없습니다.", "점포를 배정받으면 직원의 근무스케줄을 등록하고 관리할 수 있습니다."];
  return (
    <div className="flex min-h-[134px] flex-1 flex-col items-center justify-center gap-[6px] text-center text-[14px]">
      <p className="font-medium text-erp-ink">{lead}</p>
      {next && <p className="text-erp-muted">{next}</p>}
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
  // 「2026-10-22 10:11」(한국 시간) — 연도까지 보인다, 점포 · BP 변경이력과 같다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「10-22 10:11」)
  const time = (iso: string) => formatDateTime(iso);
  const columns: Column<WorkScheduleHistoryList["items"][number]>[] = [
    { header: "변경일시", width: "w-[180px]", cell: (h) => time(h.changedAt) },
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
