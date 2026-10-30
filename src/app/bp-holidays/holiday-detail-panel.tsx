"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DataTable, DetailTable, SlidePanel, type Column, type DetailRow } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { HeadValues } from "@/components/site/head-values";
import { FailedBand, InfoBand, WarnBand } from "@/components/site/side-parts";
import { WhoList } from "@/app/platform-admins/admin-parts";
import { repeatBasis, repeatEndText, weekdayName, yesterdayOf, type RepeatType } from "@/lib/bp-holiday-view";
import type { BpHolidayDetail, BpHolidayStore } from "@/lib/bp-holidays";
import { formatDateTime, wasUpdated } from "@/lib/format";
import { deleteBpHolidayAction, terminateBpHolidayAction } from "./actions";
import { OwnHistoryButton } from "./history-dialog";
import { Muted, unknownResult, useHolidayTypeText } from "./holiday-parts";

// BP 휴일 상세(S-MQELTV). 등록 화면과 같은 순서로 묶는다 — 휴일정보 · 날짜(반복) · 점포(데모 2026-10-08, 「적용 대상」 표는 2026-10-30 뺐다).
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
          <div className="flex">
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

  // 값 조각은 한 span 으로 묶는다 — 조각으로 두면 표 값 칸의 간격이 사이에 끼어 「2026-10-30   (금)」처럼 벌어졌다(2026-10-30)
  // 요일도 날짜와 같은 크기 · 먹색으로 — 「2026-10-30(금)부터 · 금요일마다 · 2회」가 한 덩어리로 읽히게(2026-10-30 사용자 지정 — 전엔 요일만 회색)
  const dated = (date: string | null) => (date ? `${date}(${weekdayName(date).slice(0, 1)})` : null);
  // api 는 등록 때 수정자 · 수정일시도 등록자 · 등록일시로 채운다 — 1팀 화면처럼 등록 뒤 고친 적이 없으면 「-」(format.ts wasUpdated, 관리자 상세와 같은 규칙)
  const edited = h.updatedByName !== null && wasUpdated(h.createdAt, h.updatedAt);
  const repeat = h.holidayRepeatTypeCode as RepeatType | null;
  const dates: DetailRow[] =
    h.holidayTypeCode === "REPEAT"
      ? [
          // 시작일 · 반복 기준 · 종료조건을 한 줄로 — 「2026-10-30(금)부터 · 금요일마다 · 2회」(2026-10-30 사용자 지정 — 전엔 시작일 · 반복유형 · 종료조건 세 줄).
          // 반복 종류(매주 등)는 바로 위 휴일유형 줄에 있다. 다음 날짜(S-MQELTV — 고른 날짜 다음 셋)는 보이지 않는다(2026-10-26 사용자 요청)
          {
            label: "날짜",
            // 길면 두 줄이 된다 — 「2027-03-30까」/「지」처럼 글자 중간이 아니라 「 · 」 조각 사이에서만 줄을 바꾸고, 칸 높이도 늘린다(2026-10-30 사용자 지적)
            multiline: true,
            value: (
              <span>
                {[
                  `${dated(h.startDate)}부터`,
                  // 매월은 「30일마다」가 「30일 간격」으로 읽혀 「매월 30일마다」로(코드 리뷰로 찾음)
                  repeat && (repeatBasis(repeat, h.startDate) ? `${repeat === "MONTHLY" ? "매월 " : ""}${repeatBasis(repeat, h.startDate)}마다` : repeatLabel(repeat)),
                  repeatEndText(h.repeatEndType, h.repeatEndDate, h.repeatCount),
                ]
                  .filter(Boolean)
                  .map((part, i) => (
                    <span key={i} className="whitespace-nowrap">
                      {i > 0 && " · "}
                      {part}
                    </span>
                  ))
                  .reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, " ", el] : [el]), [])}
              </span>
            ),
          },
        ]
      : h.holidayTypeCode === "PERIOD"
        ? [{ label: "기간", value: <span>{dated(h.startDate)} ~ {dated(h.endDate)}</span> }]
        : [{ label: "날짜", value: dated(h.startDate) }];
  // 날짜 · 반복은 따로 묶음을 두지 않고 휴일정보의 휴일 유형 바로 아래 줄로 둔다(2026-10-30 사용자 지정 — 전엔 「반복」 · 「날짜」 표)
  const info: DetailRow[] = [
    { label: "휴일명", value: h.name },
    // 휴일유형 줄은 뺐다 — 머리 줄 「휴일유형 매주 반복」에 있다(2026-10-30 사용자 지정)
    ...dates,
    // 입력한 줄바꿈 그대로 보인다(whitespace-pre-line) — 등록 · 수정에서 Enter 로 나눈 줄이 한 줄로 붙어 보였다(2026-10-30 사용자 지적)
    { label: "설명", value: h.description && <span className="whitespace-pre-line">{h.description}</span>, multiline: Boolean(h.description) },
    // 등록 · 최종수정은 설명 아래(휴일정보 표 마지막 두 줄)에 둔다(2026-10-30 사용자 지정 — 잠깐 버튼 줄 위 따로 두었다가 되돌림)
    // 라벨은 「등록」 · 「최종수정」, 값은 「일시 · 사람」 — 일시는 먹색, 「 · 사람」은 회색(관리자 · 권한 그룹 상세와 같다, 2026-10-30 사용자 지정 — 전엔 「등록일시」 · 「최종수정일시」에 세로선 구분)
    // 한 span 으로 묶는다 — 조각으로 두면 표 값 칸의 간격이 일시와 「 · 사람」 사이에 끼었다(BP 마스터 상세 when 과 같다)
    { label: "등록", value: <span>{formatDateTime(h.createdAt)} <span className="text-erp-label">· {h.createdByName ?? "시스템"}</span></span> },
    { label: "최종수정", value: edited ? <span>{formatDateTime(h.updatedAt)} <span className="text-erp-label">· {h.updatedByName}</span></span> : <Muted>-</Muted> },
  ];
  const canEdit = actions.canUpdate || actions.canUpdateStores;
  const yesterday = yesterdayOf(today);

  return (
    <div className="flex flex-col gap-[16px]">
      {/* 머리: 첫 줄 휴일명, 둘째 줄 「적용 범위 값 | 휴일유형 값 | 상태 배지」 — BP 관리자 상세 머리와 같은 형식(2026-10-30 사용자 지정 — 전엔 이름 옆 꼬리표 셋,
          잠깐 BP 마스터처럼 「휴일명」 라벨을 두었다가 뺐다). 기능 버튼은 닫기까지 모두 맨 아래로(BP 관리자 상세 패널과 같다 · 2026-10-08) */}
      <div className="flex flex-col items-start gap-[6px]">
        <h2 className="text-[18px] font-semibold break-all text-erp-ink">{h.name}</h2>
        <span className="text-[14px]">
          <HeadValues
            items={[
              { label: "적용 범위", value: h.isAllStores ? "전체 점포" : "일부 점포" },
              { label: "휴일유형", value: typeText(h.holidayTypeCode, h.holidayRepeatTypeCode) },
              // 상태 — 시작 전 · 진행 중 · 종료(오늘 기준). 무엇을 고칠 수 있는지가 이것으로 갈린다
              { value: <Badge tone={h.state === "ONGOING" ? "on" : "closed"}>{STATE_TEXT[h.state]}</Badge> },
            ]}
          />
        </span>
      </div>
      {failure && <FailedBand message={failure} />}
      {/* 끝난 휴일은 띠를 두지 않는다 — 제목 줄의 「종료」 배지로 이미 알 수 있다(2026-10-26 사용자 요청) */}
      {/* 오늘 시작한 휴일의 「강제 종료할 수 없습니다 — 삭제해 주세요」도 두지 않는다 — [삭제]만 보이는 것으로 충분하다(2026-10-26 사용자 요청) */}
      {actions.blockedReason && h.state !== "ENDED" && !actions.blockedReason.startsWith(TODAY_START_REASON) && <InfoBand>{actions.blockedReason}</InfoBand>}
      {/* 「휴일정보」 · 「예외점포」 · 「대상점포」는 붙여 쓴다 — 등록 패널과 같다(2026-10-30 사용자 지정) */}
      <DetailTable title="휴일정보" rows={info} />
      {/* 「적용 대상」 표(적용 범위 · 적용 점포 수)는 뺐다 — 적용 범위는 머리 줄에, 점포는 아래 대상점포 · 예외점포 제목 바에 있다(2026-10-30 사용자 지정) */}
      <StoreTable isAllStores={h.isAllStores} stores={h.stores} />

      {/* 버튼 줄은 위 표와 선으로 가르지 않는다 — 패널 칸 간격(16)만 둔다(DESIGN 슬라이드 패널 · BP 관리자 상세와 같다, 2026-10-30 사용자 지정) */}
      <div className="flex flex-wrap items-center gap-[6px]">
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

      {/* 확인창은 대상(회색 상자) + 빨간 안내 상자로 짧게 — BP · 플랫폼 관리자 비밀번호 초기화 확인창과 같은 모양(2026-10-30 사용자 지정 — 전엔 긴 설명 두 문단).
          확인 버튼은 다른 삭제 확인창과 같은 기본 버튼(빨간 Danger 버튼은 쓰지 않는다, 2026-10-30 사용자 지정) */}
      <ConfirmDialog open={confirm === "terminate"} title="휴일을 강제 종료하시겠습니까?" confirmLabel="강제 종료" busy={busy} onConfirm={handleTerminate} onCancel={() => setConfirm(null)}>
        <div className="flex flex-col gap-[12px] break-keep">
          <WhoList rows={[["휴일명", h.name], ["종료일", `${yesterday}(어제)`]]} />
          <WarnBand>{"오늘부터 이 휴일은 적용되지 않으며, 강제 종료는 되돌릴 수 없습니다."}</WarnBand>
        </div>
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "delete"} title="휴일을 삭제하시겠습니까?" confirmLabel="삭제" busy={busy} onConfirm={handleDelete} onCancel={() => setConfirm(null)}>
        <div className="flex flex-col gap-[12px] break-keep">
          <WhoList rows={[["휴일명", h.name]]} />
          <WarnBand>삭제한 휴일은 변경이력에서 확인할 수 있으며, 복구할 수 없습니다.</WarnBand>
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
  // 점포명 · 적용 기간은 14px, 점포코드는 작은 회색(12px)으로 — 들쭉날쭉해 보이지 않게 코드도 같은 글자 바닥선에 맞춘다(2026-10-30 사용자 지정).
  // 칸은 세로 가운데 맞춤이라 작은 글자가 위로 떠 보인다 — 14px 줄 높이(21px) 상자 안에 바닥으로 붙여 바닥선을 맞춘다
  { header: "점포코드", width: "w-[90px]", cell: (s) => <span className="inline-flex h-[21px] items-end pb-[2px] text-[12px] leading-none text-erp-muted">{s.storeCode}</span> },
  // 적용 기간 — 시작 · 종료를 두 줄로. 끝나지 않았으면(휴일이 끝날 때까지) 「시작 ~」 한 줄만 둔다(2026-10-26 사용자 요청)
  {
    header: "적용 기간",
    width: "w-[110px]",
    cell: (s) => (
      <span className={`flex flex-col leading-[1.3] ${s.periodState === "ENDED" ? "text-erp-muted" : ""}`} title={`${s.effectiveStartDate} ~ ${s.effectiveEndDate ?? ""}`}>
        {/* 끝나지 않았으면 「26.10.30부터」 — 열 이름 줄이 없어 「26.10.30 ~」만으로는 무슨 날짜인지 몰랐다(2026-10-30 사용자 지정). 끝났으면 「26.10.30 ~」 / 「26.11.05」 두 줄 */}
        {s.effectiveEndDate ? (
          <>
            <span>{shortDate(s.effectiveStartDate)} ~</span>
            <span>{shortDate(s.effectiveEndDate)}</span>
          </>
        ) : (
          <span>{shortDate(s.effectiveStartDate)}부터</span>
        )}
      </span>
    ),
  },
];

/** 점포 표에서 한 번에 보이는 줄 수 — 넘으면 표 안에서 스크롤한다(데모 2026-10-08 · 2026-10-26 사용자 요청) */
const VISIBLE_STORE_ROWS = 5;

/**
 * 대상점포(일부 점포) · 예외점포(전체 점포) — 지우지 않은 모든 기간, 기간마다 한 줄(빠진 기간 포함).
 * BP 관리자 상세의 대상점포와 같은 모양이다(2026-10-30 사용자 지정 — 전엔 글자 제목 아래 열 이름 줄 있는 표): 회색 제목 바(42px · 15px 600) 아래에
 * 열 이름 줄 없이(headVariant="none") 표를 붙이고, 여섯 줄부터는 다섯 줄 높이 안에서 스크롤하며 상자 위 · 아래 선을 늘 보이게 덧그린다.
 */
function StoreTable({ isAllStores, stores }: { isAllStores: boolean; stores: BpHolidayStore[] }) {
  const many = stores.length > VISIBLE_STORE_ROWS;
  const table = <DataTable headVariant="none" columns={STORE_COLUMNS} rows={stores} rowKey={(s) => s.periodId} empty={isAllStores ? "예외점포가 없습니다." : "대상점포가 없습니다."} />;
  return (
    <section className="flex flex-col">
      {/* 표가 스크롤하면 표는 오른쪽에 스크롤바 자리를 비운다 — 제목 바도 같은 자리를 비워 오른쪽 선을 맞춘다(BP 관리자 상세와 같다) */}
      <div className={many ? "overflow-hidden [scrollbar-gutter:stable]" : undefined}>
        <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">
          <span className="flex items-baseline gap-[10px]">
            {isAllStores ? "예외점포" : "대상점포"}
            {/* 점포 수만 — 「전체 점포 · 1건」은 전체 점포와 그 밖의 1곳으로 읽혀 헷갈렸다(2026-10-30 사용자 지적). 적용 범위는 머리 줄에 있다.
                같은 점포를 뺐다 다시 더하면 기간 줄이 늘어나므로 줄 수가 아니라 점포 수를 센다 */}
            <span className="text-[14px] font-normal text-erp-label">{new Set(stores.map((s) => s.storeId)).size.toLocaleString("ko-KR")}개</span>
          </span>
        </h3>
      </div>
      {many ? (
        // 다섯 줄 높이(위 선 1 + 줄 46 × 5) 안에서 스크롤 — 위 · 아래 선은 표에 붙어 스크롤하면 사라지므로 상자에 덧그린다(BP 관리자 상세와 같다)
        <div className="relative">
          <div className="max-h-[231px] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">{table}</div>
          <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [scrollbar-gutter:stable]">
            <span className="absolute inset-x-0 top-0 h-px bg-erp-thead-line" />
            <span className="absolute inset-x-0 bottom-0 h-px bg-erp-thead-line" />
          </span>
        </div>
      ) : (
        table
      )}
    </section>
  );
}
