"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, DataTable, MonthPicker, PageBar, type Column, useBackdropActive, useToast } from "@/components/common";
import { useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpHolidaysHref, isEditOpen, shiftBpHolidayMonth, storesText, weekdayName, type BpHolidayQuery } from "@/lib/bp-holiday-view";
import type { BpHolidayDateRow, BpHolidayDetail, BpHolidayList } from "@/lib/bp-holidays";
import { bpPath } from "@/lib/bp-path";
import { formatDateTime } from "@/lib/format";
import { YEAR_OPTIONS } from "@/lib/public-holiday-view";
import { HolidayCalendar } from "./holiday-calendar";
import { DETAIL_PANEL_ID, EDIT_PANEL_ID, HolidayDetailPanel } from "./holiday-detail-panel";
import { HolidayFormPanel } from "./holiday-form-panel";
import { Muted, ScopeTag, useHolidayTypeText } from "./holiday-parts";
import { HolidayHistoryButton } from "./history-dialog";

const NEW_PANEL_ID = "bp-holiday-new-panel";
/** 이 화면이 상세 위에 쌓은 수정 기록에 다는 history.state 꼬리표 — 값은 그 상세의 휴일 id(플랫폼 관리자 관리와 같다) */
const EDIT_PUSHED_STATE = "bpHolidayEditPushedFor";

// 데모 tabs — 고른 탭은 브랜드 밑줄 · 굵게(플랫폼 휴일 관리와 같다)
const tab = (active: boolean) =>
  `-mb-px flex h-[42px] items-center border-b-2 px-[18px] text-[15px] transition-colors duration-150 ease-out ${
    active ? "border-erp-brand font-semibold text-erp-ink" : "border-transparent font-medium text-erp-label hover:text-erp-ink"
  }`;
const ICON_SHELL = "grid size-[34px] shrink-0 place-items-center rounded-[2px] border border-erp-button-line bg-white";
const ICON_BUTTON = `${ICON_SHELL} transition-[border-color] duration-150 ease-out hover:border-erp-brand`;

// 목록 화면과 세 슬라이드 패널(등록 · 상세 · 수정)을 한데 쥔다. 수정은 상세 위에 겹쳐 연다(데모와 같다).
// 상세를 열고 닫는 것은 주소(?holiday= · ?at=)로 한다 — 서버가 그 휴일을 불러 detail 로 넘긴다. 수정도 주소(?edit=1)로 열어
// 브라우저 뒤로 가기가 수정 → 상세 → 목록 순으로 하나씩 접힌다. 바탕창을 누르면 열린 패널을 모두 닫는다(플랫폼 관리자 관리와 같다 · 2026-10-26).
// 등록은 주소에 남기지 않는다.
// 다른 사람이 바꾼 내용은 달 이동 · 패널 닫기(주소 이동) 때 다시 받는다(S-YAFRYZ — 실시간 감지는 없다).
export function HolidaysScreen({
  query,
  today,
  list,
  detail,
}: {
  query: BpHolidayQuery;
  today: string;
  list: BpHolidayList;
  detail: { holiday: BpHolidayDetail } | { failed: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const bp = useCurrentBp().bpCodeId;
  // 등록 버튼만 메뉴 권한으로 가린다(조회만 권한에는 등록이 없다 · S-YAFRYZ). 상세의 버튼은 api 가 준 actions 로 가린다.
  const can = usePagePermission();
  const typeText = useHolidayTypeText();
  const [newOpen, setNewOpen] = useState(false);
  /**
   * 지금 수정 기록(?edit=1)이 이 화면이 상세 위에 쌓은 것인가 — 그렇다면 닫을 때 뒤로 가 그 기록을 걷는다(closeEdit).
   * [수정]을 누르면 참이 되고, 수정이 열릴 때 기록(history.state)에도 꼬리표를 달아 새로 고침 · 앞으로 가기로 다시 열린 수정도 되살린다.
   */
  const editPushed = useRef(false);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  // 상세를 닫아도 패널이 밀려 나가는 동안은 마지막 내용을 그대로 보인다
  const [shown, setShown] = useState(detail);
  if (detail && detail !== shown) setShown(detail);
  const holiday = shown && "holiday" in shown ? shown.holiday : null;
  // 수정 패널은 주소에 ?edit=1 이 있고, 고칠 수 있는 그 휴일의 상세가 지금 열려 있을 때만 선다(isEditOpen)
  const canEditShown = !!holiday && (holiday.actions.canUpdate || holiday.actions.canUpdateStores);
  const editOpen = isEditOpen(query, canEditShown, holiday?.bpHolidayId ?? null);

  // 지금 수정 · 상세가 열려 있는지를 최신 값으로 본다 — 저장 · 삭제 결과는 누른 때의 화면으로 돌아오므로, 그 사이 뒤로 가기로 이미 닫혔으면
  // 다시 뒤로 가거나 목록 주소를 쌓지 않는다.
  const editOpenRef = useRef(editOpen);
  const detailOpenRef = useRef(Boolean(query.holiday));
  useEffect(() => {
    editOpenRef.current = editOpen;
    if (!editOpen) {
      editPushed.current = false;
      return;
    }
    // 수정이 열린 지금 기록은 ?edit=1 이다. 꼬리표는 여기서만 읽고 쓴다(router.refresh · 서버 액션이 기록을 다시 써 지우므로)
    const state = window.history.state as Record<string, unknown> | null;
    if (editPushed.current) window.history.replaceState({ ...state, [EDIT_PUSHED_STATE]: query.holiday }, "");
    else if (state?.[EDIT_PUSHED_STATE] === query.holiday) editPushed.current = true;
  }, [editOpen, query.holiday]);
  useEffect(() => {
    detailOpenRef.current = Boolean(query.holiday);
  }, [query.holiday]);

  const href = (next: BpHolidayQuery) => bpPath(bp, bpHolidaysHref(next));
  // 같은 달 안에서 화면 상태만 바꾸는 이동이라 스크롤을 맨 위로 올리지 않는다
  const go = (next: Partial<BpHolidayQuery>, replace = false) => {
    const to = href({ ...query, ...next });
    if (replace) router.replace(to, { scroll: false });
    else router.push(to, { scroll: false });
  };

  const openDetail = (id: number, date: string, from: HTMLElement) => {
    detailTrigger.current = from;
    go({ holiday: id, at: date, edit: false });
  };
  const closeDetail = () => go({ holiday: null, at: null, edit: false });
  const openEdit = (from: HTMLButtonElement) => {
    editTrigger.current = from;
    editPushed.current = true;
    go({ edit: true });
  };
  /**
   * 수정의 취소 · Esc · 저장(바탕 클릭은 closeAll). 이 화면이 쌓은 기록이면 뒤로 가 걷는다 — push 로 상세 주소를 다시 쌓으면 그 뒤 뒤로 가기가
   * 닫은 수정을 다시 연다. 새로 고침 · 링크로 ?edit=1 에 바로 들어왔으면 뒤가 이 화면이 아닐 수 있어 주소만 바꾼다(replace).
   */
  const closeEdit = () => {
    if (!editOpenRef.current) return;
    editOpenRef.current = false;
    if (!editTrigger.current?.isConnected) editTrigger.current = document.querySelector<HTMLButtonElement>(`[aria-controls="${EDIT_PANEL_ID}"]`);
    if (editPushed.current) {
      editPushed.current = false;
      router.back();
    } else go({ edit: false }, true);
  };
  /** 상세의 Esc · 닫기 — 위에 수정 패널이나 팝업(<dialog>)이 떠 있으면 그쪽만 닫혀야 한다(DESIGN.md 「Esc 는 가장 안쪽부터」) */
  const dismissDetail = () => {
    if (editOpen || document.querySelector("dialog[open]")) return;
    closeDetail();
  };
  /** 바탕창 클릭 — 열린 패널을 모두 닫고 목록으로 간다 */
  const closeAll = () => {
    setNewOpen(false);
    editPushed.current = false;
    if (query.holiday) closeDetail();
  };
  /** 등록의 Esc — 그 위에 상세가 겹쳤으면(주소로 열림) 상세만 닫는다 */
  const dismissNew = () => {
    if (query.holiday) return;
    setNewOpen(false);
  };

  const backdropActive = useBackdropActive();
  const prev = shiftBpHolidayMonth(query, -1);
  const next = shiftBpHolidayMonth(query, 1);
  const thisMonth: BpHolidayQuery = { ...query, year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)), day: today, holiday: null, at: null, edit: false };
  const monthNav = (
    // [2026년 11월 ▾] ‹ › [오늘] — 제목을 누르면 연 · 월 고르기 판, 이전 · 다음 달 버튼은 나란히, [오늘]은 오른쪽 끝(2026-10-30 사용자 지정)
    <div role="group" aria-label="달 이동" className="flex items-center gap-[6px]">
      <MonthPicker
        year={query.year}
        month={query.month}
        years={YEAR_OPTIONS}
        current={{ year: thisMonth.year, month: thisMonth.month }}
        onPick={(year, month) => go({ year, month, day: null, holiday: null, at: null })}
      />
      <MonthStep target={prev} href={prev && href(prev)} label="이전달" icon="prev" />
      <MonthStep target={next} href={next && href(next)} label="다음달" icon="next" />
      {/* [오늘]도 좌우 화살표와 같은 흰 바탕 · 테두리 상자 — 회색 Off 버튼은 이 줄에서 혼자 달라 보였다(2026-10-30 사용자 지정) */}
      <Link href={href(thisMonth)} scroll={false} className={`${ICON_BUTTON} w-auto! px-[14px] text-[14px] font-medium text-erp-ink`}>
        {/* 버튼 글자에 오늘 날짜를 함께 — 「오늘 · 2026-10-30(금)」, 날짜는 작고 흐리게(범례 · 따로 둔 표시 대신, 2026-10-30 사용자 지정) */}
        {/* 한 덩어리로 감싼다 — 버튼 바탕(grid)이 글자와 날짜를 두 줄로 쌓았다 */}
        <span className="whitespace-nowrap">
          오늘<span className="ml-[6px] text-[12px] font-normal text-erp-label">· {today}({weekdayName(today).slice(0, 1)})</span>
        </span>
      </Link>
    </div>
  );
  // 새 휴일의 처음 날짜 — 고른 날짜가 오늘 이후면 그날, 아니면 오늘(지난 날짜에는 등록하지 않는다 · CONFIG-9)
  const newStart = query.day && query.day >= today ? query.day : today;

  // 열: 날짜 · 휴일명 · 휴일유형 · 적용범위 · 대상점포 · 예외점포 · 최종수정(2026-10-30 사용자 지정 — 전엔 날짜 · 휴일명 · 적용 대상 · 휴일유형 · 최종수정일시).
  // 「적용 대상」 한 칸을 적용범위(꼬리표만) · 대상점포 · 예외점포 셋으로 나눴고, 해당 없는 칸은 「-」. 폭은 정하고 남는 폭은 최종수정이 쓴다
  const columns: Column<BpHolidayDateRow>[] = [
    {
      header: "날짜",
      width: "w-[150px]",
      // 지난 날짜는 흐리게 — 고칠 수 없는 날짜다(CONFIG-9). 가운데 정렬(2026-10-30 사용자 지정)
      cell: (r) => (
        <span className={r.isPast ? "text-erp-muted" : ""}>
          {r.date} <Muted>({weekdayName(r.date).slice(0, 1)})</Muted>
        </span>
      ),
    },
    {
      header: "휴일명",
      width: "w-[200px]",
      align: "left",
      cell: (r) => (
        <button type="button" aria-controls={DETAIL_PANEL_ID} onClick={(e) => openDetail(r.bpHolidayId, r.date, e.currentTarget)} className="max-w-full truncate text-erp-link hover:underline">
          {r.name}
        </button>
      ),
    },
    // 휴일유형은 휴일명 바로 옆(2026-10-30 사용자 지정)
    { header: "휴일유형", width: "w-[120px]", cell: (r) => typeText(r.holidayTypeCode, r.holidayRepeatTypeCode) },
    { header: "적용범위", width: "w-[110px]", cell: (r) => <ScopeTag isAllStores={r.target.isAllStores} /> },
    // 대상점포 · 예외점포는 같은 폭(2026-10-30 사용자 지정)
    {
      header: "대상점포",
      width: "w-[180px]",
      align: "left",
      cell: (r) =>
        r.target.isAllStores ? (
          <Muted>-</Muted>
        ) : (
          <span className="block truncate">{storesText(r.target.firstStoreName, r.target.otherStoreCount)}</span>
        ),
    },
    {
      header: "예외점포",
      width: "w-[180px]",
      cell: (r) => (r.target.isAllStores && r.target.excludedStoreCount ? `${r.target.excludedStoreCount}개` : <Muted>-</Muted>),
    },
    // 「최종수정」 한 칸에 「일시 · 사람」(사람은 회색) — BP · 플랫폼 권한 그룹 목록과 같은 모양(2026-10-30 사용자 지정 — 전엔 「최종수정일시」 · 「일시 | 사람」).
    // 목록 줄에는 등록일시가 없어(api) 고친 적 없는 휴일도 「-」 대신 등록 때 값이 보인다
    {
      header: "최종수정",
      align: "left",
      cell: (r) => (
        <span className="block truncate">
          {formatDateTime(r.updatedAt)} {r.updatedByName && <span className="text-erp-label">· {r.updatedByName}</span>}
        </span>
      ),
    },
  ];

  return (
    <>
      {/* [등록]은 제목 줄 오른쪽 — 1팀 목록과 같은 자리(2026-10-23). 바탕창이 떠 있는 동안은 목록처럼 inert 로 뺀다 */}
      <div className="contents" inert={backdropActive}>
        <PageBar title="BP 휴일 관리">
          {can.create && (
            <Button ref={newTrigger} aria-controls={NEW_PANEL_ID} aria-expanded={newOpen} onClick={() => setNewOpen(true)}>
              등록
            </Button>
          )}
        </PageBar>
      </div>
      <div className="flex min-h-0 flex-1 p-[24px]">
        <main
          inert={backdropActive}
          className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0"
        >
          {/* 탭(캘린더 · 목록)을 맨 위에, [변경이력]은 그 줄 오른쪽 — 달 이동은 달력 제목 줄로 옮겼다(2026-10-30 사용자 지정 — 전엔 탭 위에 이동 줄이 따로 있어
              달력 제목과 같은 연 · 월이 두 번 보였다) */}
          <div className="flex shrink-0 items-end gap-[6px] border-b border-erp-bar-line">
          <nav aria-label="보기" className="flex flex-1">
            <Link href={href({ ...query, view: "calendar" })} aria-current={query.view === "calendar" ? "page" : undefined} className={tab(query.view === "calendar")} scroll={false}>
              캘린더
            </Link>
            <Link href={href({ ...query, view: "list" })} aria-current={query.view === "list" ? "page" : undefined} className={tab(query.view === "list")} scroll={false}>
              목록
            </Link>
          </nav>
            <span className="pb-[6px]">
              <HolidayHistoryButton today={today} />
            </span>
          </div>
          {query.view === "calendar" ? (
            <HolidayCalendar query={query} today={today} list={list} nav={monthNav} onSelectDay={(day) => go({ day }, true)} onOpen={openDetail} />
          ) : (
            <>
              <div className="flex items-center gap-[10px]">
                {monthNav}
                <span className="text-[14px] text-erp-label">BP 휴일 {list.total}건</span>
              </div>
              {/* 계산한 날짜마다 한 줄 · 날짜순(같은 날은 전체 점포 먼저, 그다음 등록 순서). 공식 휴일은 목록에 없다(CONFIG-10) */}
              <DataTable
                columns={columns}
                rows={list.items}
                rowKey={(r) => `${r.date}-${r.bpHolidayId}`}
                rowState={(r) => (r.bpHolidayId === query.holiday && r.date === query.at ? "selected" : undefined)}
                empty="이 달에 등록된 BP 휴일이 없습니다."
              />
            </>
          )}
        </main>

        {can.create && (
          <HolidayFormPanel
            id={NEW_PANEL_ID}
            mode="create"
            open={newOpen}
            today={today}
            startDate={newStart}
            onClose={dismissNew}
            onBackdropClose={closeAll}
            trigger={newTrigger}
            onSaved={(id, startDate) => {
              setNewOpen(false);
              toast("saved");
              detailTrigger.current = newTrigger.current;
              // 상세의 「적용 점포」는 고른 날짜 기준이다 — 새 휴일의 시작일로 열어야 그날 적용되는 점포 수가 보인다(오늘이면 시작 전이라 0곳)
              go({ holiday: id, at: startDate, edit: false });
            }}
          />
        )}

        <HolidayDetailPanel
          open={Boolean(query.holiday)}
          detail={shown}
          today={today}
          onClose={dismissDetail}
          onBackdropClose={closeAll}
          trigger={detailTrigger}
          onEdit={openEdit}
          onRemoved={(kind) => {
            if (kind === "deleted") {
              toast("deleted");
              // 삭제를 기다리는 동안 뒤로 가기로 상세가 이미 닫혔으면 목록 주소를 다시 쌓지 않는다
              if (detailOpenRef.current) closeDetail();
            } else toast("강제 종료했습니다. 어제 날짜로 끝났습니다.");
          }}
        />

        {holiday && canEditShown && (
          <HolidayFormPanel
            // 다른 휴일이면 새로 그린다. 같은 휴일의 최신 정보가 오면 패널이 스스로 칸을 다시 채운다.
            key={holiday.bpHolidayId}
            id={EDIT_PANEL_ID}
            mode="edit"
            holiday={holiday}
            open={editOpen}
            today={today}
            onClose={closeEdit}
            onBackdropClose={closeAll}
            trigger={editTrigger}
            onSaved={() => {
              closeEdit();
              toast("updated");
            }}
            onStale={() => {
              toast("다른 사용자가 먼저 수정했습니다. 최신 정보를 불러왔으니 다시 고쳐 저장해 주세요.");
              router.refresh();
            }}
          />
        )}
      </div>
    </>
  );
}

/** 이전 · 다음 달. 2000년 1월 앞 · 2100년 12월 뒤는 갈 곳이 없어 막힌 버튼으로 둔다(호버하지 않는다). */
function MonthStep({ target, href, label, icon }: { target: BpHolidayQuery | null; href: string | null; label: string; icon: "prev" | "next" }) {
  // 화살표는 먹색으로 그린다 — 회색(#858b94) 아이콘 파일은 흰 상자 위에서 잘 안 보였다(2026-10-30 사용자 지정)
  const img = (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[16px] text-erp-ink">
      <path d={icon === "prev" ? "M11 14L5 8L11 2" : "M5 14L11 8L5 2"} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return target && href ? (
    <Link href={href} aria-label={label} scroll={false} className={ICON_BUTTON}>
      {img}
    </Link>
  ) : (
    <button type="button" aria-label={label} disabled className={`${ICON_SHELL} opacity-40`}>
      {img}
    </button>
  );
}
