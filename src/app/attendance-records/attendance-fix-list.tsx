"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, Checkbox, ConfirmDialog, RowButton, DataTable, DetailTable, Field, FieldMessage, FormGroup, GuideBand, Select, SlidePanel, TextField, Textarea, useAction, useToast, type Column } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { labelOf, type EnumValue } from "@/lib/enums";
import { BackdropInert } from "./backdrop-inert";
import type { AttendanceHistory, ProxyStaff } from "@/lib/attendance-records-api";
import { storeOptionLabel } from "@/lib/store-scope";
import { correctAttendanceAction, getAttendanceHistoryAction, getProxyStaffAction, proxyAttendanceAction, reviewAttendanceAction, type EditResult } from "./actions";
import { StoreNameWithType } from "@/components/site/store-type-tag";
import { byLabel, editTail, fixPairIndex, fixSaveNote, fixPoints, forcedNextDay, hasFutureTime, initialNextDay, laterDayMark, overnightNote, proxyPoints, shortDay, type DayRow, type FixRow } from "./attendance-query";

// 보정이 필요한 기록의 표와 동작(데모 staff-sections.mjs fixList · fixForm · proxyForm · histDialog, WHALEERP-220). 기록이 있는 줄에는
// 「보정」(정상 · 지각 · 보정됨 · 대신 등록한 기록도 다시 고친다 — 운영 정책 ATT-20 v283, WHALEERP-687), 확인 필요 사유가 남은 줄에는
// 「이상 없음」, 보정 · 대신 등록한 줄에는 「이력」. 일별 출퇴근 표의 줄에도 같은 「보정」을 둔다(DayFixButton).
// 보정 · 대신 등록은 오른쪽 패널, 「이상 없음」은 확인창, 이력은 창이다.
// 3개월이 지난 기록에는 보정 진입점을 두지 않는다(220). 수정 권한이 없으면 보정 · 이상 없음을, 등록 권한이 없으면 대신 등록을 두지 않는다.
// 급여명세서가 확정된 기간이면 보정 패널 · 이상 없음 확인창 · 대신 등록 패널(고른 직원 · 날짜)에 경고를 보이고, 저장 결과도 같은 경고를
// 토스트로 알린다(218 「급여에 영향이 갈 수 있다」).

const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
/** api 의 미래 시각 거절 문장 앞부분(attendance-edit.service assertNotFuture) — 이 거절만 출퇴근이 정상이 될 때까지 문장을 둔다. 코드가 없어 글자로 가른다 */
const FUTURE_REJECTION = "아직 오지 않은 시각";
const TONE = {
  warn: "bg-[#fff6e5] text-[#956013]",
  risk: "bg-erp-off-bg text-erp-off",
  info: "bg-erp-on-bg text-erp-on",
};
const Mark = ({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) => (
  <span className={`inline-block rounded-[2px] px-[4px] py-px text-[14px] font-medium whitespace-nowrap ${TONE[tone]}`}>{children}</span>
);
const Sub = ({ children }: { children: ReactNode }) => <span className="text-erp-label">{children}</span>;
const PAYSLIP_WARNING = "이 날짜는 급여명세서가 확정된 기간입니다. 고치면 급여에 영향이 갈 수 있습니다.";

/** 짝마다 한 줄 — 하루에 출근이 여러 번이면 출근 · 퇴근 칸의 같은 높이가 한 짝이다(일별 출퇴근과 같은 모양) */
const Times = ({ times }: { times: string[] }) =>
  times.length ? (
    <span className="inline-flex flex-col leading-[1.4]">
      {times.map((t, i) => (
        <span key={i}>{t}</span>
      ))}
    </span>
  ) : (
    "-"
  );
const punchesOf = (r: FixRow) => r.pairs.flatMap((p) => [p.checkIn, p.checkOut]);
const hasReason = (r: FixRow) => punchesOf(r).some((p) => p?.reviewReason);
const wasEdited = (r: FixRow) => punchesOf(r).some((p) => p && (p.isCorrected || p.entryMethod === "PROXY"));
/** 짝 하나를 가리키는 기록 ID — 출근, 없으면 퇴근 */
const anchorOf = (pair: FixRow["pairs"][number]) => (pair.checkIn ?? pair.checkOut)!.attendanceRecordId;

/**
 * 기록 보정 패널 · 보정 이력 창 제목 아래 대상 — 둥근 머리 정보 상자(8px · #c9d1de, 상세 화면 요약 띠와 같은 테두리) 안에 근무지 · 직원 · 날짜를 한 줄씩,
 * 줄 사이 선 없이 이름(13px 회색 · 56px) · 값(14px 먹색 500). 근무지는 점포 유형 꼬리표를 붙인다(2026-11-20 사용자 지정 — 전엔 제목 옆 회색 띠지
 * 「김알바 · 11-18」라 무엇의 이름 · 날짜인지 이름표가 없었다)
 */
function RecordTarget({ row }: { row: Pick<FixRow, "name" | "date" | "storeId" | "storeName" | "storeIsHq"> }) {
  const rows: [string, ReactNode][] = [
    ["근무지", <StoreNameWithType key="store" storeId={row.storeId} name={row.storeName} isHq={row.storeIsHq} />],
    ["직원", row.name],
    ["날짜", fullDay(row.date)],
  ];
  return (
    <dl className="flex flex-col gap-[6px] rounded-[8px] border border-[#c9d1de] bg-white px-[16px] py-[12px] text-[14px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex min-w-0 items-center gap-[12px]">
          <dt className="w-[56px] shrink-0 text-[13px] font-medium text-erp-label">{label}</dt>
          <dd className="min-w-0 font-medium text-erp-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 「2026-11-18(수)」 — 보정 패널 · 보정 이력 날짜 */
function fullDay(day: string): string {
  return `${day}(${"일월화수목금토"[new Date(`${day}T00:00:00Z`).getUTCDay()]})`;
}

/** 「이상 없음」 확인창 앞머리 — 그 줄의 확인 필요 사유 이름을 「'근무 12시간 초과' 」처럼(여럿이면 쉼표). 없으면 빈 글자 */
function reasonText(r: FixRow, reasonLabels: EnumValue[]): string {
  const names = [...new Set(punchesOf(r).flatMap((p) => (p?.reviewReason ? [labelOf(reasonLabels, p.reviewReason)] : [])))];
  return names.length ? `${names.map((n) => `'${n}'`).join(", ")} ` : "";
}

function tagsOf(r: FixRow, reasonLabels: EnumValue[], statusLabels: EnumValue[]): ReactNode[] {
  const tags: ReactNode[] = [];
  // 근무스케줄이 있는데 출근하지 않은 날 — 출근 · 퇴근 · 사유가 모두 비어 왜 경고 대상인지 알 수 없어 상태를 붙인다(급여명세서에서 연 기간 기록 전체, WHALEERP-664 리뷰)
  if (r.status === "ABSENT") tags.push(<Mark key="absent" tone="risk">{labelOf(statusLabels, "ABSENT")}</Mark>);
  if (r.status === "MISSING_CHECK_OUT") tags.push(<Mark key="out" tone="warn">퇴근 미등록</Mark>);
  if (r.status === "MISSING_CHECK_IN") tags.push(<Mark key="in" tone="warn">출근 미등록</Mark>);
  for (const reason of new Set(punchesOf(r).flatMap((p) => (p?.reviewReason ? [p.reviewReason] : []))))
    tags.push(
      <Mark key={reason} tone="risk">
        {labelOf(reasonLabels, reason)}
      </Mark>,
    );
  // 데모: 「수정됨 08-30 정하윤」 · 「대신 등록 위치 수집 일시 중지 · 정하윤」 — 꼬리는 가장 최근 그 이력
  const tail = (kind: "CORRECTION" | "PROXY") => {
    const text = editTail(r.edits, kind);
    return text && <Sub key={`${kind}-tail`}>{text}</Sub>;
  };
  if (punchesOf(r).some((p) => p?.isCorrected))
    tags.push(
      <Mark key="fixed" tone="info">
        수정됨
      </Mark>,
      tail("CORRECTION"),
    );
  if (punchesOf(r).some((p) => p?.entryMethod === "PROXY"))
    tags.push(
      <Mark key="proxy" tone="info">
        대신 등록
      </Mark>,
      tail("PROXY"),
    );
  return tags;
}

/** 보정 패널이 고칠 줄 — 일별 출퇴근 줄(DayRow)도 같은 패널을 쓴다(보정 이력 edits 는 보지 않는다) */
type Fix = { row: DayRow; pairIndex: number };

/** 보정 · 이상 없음 · 대신 등록 결과 알림 — 성공이면 토스트(확정된 급여 기간이면 경고를 덧붙여)와 새로 받기, 실패면 문장 토스트와 새로 받기 */
function useEditDone() {
  const router = useRouter();
  const toast = useToast();
  return (result: EditResult, ok: string) => {
    if (result.ok) {
      toast(result.isPayslipConfirmed ? `${ok} ${PAYSLIP_WARNING}` : ok);
      router.refresh();
      return true;
    }
    toast(result.message);
    router.refresh();
    return false;
  };
}

export function FixList({
  rows,
  reasonLabels,
  statusLabels,
  editableFrom,
  empty = "보정이 필요한 출·퇴근 기록이 없습니다.",
}: {
  rows: FixRow[];
  reasonLabels: EnumValue[];
  /** 결근 꼬리표 이름(GET /enums AttendanceDayStatus) */
  statusLabels: EnumValue[];
  editableFrom: string;
  /** 비었을 때 문구 — 급여명세서에서 와 기간 기록을 모두 보일 때는 다르게 */
  empty?: string;
}) {
  const toast = useToast();
  const permission = usePagePermission();
  const [busy, startTransition] = useTransition();
  const getAttendanceHistory = useAction(getAttendanceHistoryAction, { overlay: false });
  const reviewAttendance = useAction(reviewAttendanceAction, { overlay: false });
  const [fix, setFix] = useState<Fix | null>(null);
  const [round, setRound] = useState(0);
  const [reviewing, setReviewing] = useState<FixRow | null>(null);
  const [history, setHistory] = useState<{ row: FixRow; data: AttendanceHistory | null } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const manyStores = new Set(rows.map((r) => r.storeId)).size > 1;

  const done = useEditDone();
  const openFix = (row: FixRow) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFix({ row, pairIndex: fixPairIndex(row) });
    setRound((n) => n + 1);
  };
  const openHistory = (row: FixRow) =>
    startTransition(async () => {
      setHistory({ row, data: null });
      const ids = [...new Set(row.pairs.map(anchorOf))];
      const parts = await Promise.all(ids.map((id) => getAttendanceHistory(id)));
      const failed = parts.find((p) => !p.ok);
      if (failed && !failed.ok) {
        setHistory(null);
        return toast(failed.message);
      }
      const items = parts.flatMap((p) => (p.ok ? p.history.items : [])).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      setHistory({ row, data: { items } });
    });

  const columns: Column<FixRow>[] = [
    {
      header: "직원",
      width: "w-[140px]",
      cell: (r) =>
        manyStores ? (
          <>
            {r.name} <Sub>{storeOptionLabel({ name: r.storeName, isHq: r.storeIsHq })}</Sub>
          </>
        ) : (
          r.name
        ),
    },
    { header: "날짜", width: "w-[80px]", cell: (r) => shortDay(r.date) },
    { header: "출근", width: "w-[80px]", cell: (r) => <Times times={r.pairs.map((p) => p.checkIn?.time ?? "-")} /> },
    { header: "퇴근", width: "w-[80px]", cell: (r) => <Times times={r.pairs.map((p) => p.checkOut?.time ?? "-")} /> },
    { header: "사유", align: "left", cell: (r) => <span className="flex flex-wrap items-center gap-[4px]">{tagsOf(r, reasonLabels, statusLabels)}</span> },
    {
      header: "",
      width: "w-[260px]",
      cell: (r) => {
        const editable = r.date >= editableFrom && permission.update && r.pairs.length > 0;
        return (
          // 줄 안 동작은 26px 작은 버튼(RowButton) · 칸 오른쪽 끝 — 34px 회색 버튼 셋은 칸을 넘쳐 [이력]이 잘렸고 줄 안에서 무거웠다. 주 동작
          // [보정]만 회청 바탕, [이상 없음 처리] · [보정 이력]은 테두리. 셋이 다 서는 줄(약 236px)이 칸 안(260 − 여백 20)에 들어간다. 오른쪽 끝에 맞춰 줄마다 버튼 수가 달라도 끝선이 같다(2026-11-20 사용자 지정)
          <span className="flex justify-end gap-[6px] pr-[8px]">
            {editable && (
              <RowButton variant="primary" onClick={() => openFix(r)}>
                보정
              </RowButton>
            )}
            {hasReason(r) && editable && <RowButton onClick={() => setReviewing(r)}>이상 없음 처리</RowButton>}
            {wasEdited(r) && (
              // 버튼 이름 · 팝업 제목을 「보정 이력」으로 맞춘다 — 관리자가 한 보정 · 대신 등록이 쌓인다(2026-11-20 사용자 지정, 전엔 [이력] · 「… 출퇴근 기록 이력」)
              <RowButton onClick={() => openHistory(r)} disabled={busy}>
                보정 이력
              </RowButton>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      {/* 비었을 때 열 이름 줄은 두고 그 아래 빈 칸이 본문 남는 높이를 채운다 — 기간이 늘 걸려 있어 문구는 하나다(직원 · 점포 목록과 같다, 2026-11-04 사용자 지정) */}
      <BackdropInert>
        <DataTable columns={columns} rows={rows} rowKey={(r) => `${r.staffMemberId}-${r.date}`} empty={empty} fillEmpty />
      </BackdropInert>
      {/* BP 마스터 등록처럼 바탕을 어둡게 깔고, 바탕을 누르면 닫는다(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <SlidePanel id="attendance-fix" open={fix !== null} onClose={() => setFix(null)} label="출퇴근 기록 보정" trigger={trigger} closeOnBackdrop>
        {fix && (
          <FixForm
            // 고칠 기록(짝)을 바꾸면 입력칸을 그 짝 값으로 새로 채운다
            key={`${round}-${fix.pairIndex}`}
            fix={fix}
            onPick={(pairIndex) => setFix({ ...fix, pairIndex })}
            onClose={() => setFix(null)}
            onDone={(result) => {
              if (done(result, "보정했습니다.")) setFix(null);
            }}
          />
        )}
      </SlidePanel>
      <ConfirmDialog
        open={reviewing !== null}
        // 문구는 사용자 지정(2026-11-20) — 전엔 「확인 필요 꼬리표와 사유를 지웁니다. 기록 값은 바뀌지 않습니다.」로 개발 용어였다
        title="출퇴근 기록을 '이상 없음'으로 처리하시겠습니까?"
        confirmLabel="이상 없음 처리"
        busy={busy}
        onCancel={() => setReviewing(null)}
        onConfirm={() =>
          startTransition(async () => {
            const row = reviewing!;
            const targets = row.pairs.filter((p) => p.checkIn?.reviewReason || p.checkOut?.reviewReason).map(anchorOf);
            let last: EditResult = { ok: true, isPayslipConfirmed: false };
            for (const id of targets) {
              last = await reviewAttendance(id);
              if (!last.ok) break;
            }
            setReviewing(null);
            done(last, "검토를 마쳤습니다.");
          })
        }
      >
        {reviewing && reasonText(reviewing, reasonLabels)}확인 필요 사유가 해제되며, 보정이 필요한 기록 목록에서 제외됩니다. 출퇴근 시각은 변경되지 않습니다.
        {reviewing?.isPayslipConfirmed && <PayslipWarning />}
      </ConfirmDialog>
      <ConfirmDialog
        open={history !== null}
        title="보정 이력"
        confirmLabel="닫기"
        cancelLabel={null}
        wide
        onCancel={() => setHistory(null)}
        onConfirm={() => setHistory(null)}
      >
        {/* 어느 직원 · 날짜 · 근무지의 이력인지 제목 아래 한 줄로 — 기록 보정 패널과 같다(2026-11-20 사용자 지정, 전엔 제목에 「김알바 · 11-18」) */}
        {history && (
          <div className="mb-[12px]">
            <RecordTarget row={history.row} />
          </div>
        )}
        {!history?.data ? (
          <Sub>불러오는 중입니다…</Sub>
        ) : history.data.items.length === 0 ? (
          <Sub>보정 이력이 없습니다.</Sub>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {history.data.items.map((h, i) => (
              <DetailTable
                key={i}
                // 표 제목은 「구분 · 일시」 — 표마다 「이력」으로 같아 어느 것이 어느 것인지 갈리지 않았다(2026-11-20 사용자 지정)
                title={`${h.kind === "CORRECTION" ? "보정" : "대신 등록"} · ${new Date(h.at).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16)}`}
                rows={[
                  { label: "처리한 사람", value: byLabel(h) },
                  ...(h.before ? [{ label: "변경 전", value: h.before }] : []),
                  { label: h.kind === "CORRECTION" ? "변경 후" : "등록한 값", value: h.after },
                  { label: "사유", value: h.reason },
                ]}
              />
            ))}
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}

const DayFixContext = createContext<((row: DayRow) => void) | null>(null);

/**
 * 일별 출퇴근 표의 「보정」이 여는 패널(WHALEERP-687 — 정상 · 지각 기록은 「보정이 필요한 기록」에 나오지 않아 그 줄에서 고친다). 패널은 바탕이
 * 막히는(BackdropInert) 표 밖에 하나만 둔다 — 감싼 본문(children)만 막히고 패널은 쓸 수 있게.
 */
export function DayFixProvider({ children }: { children: ReactNode }) {
  const done = useEditDone();
  const [fix, setFix] = useState<Fix | null>(null);
  const [round, setRound] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  const open = useCallback((row: DayRow) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFix({ row, pairIndex: fixPairIndex(row) });
    setRound((n) => n + 1);
  }, []);
  return (
    <DayFixContext value={open}>
      {children}
      <SlidePanel id="attendance-day-fix" open={fix !== null} onClose={() => setFix(null)} label="출퇴근 기록 보정" trigger={trigger} closeOnBackdrop>
        {fix && (
          <FixForm
            key={`${round}-${fix.pairIndex}`}
            fix={fix}
            onPick={(pairIndex) => setFix({ ...fix, pairIndex })}
            onClose={() => setFix(null)}
            onDone={(result) => {
              if (done(result, "보정했습니다.")) setFix(null);
            }}
          />
        )}
      </SlidePanel>
    </DayFixContext>
  );
}

/** 일별 출퇴근 줄의 「보정」 — 기록이 있고 최근 3개월이며 수정 권한이 있을 때(보정이 필요한 기록과 같은 조건) */
export function DayFixButton({ row, editableFrom }: { row: DayRow; editableFrom: string }) {
  const open = use(DayFixContext);
  const permission = usePagePermission();
  if (!open || !permission.update || row.date < editableFrom || row.pairs.length === 0) return null;
  // 보정이 필요한 기록 줄과 같은 작은 버튼(2026-11-20 사용자 지정)
  return (
    <RowButton variant="primary" onClick={() => open(row)}>
      보정
    </RowButton>
  );
}

// 기록 보정 패널(데모 fixForm): 출근 · 퇴근(원본 시각을 옆에) · 수정 사유(필수). 짝이 여럿인 날은 고를 짝을 먼저 고른다.
function FixForm({ fix, onPick, onClose, onDone }: { fix: Fix; onPick: (i: number) => void; onClose: () => void; onDone: (r: EditResult) => void }) {
  const correctAttendance = useAction(correctAttendanceAction, { overlay: false });
  const pair = fix.row.pairs[fix.pairIndex];
  const [checkIn, setCheckIn] = useState(pair.checkIn?.time ?? "");
  // 퇴근 미등록 줄만 근무스케줄 종료 시각으로 채워 둔다(데모 「근무스케줄 종료 시각으로 보정」) — 오늘 근무 중인 줄에 미래 퇴근을 넣지 않게
  const [checkOut, setCheckOut] = useState(pair.checkOut?.time ?? (fix.row.status === "MISSING_CHECK_OUT" ? (fix.row.schedules[0]?.endTime ?? "") : ""));
  // 퇴근 날 — 출근이 있는 짝은 「다음 날 퇴근」을 api 에 보낸다(24시간 넘는 짝은 시각만으로 날을 알 수 없다, PR #159 리뷰)
  const [nextDay, setNextDay] = useState(initialNextDay(fix.row.date, pair.checkOut));
  const forced = forcedNextDay(checkIn, checkOut);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 지난 거절이 미래 시각 때문이었나 — 그렇다면 출퇴근이 정상이 될 때까지 문장을 둔다(사유 등 다른 칸을 고쳐도 남긴다, 2026-11-05 사용자 지정)
  const [futureRejected, setFutureRejected] = useState(false);
  const future = hasFutureTime(fixPoints(fix.row.date, !!pair.checkIn, checkIn, checkOut, nextDay));
  // 칸을 고치면 지난 거절 문장을 내린다 — 미래 시각 거절이면 고친 값이 더는 미래가 아닐 때만(그 밖의 거절은 바로)
  const clearRejection = (points: [string, string][]) => {
    if (futureRejected && hasFutureTime(points)) return;
    setError(null);
    setFutureRejected(false);
  };
  const [errors, setErrors] = useState<FieldErrors>({});
  const ids = useId();
  const [busy, startTransition] = useTransition();

  const save = () => {
    // 저장할 때 칸마다 검사해 그 칸 아래에 알린다(화면 설계 공통 기준 1번, WHALEERP-633)
    const next = pickErrors({
      checkIn: checkIn && !TIME.test(checkIn) ? "출근 시각을 시 · 분까지 입력해 주세요." : pair.checkIn && !checkIn ? "출근 시각을 입력해 주세요." : undefined,
      checkOut: checkOut && !TIME.test(checkOut) ? "퇴근 시각을 시 · 분까지 입력해 주세요." : pair.checkOut && !checkOut ? "퇴근 시각을 입력해 주세요." : undefined,
      reason: reason.trim() ? undefined : "보정 사유를 입력해 주세요.",
    });
    setErrors(next);
    setError(null);
    if (Object.keys(next).length > 0) return focusFirstError(ids);
    startTransition(async () => {
      const result = await correctAttendance(anchorOf(pair), {
        ...(checkIn ? { checkInTime: checkIn } : {}),
        ...(checkOut ? { checkOutTime: checkOut } : {}),
        ...(pair.checkIn && checkOut ? { checkOutNextDay: forced || nextDay } : {}),
        reason: reason.trim(),
        ...(pair.checkIn ? { expectedCheckInAt: pair.checkIn.recordedAt } : {}),
        ...(pair.checkOut ? { expectedCheckOutAt: pair.checkOut.recordedAt } : {}),
      });
      if (!result.ok && result.code !== "ATTENDANCE_CHANGED" && result.status !== undefined && result.status < 500) {
        setFutureRejected(future && result.message.includes(FUTURE_REJECTION));
        return setError(result.message);
      }
      onDone(result);
    });
  };

  return (
    <div id={ids} className="contents">
      {/* 패널(SlidePanel)이 이미 안쪽 24px · 칸 사이 16px 를 준다 — 여기서 또 주면 BP 마스터 등록보다 칸이 좁고 사이가 벌어졌다(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      {/* 제목 아래 근무지 · 직원 · 날짜 한 줄씩(RecordTarget) — 제목 옆 회색 띠지(「김알바 · 11-18」)는 무엇의 이름 · 날짜인지 이름표가 없었다(2026-11-20 사용자 지정) */}
      <div className="flex flex-col gap-[8px]">
        <h2 className="text-[18px] font-semibold text-erp-ink">출퇴근 기록 보정</h2>
        <RecordTarget row={fix.row} />
      </div>
      {fix.row.isPayslipConfirmed && <PayslipWarning />}
      {/* 「보정할 기록」도 「출퇴근 기록」과 같은 묶음 제목(FormGroup, 15px 600) — 칸 이름(14px 회색)이면 두 제목의 크기 · 굵기가 섞여 보였다(2026-11-20 사용자 지정).
          예전엔 Field 를 패널에 바로 둬 세로로 늘어나 위아래가 크게 벌어졌다 */}
      {fix.row.pairs.length > 1 && (
        <FormGroup title="보정할 기록">
          <Select aria-label="보정할 기록" value={fix.pairIndex} onChange={(e) => onPick(Number(e.target.value))}>
            {fix.row.pairs.map((p, i) => (
              <option key={i} value={i}>
                출근 {p.checkIn?.time ?? "없음"} · 퇴근 {p.checkOut ? p.checkOut.time + laterDayMark(fix.row.date, p.checkOut.recordedAt) : "없음"}
              </option>
            ))}
          </Select>
        </FormGroup>
      )}
      <FormGroup title="출퇴근 기록">
        <MessageRow>
          <HelpField label="출근" help={`보정 전 ${pair.checkIn?.time ?? "없음"}`} message={<FieldMessage id={`${ids}-checkIn`} message={errors.checkIn} />}>
            <TextField
              type="time"
              aria-label="출근"
              value={checkIn}
              {...invalidProps(ids, errors, "checkIn")}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setErrors((x) => clearError(x, "checkIn"));
                clearRejection(fixPoints(fix.row.date, !!pair.checkIn, e.target.value, checkOut, nextDay));
              }}
            />
          </HelpField>
          <HelpField
            label="퇴근"
            help={`보정 전 ${pair.checkOut ? pair.checkOut.time + laterDayMark(fix.row.date, pair.checkOut.recordedAt) : "없음"}`}
            message={<FieldMessage id={`${ids}-checkOut`} message={errors.checkOut} />}
          >
            <TextField
              type="time"
              aria-label="퇴근"
              value={checkOut}
              {...invalidProps(ids, errors, "checkOut")}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setErrors((x) => clearError(x, "checkOut"));
                clearRejection(fixPoints(fix.row.date, !!pair.checkIn, checkIn, e.target.value, nextDay));
              }}
            />
          </HelpField>
        </MessageRow>
        {pair.checkIn && checkOut && (
          <Checkbox label="다음 날 퇴근" checked={forced || nextDay} disabled={forced} onChange={(e) => {
              setNextDay(e.target.checked);
              clearRejection(fixPoints(fix.row.date, !!pair.checkIn, checkIn, checkOut, e.target.checked));
            }} />
        )}
        <SaveNote note={fixSaveNote(fix.row.date, !!pair.checkIn, checkIn, checkOut, nextDay)} />
        <MessageField label="보정 사유" required message={<FieldMessage id={`${ids}-reason`} message={errors.reason} />}>
          <Textarea
            aria-label="보정 사유"
            rows={2}
            maxLength={500}
            value={reason}
            {...invalidProps(ids, errors, "reason")}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((x) => clearError(x, "reason"));
            }}
            placeholder="예: 퇴근 등록 누락 · 근무스케줄 종료 시각으로 보정. 점장 구두 확인."
          />
        </MessageField>
      </FormGroup>
      {/* 「다음 날 퇴근」 체크는 출근이 있는 짝에만 선다 — 출근 미등록 줄은 출근을 전날로 저장한다(위 안내).
          안내는 묶음 상자 밖 아래 14px · 줄간 1.6 — BP 마스터 등록 패널의 안내와 같다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 상자 안 13px) */}
      <GuideBand
        title="보정 안내"
        lines={[
          // 대신 등록 안내와 같은 순서 · 말투 — 기간 · 직원 앱 표시 · 보정 결과, 끝에 시각 처리(2026-11-05 사용자 지정, 3팀 확인 필요)
          "최근 3개월 이내의 기록만 보정할 수 있으며, 미래 시각은 등록할 수 없습니다.",
          "관리자가 보정한 기록은 직원 근무 앱에 연필 아이콘으로 표시됩니다.",
          "보정한 기록의 확인 필요 사유가 해제됩니다.",
          ...(pair.checkIn
            ? ["퇴근 시각이 출근 시각과 같거나 이전인 경우, 다음 날 퇴근한 것으로 처리됩니다.", "그 외에 다음 날 퇴근한 경우, 관리자가 「다음 날 퇴근」을 체크합니다."]
            : ["출근 시각이 퇴근 시각과 같거나 이후인 경우, 전날 출근한 것으로 처리됩니다."]),
        ]}
      />
      {error && (
        <p role="alert" className="text-[14px] text-erp-off">
          {error}
        </p>
      )}
      {/* [취소] [저장]은 패널 가운데 — 1팀 등록 · 수정 패널과 같다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 오른쪽 끝, 버튼 이름은 「보정 저장」) */}
      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button onClick={save} disabled={busy}>
          저장
        </Button>
      </div>
    </div>
  );
}

// 출퇴근 대신 등록(데모 proxyForm, 운영 정책 ATT-20 · 26): 직원 · 날짜 · 출근 · 퇴근 · 사유(필수). 직원 선택지는 그날 체결 완료 계약이 있는
// 직원(STAFF-29) — 대신 등록 대상이 아닌 직원(api `isProxy` false)은 기록 없는 날을 보정으로 채운다(2026-10-26). 등록 권한이 없으면 버튼을 두지 않는다.
export function ProxyButton({ stores, today, editableFrom }: { stores: string; today: string; editableFrom: string }) {
  const router = useRouter();
  const toast = useToast();
  const permission = usePagePermission();
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  if (!permission.create) return null;
  return (
    <>
      <BackdropInert>
        <Button
          ref={trigger}
          variant="soft"
          onClick={() => {
            setOpen(true);
            setRound((n) => n + 1);
          }}
        >
          출퇴근 대신 등록
        </Button>
      </BackdropInert>
      {/* 기록 보정 패널과 같이 바탕을 깔고 바탕 클릭으로 닫는다(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <SlidePanel id="attendance-proxy" open={open} onClose={() => setOpen(false)} label="출퇴근 대신 등록" trigger={trigger} closeOnBackdrop>
        {open && (
          <ProxyForm
            key={round}
            stores={stores}
            today={today}
            editableFrom={editableFrom}
            onClose={() => setOpen(false)}
            onDone={(result) => {
              if (result.ok) {
                const done = result.isProxy ? "대신 등록했습니다." : "보정했습니다.";
                toast(result.isPayslipConfirmed ? `${done} ${PAYSLIP_WARNING}` : done);
                setOpen(false);
              } else toast(result.message); // 결과를 모르는 실패(5xx · 연결) — 새로 불러온 목록으로 확인하게 알린다
              router.refresh();
            }}
          />
        )}
      </SlidePanel>
    </>
  );
}

function ProxyForm({ stores, today, editableFrom, onClose, onDone }: { stores: string; today: string; editableFrom: string; onClose: () => void; onDone: (r: EditResult & { isProxy: boolean }) => void }) {
  const getProxyStaff = useAction(getProxyStaffAction, { overlay: false });
  const proxyAttendance = useAction(proxyAttendanceAction, { overlay: false });
  const [date, setDate] = useState(today);
  const [staff, setStaff] = useState<ProxyStaff[] | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 지난 거절이 미래 시각 때문이었나 — 출퇴근이 정상이 될 때까지 문장을 둔다(기록 보정과 같다)
  const [futureRejected, setFutureRejected] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  // 직원 목록을 받지 못한 까닭 — 저장 때 지우지 않는다(지우면 직원 칸을 왜 고를 수 없는지 사라진다). 날짜를 다시 고르면 내린다
  const [listError, setListError] = useState<string | null>(null);
  const ids = useId();
  const [busy, startTransition] = useTransition();
  // 직원 선택지는 그날 기준이다 — 날짜를 바꿀 때마다 다시 받고, 늦게 온 앞 날짜 응답은 버린다
  const wanted = useRef(today);
  const loadStaff = useCallback(
    (day: string) => {
      wanted.current = day;
      getProxyStaff(stores, day)
        .then((result) => {
          if (wanted.current !== day) return;
          if (!result.ok) {
            setStaffId(null);
            return setListError(result.message);
          }
          setStaff(result.staff);
          // 고른 직원이 새 날짜의 선택지에도 있으면 그대로 둔다 — 칸 순서가 직원 → 날짜라 날짜를 고칠 때마다 다시 골라야 했다(통합테스트 IT-ATT-003, 2026-11-13). 없으면 비운다
          setStaffId((id) => (id !== null && result.staff.some((s) => s.staffMemberId === id) ? id : null));
        })
        .catch(() => {
          // 서버 액션 호출 자체가 실패(연결 끊김 등) — 선택지를 비우고 알린다. 날짜를 다시 고르면 다시 받는다
          if (wanted.current !== day) return;
          setStaff([]);
          setStaffId(null);
          setListError("직원 목록을 불러오지 못했습니다. 날짜를 다시 선택해 주세요.");
        });
    },
    [stores, getProxyStaff],
  );
  useEffect(() => loadStaff(today), [loadStaff, today]);
  const changeDate = (day: string) => {
    setDate(day);
    setStaff(null);
    setError(null);
    setFutureRejected(false);
    setListError(null);
    // 직원이 비면 퇴근 필수 여부(보정 대상)도 바뀐다 — 퇴근 문구도 함께 내린다
    setErrors((x) => clearError(clearError(x, "staff"), "checkOut"));
    loadStaff(day);
  };
  const manyStores = new Set((staff ?? []).map((s) => s.storeId)).size > 1;
  // 위치정보에 동의한 직원은 대신 등록이 아니라 기록 없는 날을 보정으로 채운다 — 출근 · 퇴근을 함께 받는다(2026-10-26 재영)
  const picked = staff?.find((s) => s.staffMemberId === staffId);
  const isProxy = picked?.isProxy ?? true;
  // 받는 동안 저장해 뜬 「직원을 선택해 주세요.」는 목록이 와서 고른 직원이 그대로 남으면 보이지 않는다(DESIGN.md 「오류 문구 내리기」, PR #275 리뷰)
  const shownErrors = picked ? clearError(errors, "staff") : errors;

  const future = hasFutureTime(proxyPoints(date, checkIn, checkOut));
  // 칸을 고치면 지난 거절 문장을 내린다 — 미래 시각 거절이면 고친 값이 더는 미래가 아닐 때만(그 밖의 거절은 바로)
  const clearRejection = (points: [string, string][]) => {
    if (futureRejected && hasFutureTime(points)) return;
    setError(null);
    setFutureRejected(false);
  };
  const save = () => {
    // 저장할 때 칸마다 검사해 그 칸 아래에 알린다(화면 설계 공통 기준 1번, WHALEERP-633)
    const next = pickErrors({
      // 날짜를 바꿔 선택지를 다시 받는 동안은(picked 없음) 고른 직원이 남아 있어도 저장하지 않는다 — 보정 대상 여부(퇴근 필수)를 아직 모른다
      staff: staffId === null || !picked ? "직원을 선택해 주세요." : undefined,
      checkIn: TIME.test(checkIn) ? undefined : "출근 시각을 입력해 주세요.",
      checkOut: !isProxy && !checkOut ? "퇴근 시각을 입력해 주세요." : checkOut && !TIME.test(checkOut) ? "퇴근 시각을 시 · 분까지 입력해 주세요." : undefined,
      reason: reason.trim() ? undefined : "사유를 입력해 주세요.",
    });
    setErrors(next);
    setError(null);
    // staffId === null 은 next.staff 와 같다 — 아래 호출에 number 로 좁히려고 둔다
    if (staffId === null || !picked || Object.keys(next).length > 0) return focusFirstError(ids);
    startTransition(async () => {
      const result = await proxyAttendance({ staffMemberId: staffId, date, checkInTime: checkIn, ...(checkOut ? { checkOutTime: checkOut } : {}), reason: reason.trim() });
      if (!result.ok && result.status !== undefined && result.status < 500) {
        setFutureRejected(future && result.message.includes(FUTURE_REJECTION));
        return setError(result.message);
      }
      onDone({ ...result, isProxy });
    });
  };

  return (
    <div id={ids} className="contents">
      {/* 패널(SlidePanel)이 이미 안쪽 24px · 칸 사이 16px 를 준다 — 여기서 또 주면 BP 마스터 등록보다 칸이 좁고 사이가 벌어졌다(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <h2 className="text-[18px] font-semibold text-erp-ink">출퇴근 대신 등록</h2>
      <FormGroup title="출퇴근 기록">
        <MessageRow>
          <MessageField label="직원" required message={<FieldMessage id={`${ids}-staff`} message={shownErrors.staff} />}>
            <Select
              aria-label="직원"
              value={staffId ?? ""}
              {...invalidProps(ids, shownErrors, "staff")}
              onChange={(e) => {
                setStaffId(e.target.value ? Number(e.target.value) : null);
                // 직원이 바뀌면 퇴근 필수 여부(보정 대상)도 바뀐다 — 퇴근 문구도 함께 내린다
                setErrors((x) => clearError(clearError(x, "staff"), "checkOut"));
                setError(null); // 직원이 바뀌면 지난 거절(계약 기간 · 그날 기록 등)은 맞지 않는다
                setFutureRejected(false);
              }}
              disabled={!staff}
            >
              {/* 다른 선택칸과 같이 「선택」, 불러오는 동안만 「불러오는 중…」(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「직원 선택」 · 「등록할 수 있는 직원 없음」) */}
              <option value="">{staff === null ? "불러오는 중…" : "선택"}</option>
              {(staff ?? []).map((s) => (
                <option key={s.staffMemberId} value={s.staffMemberId}>
                  {manyStores ? `${s.name} · ${storeOptionLabel({ name: s.storeName, isHq: s.storeIsHq })}` : s.name}
                  {s.isProxy ? "" : " (보정)"}
                </option>
              ))}
            </Select>
          </MessageField>
        </MessageRow>
        {/* 날짜는 직원 아래 줄 — 직원 칸을 패널 폭만큼 넓혀야 「이름 · 점포 (보정)」 선택지가 칸 밖으로 넘치지 않는다(기본 선택칸 목록은 가장 긴 선택지 폭으로 펼쳐진다, 2026-11-05 사용자 지적, 3팀 확인 필요) */}
        <MessageRow>
          <Field label="날짜" required>
            <TextField type="date" aria-label="날짜" min={editableFrom} max={today} value={date} onChange={(e) => e.target.value && changeDate(e.target.value)} />
          </Field>
        </MessageRow>
        <MessageRow>
          <MessageField label="출근" required message={<FieldMessage id={`${ids}-checkIn`} message={errors.checkIn} />}>
            <TextField
              type="time"
              aria-label="출근"
              value={checkIn}
              {...invalidProps(ids, errors, "checkIn")}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setErrors((x) => clearError(x, "checkIn"));
                clearRejection(proxyPoints(date, e.target.value, checkOut));
              }}
            />
          </MessageField>
          <MessageField label="퇴근" required={!isProxy} message={<FieldMessage id={`${ids}-checkOut`} message={errors.checkOut} />}>
            <TextField
              type="time"
              aria-label="퇴근"
              value={checkOut}
              {...invalidProps(ids, errors, "checkOut")}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setErrors((x) => clearError(x, "checkOut"));
                clearRejection(proxyPoints(date, checkIn, e.target.value));
              }}
            />
          </MessageField>
        </MessageRow>
        <OvernightNote date={date} checkIn={checkIn} checkOut={checkOut} />
        {picked?.isPayslipConfirmed && <PayslipWarning />}
        <MessageField label="사유" required message={<FieldMessage id={`${ids}-reason`} message={errors.reason} />}>
          <Textarea
            aria-label="사유"
            rows={2}
            maxLength={500}
            value={reason}
            {...invalidProps(ids, errors, "reason")}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((x) => clearError(x, "reason"));
            }}
            placeholder="예: 위치 수집 일시 중지 · 점장 확인"
          />
        </MessageField>
      </FormGroup>
      {/* 안내는 묶음 상자 밖 아래 14px · 줄간 1.6 — BP 마스터 등록 패널의 안내(Note)와 같다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 상자 안 13px) */}
      <GuideBand
        title="대신 등록 안내"
        lines={[
          "위치정보 수집에 동의하지 않았거나 수집을 중지한 직원의 출·퇴근 기록은 관리자가 대신 등록합니다.",
          "최근 3개월 이내의 기록만 등록할 수 있으며, 미래 시각은 등록할 수 없습니다.",
          "관리자가 대신 등록한 기록은 직원 근무 앱에 연필 아이콘으로 표시됩니다.",
          "퇴근 시각이 출근 시각과 같거나 이전인 경우, 다음 날 퇴근한 것으로 처리됩니다.",
        ]}
      />
      {[listError, error].map(
        (text, i) =>
          text && (
            <p key={i} role="alert" className="text-[14px] text-erp-off">
              {text}
            </p>
          ),
      )}
      {/* [취소] [저장]은 패널 가운데(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 오른쪽 끝, 버튼 이름은 대신 등록이면 「대신 등록」 · 보정이면 「보정」) */}
      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button onClick={save} disabled={busy}>
          저장
        </Button>
      </div>
    </div>
  );
}

/** 확정 · 발송된 급여명세서 기간이라는 경고 — 보정 · 이상 없음 · 대신 등록 모두 저장하기 전에 보인다(218) */
function PayslipWarning() {
  return <p className="rounded-[2px] bg-[#fff6e5] px-[12px] py-[10px] text-[14px] text-[#956013]">{PAYSLIP_WARNING}</p>;
}

/** 퇴근이 출근보다 이르거나 같으면 다음 날 퇴근으로 저장된다는 것을 실제 날짜로 알린다(api 와 같은 규칙) */
// 칸 오류(FieldMessage)와 같은 빨간 13px — 출근 날과 다른 날로 저장되는 것을 놓치지 않게(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 먹색 500). 막지는 않는다
function OvernightNote({ date, checkIn, checkOut }: { date: string; checkIn: string; checkOut: string }) {
  const note = overnightNote(date, checkIn, checkOut);
  return note && <p className="text-[13px] leading-[1.5] text-erp-off">{note}</p>;
}

/** 저장할 날 안내(보정 · 대신 등록) */
function SaveNote({ note }: { note: string | null }) {
  return note && <p className="text-[13px] font-medium text-erp-ink">{note}</p>;
}

/** 도움말이 칸 아래에 붙는 칸(데모 fieldH) — 기록 보정의 「보정 전 12:58」 */
function HelpField({ label, help, message, children }: { label: string; help: string; message: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[8px]">
      <Field label={label}>
        {children}
      </Field>
      {message}
      <span className="text-[12px] leading-[1.5] text-erp-muted">{help}</span>
    </div>
  );
}

// 보정 · 대신 등록 폼의 칸 오류(칸 이름 → 문구). api 가 돌려준 거절은 칸을 가를 수 없어 폼 아래 한 줄(error)로 둔다.
type FieldErrors = Partial<Record<"staff" | "checkIn" | "checkOut" | "reason", string>>;
const pickErrors = (all: FieldErrors): FieldErrors => Object.fromEntries(Object.entries(all).filter(([, m]) => m)) as FieldErrors;
const clearError = (errors: FieldErrors, key: keyof FieldErrors): FieldErrors => (errors[key] ? { ...errors, [key]: undefined } : errors);
const invalidProps = (ids: string, errors: FieldErrors, key: keyof FieldErrors) =>
  errors[key] ? { "aria-invalid": true, "aria-describedby": `${ids}-${key}` } : {};
/** 첫 오류 칸으로 커서를 옮긴다 — 슬라이드 패널이 길어 아래 칸 오류는 보이지 않을 수 있다. 직원 목록을 받는 중이라 잠긴 직원 칸은 건너뛴다 */
const focusFirstError = (ids: string) =>
  requestAnimationFrame(() => (document.getElementById(ids)?.querySelector('[aria-invalid="true"]:not(:disabled)') as HTMLElement | null)?.focus());

/** 입력칸 하나와 그 아래 오류 문구(bp-admins Labeled 와 같은 모양) */
function MessageField({ label, required, message, children }: { label: string; required?: boolean; message: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[8px]">
      <Field label={label} required={required}>
        {children}
      </Field>
      {message}
    </div>
  );
}

/** 칸을 나란히 두는 줄 — 위쪽 정렬이라 한 칸에만 오류 문구가 붙어도 두 입력칸이 같은 높이에 선다(FormRow 는 늘여 세워 옆 칸이 가운데로 내려간다) */
function MessageRow({ children }: { children: ReactNode }) {
  return <div className="flex w-full items-start gap-[6px]">{children}</div>;
}
