"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, useTransition, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DataTable, DetailTable, DetailValues, SlidePanel, Tag, type Column, type DetailRow } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { FailedBand, InfoBand } from "@/components/site/side-parts";
import { repeatBasis, repeatEndText, weekdayName, yesterdayOf, type RepeatType } from "@/lib/bp-holiday-view";
import type { BpHolidayDetail, BpHolidayStore } from "@/lib/bp-holidays";
import { formatDateTime, wasUpdated } from "@/lib/format";
import { deleteBpHolidayAction, terminateBpHolidayAction } from "./actions";
import { OwnHistoryButton } from "./history-dialog";
import { Muted, ScopeTag, unknownResult, useHolidayTypeText } from "./holiday-parts";

// BP 휴일 상세(S-MQELTV). 등록 화면과 같은 순서로 묶는다 — 휴일 정보 · 날짜(반복) · 적용 대상 · 점포(데모 2026-10-08).
// 무엇을 할 수 있는지는 api 가 휴일마다 준 actions 로 가린다 — 메뉴 권한 · 점포 범위 · 상태(시작 전 · 진행 중 · 종료)를 api 가 이미 셈했다.
// 「BP 휴일 변경 · 종료 정책」(1팀, 2026-10-26): 시작 전이면 삭제, 지난 날짜가 있으면 삭제 대신 강제 종료(어제로 끝냄, 되돌리지 않음),
// 끝난 휴일은 읽기만 한다. 막힌 동작이 있으면 그 사유(blockedReason)를 띠로 보인다.
// 실행 버튼은 닫기만 맨 왼쪽, 나머지는 오른쪽 끝(BP 관리자 상세와 같다).

export const DETAIL_PANEL_ID = "bp-holiday-detail-panel";
export const EDIT_PANEL_ID = "bp-holiday-edit-panel";

/** api 의 오늘 시작한 휴일 사유(bp-holiday-access TODAY_START_REASON)의 앞부분 — 이 띠는 보이지 않는다 */
const TODAY_START_REASON = "오늘 시작한 휴일은 강제 종료할 수 없습니다";

const STATE_TEXT ={ UPCOMING: "시작 전", ONGOING: "진행 중", ENDED: "종료" } as const;

export function HolidayDetailPanel({
  open,
  detail,
  today,
  onClose,
  onBackdropClose,
  trigger,
  onEdit,
  onRemoved,
}: {
  open: boolean;
  detail: { holiday: BpHolidayDetail } | { failed: string } | null;
  today: string;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다 */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  onEdit: (from: HTMLButtonElement) => void;
  /** 삭제 · 강제 종료가 끝났다 — 삭제면 상세를 닫고, 강제 종료면 새 값으로 다시 그린다 */
  onRemoved: (kind: "deleted" | "terminated") => void;
}) {
  return (
    <SlidePanel id={DETAIL_PANEL_ID} open={open} onClose={onClose} onBackdropClose={onBackdropClose} label="BP 휴일 상세" trigger={trigger} closeOnBackdrop>
      {detail && "holiday" in detail ? (
        <DetailBody key={detail.holiday.bpHolidayId} holiday={detail.holiday} today={today} panelOpen={open} onClose={onClose} onEdit={onEdit} onRemoved={onRemoved} />
      ) : (
        <>
          {detail && <FailedBand message={detail.failed} />}
          <div className="flex border-t border-erp-panel-line pt-[16px]">
            <Button variant="off" onClick={onClose}>
              닫기
            </Button>
          </div>
        </>
      )}
    </SlidePanel>
  );
}

function DetailBody({
  holiday: h,
  today,
  panelOpen,
  onClose,
  onEdit,
  onRemoved,
}: {
  holiday: BpHolidayDetail;
  today: string;
  panelOpen: boolean;
  onClose: () => void;
  onEdit: (from: HTMLButtonElement) => void;
  onRemoved: (kind: "deleted" | "terminated") => void;
}) {
  const router = useRouter();
  const typeText = useHolidayTypeText();
  const repeatLabel = useCodeLabel("HOLIDAY_REPEAT_TYPE");
  const [confirm, setConfirm] = useState<"terminate" | "delete" | null>(null);
  // 확인창은 네이티브 <dialog> 라 패널이 클릭 아닌 길(뒤로 가기)로 닫혀도 남는다 — 함께 닫는다
  if (!panelOpen && confirm) setConfirm(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const { actions } = h;

  /** 실패 띠를 세운다. 지금 상태가 화면과 다를 수 있는 실패(404 · 409 · 결과 모름)면 상세 · 목록을 다시 받는다. */
  const fail = (status: number | undefined, message: string) => {
    setFailure(message);
    if (status === undefined || status === 404 || status === 409) router.refresh();
  };

  const handleTerminate = () =>
    startBusy(async () => {
      const result = await terminateBpHolidayAction(h.bpHolidayId, h.updatedAt).catch(unknownResult("강제 종료"));
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      setFailure(null);
      onRemoved("terminated");
    });

  const handleDelete = () =>
    startBusy(async () => {
      // 수정 · 강제 종료처럼 읽은 updatedAt 을 함께 보낸다 — 그사이 다른 사용자가 고쳤으면 409 이고 fail 이 상세를 새로 받는다
      const result = await deleteBpHolidayAction(h.bpHolidayId, h.updatedAt).catch(unknownResult("삭제"));
      setConfirm(null);
      if (!result.ok) return fail(result.status, result.message);
      onRemoved("deleted");
    });

  const dated = (date: string | null) => (date ? <>{date} <Muted>({weekdayName(date).slice(0, 1)})</Muted></> : null);
  // api 는 등록 때 수정자 · 수정일시도 등록자 · 등록일시로 채운다 — 1팀 화면처럼 등록 뒤 고친 적이 없으면 「-」(format.ts wasUpdated, 관리자 상세와 같은 규칙)
  const edited = h.updatedByName !== null && wasUpdated(h.createdAt, h.updatedAt);
  const info: DetailRow[] = [
    { label: "휴일명", value: h.name },
    { label: "휴일 유형", value: typeText(h.holidayTypeCode, h.holidayRepeatTypeCode) },
    { label: "설명", value: h.description, multiline: Boolean(h.description) },
    { label: "등록일시", value: <DetailValues items={[formatDateTime(h.createdAt), h.createdByName ?? <Muted>시스템</Muted>]} /> },
    { label: "최종수정일시", value: edited ? <DetailValues items={[formatDateTime(h.updatedAt), h.updatedByName]} /> : <Muted>-</Muted> },
  ];
  const repeat = h.holidayRepeatTypeCode as RepeatType | null;
  const dates: DetailRow[] =
    h.holidayTypeCode === "REPEAT"
      ? [
          { label: "시작일", value: dated(h.startDate) },
          { label: "반복 유형", value: repeat ? <>{repeatLabel(repeat)} {repeatBasis(repeat, h.startDate) && <Muted>· {repeatBasis(repeat, h.startDate)}</Muted>}</> : null },
          // 다음 날짜(S-MQELTV — 고른 날짜 다음 셋)는 보이지 않는다(2026-10-26 사용자 요청). api 는 nextDates 를 계속 준다
          { label: "종료 조건", value: repeatEndText(h.repeatEndType, h.repeatEndDate, h.repeatCount) },
        ]
      : h.holidayTypeCode === "PERIOD"
        ? [{ label: "기간", value: <>{dated(h.startDate)} ~ {dated(h.endDate)}</> }]
        : [{ label: "날짜", value: dated(h.startDate) }];
  const target: DetailRow[] = [
    { label: "적용 범위", value: <ScopeTag isAllStores={h.isAllStores} /> },
    // 고른 날짜(없으면 오늘)에 이 휴일이 적용되는 점포 수 — 전체 점포 휴일은 예외를 뺀 수다
    { label: "적용 점포", value: `${h.appliedStoreCount}곳` },
  ];
  const canEdit = actions.canUpdate || actions.canUpdateStores;
  const yesterday = yesterdayOf(today);

  return (
    <div className="flex flex-col gap-[16px]">
      {/* 이름(꼬리표)은 맨 위에 혼자, 기능 버튼은 닫기까지 모두 맨 아래로(BP 관리자 상세 패널과 같다 · 2026-10-08) */}
      <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
        <span className="mr-[4px]">{h.name}</span>
        <ScopeTag isAllStores={h.isAllStores} />
        <Tag>{typeText(h.holidayTypeCode, h.holidayRepeatTypeCode)}</Tag>
        {/* 상태 — 시작 전 · 진행 중 · 종료(오늘 기준). 무엇을 고칠 수 있는지가 이것으로 갈린다 */}
        <Badge tone={h.state === "ONGOING" ? "on" : "closed"}>{STATE_TEXT[h.state]}</Badge>
      </h2>
      {failure && <FailedBand message={failure} />}
      {/* 끝난 휴일은 띠를 두지 않는다 — 제목 줄의 「종료」 배지로 이미 알 수 있다(2026-10-26 사용자 요청) */}
      {/* 오늘 시작한 휴일의 「강제 종료할 수 없습니다 — 삭제해 주세요」도 두지 않는다 — [삭제]만 보이는 것으로 충분하다(2026-10-26 사용자 요청) */}
      {actions.blockedReason && h.state !== "ENDED" && !actions.blockedReason.startsWith(TODAY_START_REASON) && <InfoBand>{actions.blockedReason}</InfoBand>}
      <DetailTable title="휴일 정보" rows={info} />
      <DetailTable title={h.holidayTypeCode === "REPEAT" ? "반복" : "날짜"} rows={dates} />
      <DetailTable title="적용 대상" rows={target} />
      <StoreTable isAllStores={h.isAllStores} stores={h.stores} />

      <div className="flex flex-wrap items-center gap-[6px] border-t border-erp-panel-line pt-[16px]">
        <Button variant="off" onClick={onClose}>
          닫기
        </Button>
        <span className="flex-1" />
        {actions.canDelete && (
          <Button variant="soft" onClick={() => setConfirm("delete")} disabled={busy}>
            삭제
          </Button>
        )}
        {actions.canTerminate && (
          <Button variant="soft" onClick={() => setConfirm("terminate")} disabled={busy}>
            강제 종료
          </Button>
        )}
        {canEdit && (
          <Button aria-controls={EDIT_PANEL_ID} onClick={(e) => onEdit(e.currentTarget)} disabled={busy}>
            수정
          </Button>
        )}
        <OwnHistoryButton histories={h.histories} panelOpen={panelOpen} />
      </div>

      <ConfirmDialog open={confirm === "terminate"} title="휴일을 강제 종료하시겠습니까?" confirmLabel="강제 종료" busy={busy} onConfirm={handleTerminate} onCancel={() => setConfirm(null)}>
        <div className="flex flex-col gap-[12px] break-keep">
          <p>
            <b className="font-semibold">{h.name}</b> 휴일을 <b className="font-semibold">어제({yesterday})</b> 날짜로 끝냅니다. 오늘부터는 이 휴일이 적용되지 않고, 지난 날짜는 그대로 남습니다.
          </p>
          <p>강제 종료는 되돌릴 수 없습니다.</p>
        </div>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "delete"} title="휴일을 삭제하시겠습니까?" confirmLabel="삭제" busy={busy} onConfirm={handleDelete} onCancel={() => setConfirm(null)}>
        <div className="flex flex-col gap-[12px] break-keep">
          <p>
            <b className="font-semibold">{h.name}</b> 휴일을 삭제합니다. 삭제한 휴일은 목록과 캘린더에서 빠지고 <b className="font-semibold">변경이력에만</b> 남습니다.
          </p>
          <p>삭제한 휴일은 복구할 수 없습니다.</p>
        </div>
      </ConfirmDialog>
    </div>
  );
}

/** 적용 기간의 날짜를 짧게 — `2026-10-20` → `26.10.20`. 패널 폭(464px)에 기간이 두 줄로 들어가게 줄인다(2026-10-26 사용자 요청). */
const shortDate = (date: string) => `${date.slice(2, 4)}.${date.slice(5, 7)}.${date.slice(8, 10)}`;

/**
 * 점포 표의 열. api 가 점포명 → 적용 시작일 → 기간 순으로 준다 — 같은 점포의 기간이 붙어 나온다. 줄마다 점포명 · 코드를 그대로 적는다(2026-10-26 사용자 요청).
 * 기간 상태 열은 두지 않는다(사용자 요청) — 빠진 기간은 날짜를 흐리게 해 구분한다.
 */
const STORE_COLUMNS: Column<BpHolidayStore>[] = [
  {
    header: "점포명",
    align: "left",
    cell: (s) => (
      <span className="flex min-w-0 items-center gap-[6px]">
        <span className="truncate" title={s.name}>
          {s.name}
        </span>
        {s.storeStatusCode === "CLOSED" && <Badge tone="closed">폐점</Badge>}
      </span>
    ),
  },
  { header: "점포코드", width: "w-[90px]", cell: (s) => s.storeCode },
  // 적용 기간 — 시작 · 종료를 두 줄로. 끝나지 않았으면(휴일이 끝날 때까지) 「시작 ~」 한 줄만 둔다(2026-10-26 사용자 요청)
  {
    header: "적용 기간",
    width: "w-[96px]",
    cell: (s) => (
      <span className={`flex flex-col text-[13px] leading-[1.3] ${s.periodState === "ENDED" ? "text-erp-muted" : ""}`} title={`${s.effectiveStartDate} ~ ${s.effectiveEndDate ?? ""}`}>
        <span>{shortDate(s.effectiveStartDate)} ~</span>
        {s.effectiveEndDate && <span>{shortDate(s.effectiveEndDate)}</span>}
      </span>
    ),
  },
];

/** 점포 표에서 한 번에 보이는 줄 수 — 넘으면 표 안에서 스크롤한다(데모 2026-10-08 · 2026-10-26 사용자 요청) */
const VISIBLE_STORE_ROWS = 5;

/**
 * 대상 점포(특정 점포) · 예외 점포(전체 점포) — 지우지 않은 모든 기간, 기간마다 한 줄(빠진 기간 포함). 다섯 줄까지 보이고 넘으면 표 안에서 스크롤하며, 열 이름 줄은 위에 붙여 둔다.
 * 높이는 그려진 열 이름 줄 + 앞 다섯 줄을 재서 정한다 — 줄 46px 에 칸 선(border-collapse)이 더해져 고정값으로 두면 다섯째 줄이 조금 잘린다.
 */
function StoreTable({ isAllStores, stores }: { isAllStores: boolean; stores: BpHolidayStore[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  useLayoutEffect(() => {
    const table = box.current?.querySelector("table");
    if (!table || stores.length <= VISIBLE_STORE_ROWS) return setMaxHeight(undefined);
    const head = table.tHead?.getBoundingClientRect().height ?? 0;
    const rows = [...table.tBodies[0].rows].slice(0, VISIBLE_STORE_ROWS).reduce((sum, r) => sum + r.getBoundingClientRect().height, 0);
    setMaxHeight(Math.ceil(head + rows));
  }, [stores]);

  return (
    <section className="flex flex-col gap-[12px]">
      <h3 className="text-[16px] font-medium text-erp-ink">
        {isAllStores ? "예외 점포" : "대상 점포"}
        {/* 기간 줄 수 — 같은 점포를 뺐다 다시 더하면 줄이 늘어난다(2026-10-26 사용자 요청으로 적용 중 점포 수는 빼고 전체만) */}
        <span className="ml-[10px] text-[14px] font-normal text-erp-label">전체 {stores.length}건</span>
      </h3>
      {/* 열 이름 줄을 스크롤 영역 위에 붙인다(sticky). 표 머리 바탕이 그 줄에 깔려 있어 아래 줄이 비치지 않는다 */}
      <div ref={box} style={{ maxHeight }} className="overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[1]">
        <DataTable columns={STORE_COLUMNS} rows={stores} rowKey={(s) => s.periodId} empty={isAllStores ? "예외 점포가 없습니다." : "대상 점포가 없습니다."} />
      </div>
    </section>
  );
}
