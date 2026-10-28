"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, Checkbox, ConfirmDialog, DataTable, DetailTable, Field, FormGroup, FormRow, Select, SlidePanel, TextField, Textarea, useToast, type Column } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { labelOf, type EnumValue } from "@/lib/enums";
import type { AttendanceHistory, ProxyStaff } from "@/lib/attendance-records-api";
import { correctAttendanceAction, getAttendanceHistoryAction, getProxyStaffAction, proxyAttendanceAction, reviewAttendanceAction, type EditResult } from "./actions";
import { byLabel, editTail, fixPairIndex, fixSaveNote, forcedNextDay, initialNextDay, laterDayMark, overnightNote, shortDay, type FixRow } from "./attendance-query";

// 보정이 필요한 기록의 표와 동작(데모 staff-sections.mjs fixList · fixForm · proxyForm · histDialog, WHALEERP-220). 확인 필요 · 미등록 줄에는
// 「보정」 · 「이상 없음」, 보정 · 대신 등록한 줄에는 「이력」. 보정 · 대신 등록은 오른쪽 패널, 「이상 없음」은 확인창, 이력은 창이다.
// 3개월이 지난 기록에는 보정 진입점을 두지 않는다(220). 수정 권한이 없으면 보정 · 이상 없음을, 등록 권한이 없으면 대신 등록을 두지 않는다.
// 급여명세서가 확정된 기간이면 보정 패널 · 이상 없음 확인창 · 대신 등록 패널(고른 직원 · 날짜)에 경고를 보이고, 저장 결과도 같은 경고를
// 토스트로 알린다(218 「급여에 영향이 갈 수 있다」).

const TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
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
const needsAction = (r: FixRow) => hasReason(r) || r.status === "MISSING_CHECK_OUT" || r.status === "MISSING_CHECK_IN";
const wasEdited = (r: FixRow) => punchesOf(r).some((p) => p && (p.isCorrected || p.entryMethod === "PROXY"));
/** 짝 하나를 가리키는 기록 ID — 출근, 없으면 퇴근 */
const anchorOf = (pair: FixRow["pairs"][number]) => (pair.checkIn ?? pair.checkOut)!.attendanceRecordId;

function tagsOf(r: FixRow, reasonLabels: EnumValue[]): ReactNode[] {
  const tags: ReactNode[] = [];
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

type Fix = { row: FixRow; pairIndex: number };

export function FixList({ rows, reasonLabels, editableFrom }: { rows: FixRow[]; reasonLabels: EnumValue[]; editableFrom: string }) {
  const router = useRouter();
  const toast = useToast();
  const permission = usePagePermission();
  const [busy, startTransition] = useTransition();
  const [fix, setFix] = useState<Fix | null>(null);
  const [round, setRound] = useState(0);
  const [reviewing, setReviewing] = useState<FixRow | null>(null);
  const [history, setHistory] = useState<{ row: FixRow; data: AttendanceHistory | null } | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const manyStores = new Set(rows.map((r) => r.storeId)).size > 1;

  const done = (result: EditResult, ok: string) => {
    if (result.ok) {
      toast(result.isPayslipConfirmed ? `${ok} ${PAYSLIP_WARNING}` : ok);
      router.refresh();
      return true;
    }
    toast(result.message);
    router.refresh();
    return false;
  };
  const openFix = (row: FixRow) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setFix({ row, pairIndex: fixPairIndex(row) });
    setRound((n) => n + 1);
  };
  const openHistory = (row: FixRow) =>
    startTransition(async () => {
      setHistory({ row, data: null });
      const ids = [...new Set(row.pairs.map(anchorOf))];
      const parts = await Promise.all(ids.map((id) => getAttendanceHistoryAction(id)));
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
            {r.name} <Sub>{r.storeName}</Sub>
          </>
        ) : (
          r.name
        ),
    },
    { header: "날짜", width: "w-[80px]", cell: (r) => shortDay(r.date) },
    { header: "출근", width: "w-[80px]", cell: (r) => <Times times={r.pairs.map((p) => p.checkIn?.time ?? "-")} /> },
    { header: "퇴근", width: "w-[80px]", cell: (r) => <Times times={r.pairs.map((p) => p.checkOut?.time ?? "-")} /> },
    { header: "사유", align: "left", cell: (r) => <span className="flex flex-wrap items-center gap-[4px]">{tagsOf(r, reasonLabels)}</span> },
    {
      header: "",
      width: "w-[230px]",
      cell: (r) => {
        const editable = r.date >= editableFrom && permission.update && r.pairs.length > 0;
        return (
          <span className="flex justify-center gap-[6px]">
            {needsAction(r) && editable && (
              <Button variant="off" onClick={() => openFix(r)}>
                보정
              </Button>
            )}
            {hasReason(r) && editable && (
              <Button variant="off" onClick={() => setReviewing(r)}>
                이상 없음
              </Button>
            )}
            {wasEdited(r) && (
              <Button variant="off" onClick={() => openHistory(r)} disabled={busy}>
                이력
              </Button>
            )}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} rows={rows} rowKey={(r) => `${r.staffMemberId}-${r.date}`} empty="이 기간에 보정이 필요한 기록이 없습니다." />
      <SlidePanel id="attendance-fix" open={fix !== null} onClose={() => setFix(null)} label="기록 보정" trigger={trigger}>
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
        title="이상 없음으로 검토를 마치시겠습니까?"
        confirmLabel="이상 없음"
        busy={busy}
        onCancel={() => setReviewing(null)}
        onConfirm={() =>
          startTransition(async () => {
            const row = reviewing!;
            const targets = row.pairs.filter((p) => p.checkIn?.reviewReason || p.checkOut?.reviewReason).map(anchorOf);
            let last: EditResult = { ok: true, isPayslipConfirmed: false };
            for (const id of targets) {
              last = await reviewAttendanceAction(id);
              if (!last.ok) break;
            }
            setReviewing(null);
            done(last, "검토를 마쳤습니다.");
          })
        }
      >
        확인 필요 꼬리표와 사유를 지웁니다. 기록 값은 바뀌지 않습니다.
        {reviewing?.isPayslipConfirmed && <PayslipWarning />}
      </ConfirmDialog>
      <ConfirmDialog
        open={history !== null}
        title={history ? `${history.row.name} 출퇴근 기록 이력` : ""}
        confirmLabel="닫기"
        cancelLabel={null}
        wide
        onCancel={() => setHistory(null)}
        onConfirm={() => setHistory(null)}
      >
        {!history?.data ? (
          <Sub>불러오는 중입니다…</Sub>
        ) : history.data.items.length === 0 ? (
          <Sub>이력이 없습니다.</Sub>
        ) : (
          <div className="flex flex-col gap-[12px]">
            {history.data.items.map((h, i) => (
              <DetailTable
                key={i}
                title="이력"
                rows={[
                  { label: "일시", value: new Date(h.at).toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16) },
                  { label: "구분", value: h.kind === "CORRECTION" ? "보정" : "대신 등록" },
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

// 기록 보정 패널(데모 fixForm): 출근 · 퇴근(원본 시각을 옆에) · 수정 사유(필수). 짝이 여럿인 날은 고를 짝을 먼저 고른다.
function FixForm({ fix, onPick, onClose, onDone }: { fix: Fix; onPick: (i: number) => void; onClose: () => void; onDone: (r: EditResult) => void }) {
  const pair = fix.row.pairs[fix.pairIndex];
  const [checkIn, setCheckIn] = useState(pair.checkIn?.time ?? "");
  // 퇴근 미등록 줄만 근무스케줄 종료 시각으로 채워 둔다(데모 「근무스케줄 종료 시각으로 보정」) — 오늘 근무 중인 줄에 미래 퇴근을 넣지 않게
  const [checkOut, setCheckOut] = useState(pair.checkOut?.time ?? (fix.row.status === "MISSING_CHECK_OUT" ? (fix.row.schedules[0]?.endTime ?? "") : ""));
  // 퇴근 날 — 출근이 있는 짝은 「다음 날 퇴근」을 api 에 보낸다(24시간 넘는 짝은 시각만으로 날을 알 수 없다, PR #159 리뷰)
  const [nextDay, setNextDay] = useState(initialNextDay(fix.row.date, pair.checkOut));
  const forced = forcedNextDay(checkIn, checkOut);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const save = () => {
    if (checkIn && !TIME.test(checkIn)) return setError("출근 시각을 시 · 분까지 입력해 주세요.");
    if (checkOut && !TIME.test(checkOut)) return setError("퇴근 시각을 시 · 분까지 입력해 주세요.");
    if (pair.checkIn && !checkIn) return setError("출근 시각을 입력해 주세요.");
    if (pair.checkOut && !checkOut) return setError("퇴근 시각을 입력해 주세요.");
    if (!reason.trim()) return setError("수정 사유를 입력해 주세요.");
    setError(null);
    startTransition(async () => {
      const result = await correctAttendanceAction(anchorOf(pair), {
        ...(checkIn ? { checkInTime: checkIn } : {}),
        ...(checkOut ? { checkOutTime: checkOut } : {}),
        ...(pair.checkIn && checkOut ? { checkOutNextDay: forced || nextDay } : {}),
        reason: reason.trim(),
        ...(pair.checkIn ? { expectedCheckInAt: pair.checkIn.recordedAt } : {}),
        ...(pair.checkOut ? { expectedCheckOutAt: pair.checkOut.recordedAt } : {}),
      });
      if (!result.ok && result.code !== "ATTENDANCE_CHANGED" && result.status !== undefined && result.status < 500) return setError(result.message);
      onDone(result);
    });
  };

  return (
    <div className="flex flex-col gap-[24px] p-[24px]">
      <div className="flex items-center gap-[8px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">기록 보정</h2>
        <span className="rounded-[2px] bg-erp-thead-bg px-[4px] py-px text-[14px] text-erp-sub">
          {fix.row.name} · {shortDay(fix.row.date)}
        </span>
      </div>
      {fix.row.isPayslipConfirmed && <PayslipWarning />}
      {fix.row.pairs.length > 1 && (
        <Field label="고칠 기록">
          <Select aria-label="고칠 기록" value={fix.pairIndex} onChange={(e) => onPick(Number(e.target.value))}>
            {fix.row.pairs.map((p, i) => (
              <option key={i} value={i}>
                출근 {p.checkIn?.time ?? "없음"} · 퇴근 {p.checkOut ? p.checkOut.time + laterDayMark(fix.row.date, p.checkOut.recordedAt) : "없음"}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <FormGroup title="출퇴근 기록">
        <FormRow>
          <HelpField label="출근" help={`원본 ${pair.checkIn?.time ?? "없음"}`}>
            <TextField type="time" aria-label="출근" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </HelpField>
          <HelpField label="퇴근" help={`원본 ${pair.checkOut ? pair.checkOut.time + laterDayMark(fix.row.date, pair.checkOut.recordedAt) : "없음"}`}>
            <TextField type="time" aria-label="퇴근" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </HelpField>
        </FormRow>
        {pair.checkIn && checkOut && (
          <Checkbox label="다음 날 퇴근" checked={forced || nextDay} disabled={forced} onChange={(e) => setNextDay(e.target.checked)} />
        )}
        <SaveNote note={fixSaveNote(fix.row.date, !!pair.checkIn, checkIn, checkOut, nextDay)} />
        <Field label="수정 사유" required>
          <Textarea aria-label="수정 사유" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 퇴근 등록 누락 · 근무스케줄 종료 시각으로 보정. 점장 구두 확인." />
        </Field>
        {/* 「다음 날 퇴근」 체크는 출근이 있는 짝에만 선다 — 출근 미등록 줄은 출근을 전날로 저장한다(위 안내) */}
        <p className="text-[13px] text-erp-label">
          {pair.checkIn
            ? "퇴근이 출근보다 이르거나 같으면 다음 날 퇴근입니다. 그 밖에 다음 날 퇴근이면 「다음 날 퇴근」을 고릅니다. "
            : "출근이 퇴근보다 늦거나 같으면 전날 출근입니다. "}
          보정하면 확인 필요 꼬리표와 사유도 지웁니다.
        </p>
      </FormGroup>
      {error && (
        <p role="alert" className="text-[14px] text-erp-off">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button onClick={save} disabled={busy}>
          보정 저장
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
      <SlidePanel id="attendance-proxy" open={open} onClose={() => setOpen(false)} label="출퇴근 대신 등록" trigger={trigger}>
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
  const [date, setDate] = useState(today);
  const [staff, setStaff] = useState<ProxyStaff[] | null>(null);
  const [staffId, setStaffId] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  // 직원 선택지는 그날 기준이다 — 날짜를 바꿀 때마다 다시 받고, 늦게 온 앞 날짜 응답은 버린다
  const wanted = useRef(today);
  const loadStaff = useCallback(
    (day: string) => {
      wanted.current = day;
      getProxyStaffAction(stores, day)
        .then((result) => {
          if (wanted.current !== day) return;
          if (!result.ok) return setError(result.message);
          setStaff(result.staff);
        })
        .catch(() => {
          // 서버 액션 호출 자체가 실패(연결 끊김 등) — 선택지를 비우고 알린다. 날짜를 다시 고르면 다시 받는다
          if (wanted.current !== day) return;
          setStaff([]);
          setError("직원 목록을 불러오지 못했습니다. 날짜를 다시 골라 주세요.");
        });
    },
    [stores],
  );
  useEffect(() => loadStaff(today), [loadStaff, today]);
  const changeDate = (day: string) => {
    setDate(day);
    setStaff(null);
    setStaffId(null);
    setError(null);
    loadStaff(day);
  };
  const manyStores = new Set((staff ?? []).map((s) => s.storeId)).size > 1;
  // 위치정보에 동의한 직원은 대신 등록이 아니라 기록 없는 날을 보정으로 채운다 — 출근 · 퇴근을 함께 받는다(2026-10-26 재영)
  const picked = staff?.find((s) => s.staffMemberId === staffId);
  const isProxy = picked?.isProxy ?? true;

  const save = () => {
    if (staffId === null) return setError("직원을 골라 주세요.");
    if (!TIME.test(checkIn)) return setError("출근 시각을 입력해 주세요.");
    if (!isProxy && !checkOut) return setError("퇴근 시각을 입력해 주세요.");
    if (checkOut && !TIME.test(checkOut)) return setError("퇴근 시각을 시 · 분까지 입력해 주세요.");
    if (!reason.trim()) return setError("사유를 입력해 주세요.");
    setError(null);
    startTransition(async () => {
      const result = await proxyAttendanceAction({ staffMemberId: staffId, date, checkInTime: checkIn, ...(checkOut ? { checkOutTime: checkOut } : {}), reason: reason.trim() });
      if (!result.ok && result.status !== undefined && result.status < 500) return setError(result.message);
      onDone({ ...result, isProxy });
    });
  };

  return (
    <div className="flex flex-col gap-[24px] p-[24px]">
      <h2 className="text-[18px] font-semibold text-erp-ink">출퇴근 대신 등록</h2>
      <FormGroup title="출퇴근 기록">
        <FormRow>
          <Field label="직원" required>
            <Select aria-label="직원" value={staffId ?? ""} onChange={(e) => setStaffId(e.target.value ? Number(e.target.value) : null)} disabled={!staff}>
              <option value="">{staff === null ? "불러오는 중…" : staff.length ? "직원 선택" : "등록할 수 있는 직원 없음"}</option>
              {(staff ?? []).map((s) => (
                <option key={s.staffMemberId} value={s.staffMemberId}>
                  {manyStores ? `${s.name} · ${s.storeName}` : s.name}
                  {s.isProxy ? "" : " (보정)"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="날짜" required>
            <TextField type="date" aria-label="날짜" min={editableFrom} max={today} value={date} onChange={(e) => e.target.value && changeDate(e.target.value)} />
          </Field>
        </FormRow>
        <FormRow>
          <Field label="출근" required>
            <TextField type="time" aria-label="출근" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </Field>
          <Field label="퇴근" required={!isProxy}>
            <TextField type="time" aria-label="퇴근" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </Field>
        </FormRow>
        <OvernightNote date={date} checkIn={checkIn} checkOut={checkOut} />
        {picked?.isPayslipConfirmed && <PayslipWarning />}
        <Field label="사유" required>
          <Textarea aria-label="사유" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 위치 수집 일시 중지 · 점장 확인" />
        </Field>
        <p className="text-[13px] text-erp-label">
          위치정보 동의를 하지 않았거나 일시 중지한 직원은 대신 등록합니다. 그 밖의 직원(보정)은 출근 · 퇴근을 모두 찍지 않은 날만 두 시각을 함께 넣어 보정합니다. 퇴근이 출근보다 이르거나 같으면 다음 날 퇴근이고, 아직 오지 않은 시각은 등록할 수 없습니다. 직원 근무 앱에는 연필 표시로 보입니다.
        </p>
      </FormGroup>
      {error && (
        <p role="alert" className="text-[14px] text-erp-off">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button onClick={save} disabled={busy}>
          {isProxy ? "대신 등록" : "보정"}
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
function OvernightNote({ date, checkIn, checkOut }: { date: string; checkIn: string; checkOut: string }) {
  return <SaveNote note={overnightNote(date, checkIn, checkOut)} />;
}

/** 저장할 날 안내(보정 · 대신 등록) */
function SaveNote({ note }: { note: string | null }) {
  return note && <p className="text-[13px] font-medium text-erp-ink">{note}</p>;
}

/** 도움말이 칸 아래에 붙는 칸(데모 fieldH) — 기록 보정의 「원본 12:58」 */
function HelpField({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[8px]">
      <Field label={label}>
        {children}
      </Field>
      <span className="text-[12px] leading-[1.5] text-erp-muted">{help}</span>
    </div>
  );
}
