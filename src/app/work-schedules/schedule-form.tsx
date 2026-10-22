"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { Button, Checkbox, ConfirmDialog, DateField, Field, FormGroup, FormRow, Radio, Select, SlidePanel, TextField, useToast } from "@/components/common";
import { usePagePermission, useStores } from "@/components/site/session-gate";
import { isClosedStore } from "@/lib/store-scope";
import type { ScheduleDefaults, ScheduleStaff, WorkSchedule } from "@/lib/work-schedules-api";
import { useFailure } from "../staff-members/[id]/use-action-failure";
import {
  bulkCreateSchedulesAction,
  createScheduleAction,
  deleteScheduleAction,
  getScheduleDefaultsAction,
  getScheduleStaffAction,
  updateScheduleAction,
} from "./actions";
import {
  EMPTY_SHIFT,
  END_TIMES,
  endOptionLabel,
  hasDefaults,
  shiftBody,
  shiftOf,
  shiftOfDefaults,
  shiftProblem,
  START_TIMES,
  type ShiftInput,
} from "./schedule-form-model";

// 근무스케줄 등록 · 수정 패널(#203). 칸과 문구는 데모 schedForm · bulkPane 이다. 근무지는 화면에서 고른 점포이고, 근무일은 하루 하나다.
// 여는 곳은 도구 줄 「근무스케줄 등록」 · 막대(수정) · 공백 줄 「이 시간대에 배정」이다. 여닫음은 화면 안 상태로 둔다 — 주소에 두면
// 입력이 이동마다 지워진다. 폐점 점포는 등록을 열지 않는다(운영 정책 ATT-33, 2026-10-22 재영). 막는 것은 api 다(WHALEERP-614).

export type Opening = { kind: "new"; workDate: string; startTime?: string; endTime?: string } | { kind: "edit"; item: WorkSchedule; staffName: string };

const OpenContext = createContext<{
  open: (o: Opening) => void;
  closed: boolean;
} | null>(null);

function useSchedulePanel() {
  const ctx = use(OpenContext);
  if (!ctx) throw new Error("SchedulePanel 안에서만 쓴다");
  return ctx;
}

const CLOSED_STORE = "폐점 점포는 근무스케줄을 등록할 수 없습니다.";

/** 화면에서 고른 점포의 등록 · 수정 패널. 안쪽 버튼(막대 · 공백 · 등록)은 useSchedulePanel 로 연다 */
export function SchedulePanel({ storeId, children }: { storeId: number; children: ReactNode }) {
  const store = useStores().find((s) => s.storeId === storeId);
  const closed = !!store && isClosedStore(store);
  const [opening, setOpening] = useState<Opening | null>(null);
  // 열 때마다 칸을 새로 그린다(같은 근무스케줄을 다시 열어도 처음 값부터)
  const [round, setRound] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  const open = (o: Opening) => {
    if (o.kind === "new" && closed) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpening(o);
    setRound((n) => n + 1);
  };
  const close = () => setOpening(null);
  return (
    <OpenContext value={{ open, closed }}>
      {children}
      <SlidePanel
        id="schedule-form"
        open={opening !== null}
        onClose={close}
        label={opening?.kind === "edit" ? "근무스케줄 수정" : "근무스케줄 등록"}
        trigger={trigger}
      >
        {opening && <ScheduleForm key={round} storeId={storeId} opening={opening} onClose={close} />}
      </SlidePanel>
    </OpenContext>
  );
}

/** 도구 줄 「근무스케줄 등록」 — 등록 권한이 없으면 두지 않고, 폐점 점포면 흐리게 둔다 */
export function NewScheduleButton({ workDate }: { workDate: string }) {
  const { open, closed } = useSchedulePanel();
  if (!usePagePermission().create) return null;
  // 막힌 버튼은 마우스를 받지 않아(disabled:pointer-events-none) title 이 뜨지 않는다 — 이유는 옆에 글자로 둔다
  return (
    <>
      {closed && <span className="text-[13px] text-erp-off">{CLOSED_STORE}</span>}
      <Button aria-controls="schedule-form" disabled={closed} onClick={() => open({ kind: "new", workDate })}>
        근무스케줄 등록
      </Button>
    </>
  );
}

/** 공백 줄 「이 시간대에 배정」 — 그 근무일 · 공백 시작 · 끝으로 등록을 연다 */
export function AssignGapButton({ workDate, startTime, endTime }: { workDate: string; startTime: string; endTime: string }) {
  const { open, closed } = useSchedulePanel();
  if (!usePagePermission().create || closed) return null;
  return (
    <button
      type="button"
      aria-controls="schedule-form"
      aria-label={`${startTime}-${endTime} 에 배정`}
      className="shrink-0 text-[13px] text-erp-link hover:underline"
      onClick={() => open({ kind: "new", workDate, startTime, endTime })}
    >
      이 시간대에 배정
    </button>
  );
}

/** 막대 — 수정 권한이 있으면 눌러 수정을 연다. 없으면 글자만 */
export function ScheduleBar({
  item,
  staffName,
  className,
  style,
  title,
  children,
}: {
  item: WorkSchedule;
  staffName: string;
  className: string;
  style: CSSProperties;
  title: string;
  children: ReactNode;
}) {
  const { open } = useSchedulePanel();
  if (!usePagePermission().update)
    return (
      <span className={className} style={style} title={title}>
        {children}
      </span>
    );
  return (
    <button
      type="button"
      aria-controls="schedule-form"
      aria-label={`${staffName} ${title} 수정`}
      title={title}
      className={`${className} cursor-pointer hover:brightness-95`}
      style={style}
      onClick={() => open({ kind: "edit", item, staffName })}
    >
      {children}
    </button>
  );
}

const ERROR = "text-[13px] text-erp-off";
const HELP = "text-[12px] leading-[1.5] text-erp-muted";
const STAFF_FAILED = "직원 목록을 불러오지 못했습니다. 근무일을 다시 골라 주세요.";

type Pool =
  { workDate: string; state: "ok"; staff: ScheduleStaff[] } | { workDate: string; state: "error"; message: string };

function ShiftFields({ shift, onChange, label }: { shift: ShiftInput; onChange: (s: ShiftInput) => void; label?: string }) {
  const prefix = label ? `${label} ` : "";
  return (
    <FormRow>
      <Field label="시작" required>
        <Select aria-label={`${prefix}시작`} value={shift.startTime} onChange={(e) => onChange({ ...shift, startTime: e.target.value })}>
          <option value="">선택</option>
          {START_TIMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="종료" required>
        <Select aria-label={`${prefix}종료`} value={shift.endTime} onChange={(e) => onChange({ ...shift, endTime: e.target.value })}>
          <option value="">선택</option>
          {END_TIMES.map((t) => (
            <option key={t} value={t}>
              {endOptionLabel(shift.startTime, t)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="휴게시간(분)" required>
        <TextField
          aria-label={`${prefix}휴게시간(분)`}
          inputMode="numeric"
          value={shift.breakMinutes}
          onChange={(e) => onChange({ ...shift, breakMinutes: e.target.value.trim() })}
        />
      </Field>
    </FormRow>
  );
}

function ScheduleForm({ storeId, opening, onClose }: { storeId: number; opening: Opening; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const can = usePagePermission();
  const edit = opening.kind === "edit" ? opening : null;
  // 공백에서 열면 그 시각 · 휴게 0분으로 채운다 — 직원을 골라도 계약 값으로 덮지 않는다(「계약 값으로 되돌리기」로 바꾼다)
  const gap: ShiftInput | null =
    opening.kind === "new" && opening.startTime && opening.endTime
      ? { startTime: opening.startTime, endTime: opening.endTime === "00:00" ? "24:00" : opening.endTime, breakMinutes: "0" }
      : null;
  const [mode, setMode] = useState<"one" | "bulk">("one");
  const [workDate, setWorkDate] = useState(opening.kind === "edit" ? opening.item.workDate : opening.workDate);
  const [staffId, setStaffId] = useState<number | null>(edit ? edit.item.staffMemberId : null);
  const [shift, setShift] = useState<ShiftInput>(edit ? shiftOf(edit.item) : (gap ?? EMPTY_SHIFT));
  const [picked, setPicked] = useState<number[]>([]);
  const [rows, setRows] = useState<Record<number, ShiftInput>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  // 계약 값 — 「직원|근무일」마다 한 번 받는다
  const [defaults, setDefaults] = useState<Record<string, ScheduleDefaults>>({});
  const [pool, setPool] = useState<Pool | null>(null);
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const seq = useRef(0);
  const key = (id: number) => `${id}|${workDate}`;

  // 등록이면 그 근무일에 받을 수 있는 직원을 받는다(STAFF-29). 근무일을 빠르게 바꾸면 마지막 요청의 응답만 쓴다
  useEffect(() => {
    if (edit || !workDate) return;
    const n = ++seq.current;
    getScheduleStaffAction(storeId, workDate)
      .then((result) => {
        if (n !== seq.current) return;
        if (result.ok) return setPool({ workDate, state: "ok", staff: result.staff });
        const message = result.status === 401 || result.status === 403 ? onFailure(result) : STAFF_FAILED;
        setPool(message === null ? null : { workDate, state: "error", message });
      })
      .catch((error: unknown) => {
        console.error("근무스케줄 직원 목록 조회 실패", error);
        if (n === seq.current) setPool({ workDate, state: "error", message: STAFF_FAILED });
      });
    // onFailure 는 렌더마다 새로 만들어진다 — 근무일 · 점포가 바뀔 때만 받는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, storeId, workDate]);

  /** 계약 값을 받아 둔다. 받은 뒤 fill 로 칸을 채운다. 실패하면 칸은 그대로(빈칸)이고 되돌리기 버튼만 숨는다 */
  const loadDefaults = (id: number, fill?: (d: ScheduleDefaults) => void) => {
    const cached = defaults[key(id)];
    if (cached) return fill?.(cached);
    getScheduleDefaultsAction(id, workDate)
      .then((result) => {
        if (!result.ok) {
          if (result.status === 401 || result.status === 403) onFailure(result);
          return;
        }
        setDefaults((d) => ({ ...d, [`${id}|${workDate}`]: result.defaults }));
        fill?.(result.defaults);
      })
      .catch((error: unknown) => console.error("근무스케줄 계약 값 조회 실패", error));
  };
  // 수정은 열 때 · 근무일을 바꿀 때 계약 값을 받아 둔다(되돌리기 버튼용)
  useEffect(() => {
    if (edit && workDate) loadDefaults(edit.item.staffMemberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workDate]);

  const handleDateChange = (value: string) => {
    setWorkDate(value);
    if (edit) return;
    // 받을 수 있는 직원이 근무일마다 달라 고른 직원을 비운다
    setStaffId(null);
    setPicked([]);
    setRows({});
    setRowErrors({});
    if (!gap) setShift(EMPTY_SHIFT);
  };
  const handlePickOne = (value: string) => {
    const id = value ? Number(value) : null;
    setStaffId(id);
    if (id !== null) loadDefaults(id, gap ? undefined : (d) => setShift(shiftOfDefaults(d)));
  };
  const handleToggle = (id: number, on: boolean) => {
    setPicked((p) => (on ? [...p, id] : p.filter((x) => x !== id)));
    setRowErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => Number(k) !== id)));
    if (!on) return;
    setRows((r) => ({ ...r, [id]: gap ?? EMPTY_SHIFT }));
    loadDefaults(id, gap ? undefined : (d) => setRows((r) => ({ ...r, [id]: shiftOfDefaults(d) })));
  };

  // 받는 중 — 지금 근무일의 응답이 아직 없다
  const loading = !edit && !!workDate && pool?.workDate !== workDate;
  const staff = pool?.state === "ok" && pool.workDate === workDate ? pool.staff : [];
  const nameOf = (id: number) => staff.find((s) => s.staffMemberId === id)?.name ?? "";
  const oneProblem = !workDate ? "근무일을 골라 주세요." : staffId === null ? "직원을 골라 주세요." : shiftProblem(shift);
  const bulkProblems = Object.fromEntries(picked.map((id) => [id, shiftProblem(rows[id] ?? EMPTY_SHIFT)]));
  const bulkProblem = !workDate ? "근무일을 골라 주세요." : picked.length === 0 ? "직원을 한 명 이상 골라 주세요." : null;

  /** 실패 처리 — 결과 모름이면 화면을 새로 받고 닫는다(다시 저장하면 겹칠 수 있다) */
  const fail = (result: { ok: false; status?: number; message: string }) => {
    if (result.status === undefined) {
      toast(result.message);
      router.refresh();
      onClose();
      return;
    }
    const message = onFailure(result);
    if (message) setServerError(message);
  };

  const handleSave = () => {
    setTried(true);
    setServerError("");
    if (mode === "one" ? oneProblem : bulkProblem || picked.some((id) => bulkProblems[id])) return;
    startSaving(async () => {
      try {
        if (mode === "bulk") {
          const result = await bulkCreateSchedulesAction(
            workDate,
            picked.map((id) => ({ staffMemberId: id, ...shiftBody(rows[id]) })),
          );
          if (!result.ok) return fail(result);
          router.refresh();
          if (result.result.failed.length === 0) {
            toast("saved");
            return onClose();
          }
          // 성공한 줄은 닫고 실패한 줄만 남겨 사유를 보인다
          const failedIds = result.result.failed.map((f) => f.staffMemberId);
          setPicked(failedIds);
          setRowErrors(Object.fromEntries(result.result.failed.map((f) => [f.staffMemberId, f.message])));
          setServerError(`${result.result.created.length}명은 등록했고 ${failedIds.length}명은 등록하지 못했습니다.`);
          return;
        }
        const body = { workDate, ...shiftBody(shift) };
        const result = edit ? await updateScheduleAction(edit.item.workScheduleId, body) : await createScheduleAction(staffId, body);
        if (!result.ok) return fail(result);
        toast(edit ? "updated" : "saved");
        router.refresh();
        onClose();
      } catch (error) {
        console.error("근무스케줄 저장 실패", error);
        fail({
          ok: false,
          message: "저장 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!edit) return;
    startSaving(async () => {
      try {
        const result = await deleteScheduleAction(edit.item.workScheduleId);
        setConfirmDelete(false);
        if (!result.ok) return fail(result);
        toast("deleted");
        router.refresh();
        onClose();
      } catch (error) {
        console.error("근무스케줄 삭제 실패", error);
        setConfirmDelete(false);
        fail({
          ok: false,
          message: "삭제 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.",
        });
      }
    });
  };

  const revert = (id: number, apply: (s: ShiftInput) => void) => {
    const d = defaults[key(id)];
    return hasDefaults(d) ? (
      <div className="flex justify-end">
        <Button variant="off" onClick={() => apply(shiftOfDefaults(d))}>
          계약 값으로 되돌리기
        </Button>
      </div>
    ) : null;
  };

  return (
    <div className="flex flex-col gap-[24px] p-[24px]">
      <h2 className="text-[18px] font-semibold text-erp-ink">{edit ? "근무스케줄 수정" : "근무스케줄 등록"}</h2>
      {!edit && (
        <div role="radiogroup" aria-label="등록 방식" className="flex gap-[18px]">
          <Radio label="한 명" name="schedule-mode" checked={mode === "one"} onChange={() => setMode("one")} />
          <Radio label="여러 명 일괄" name="schedule-mode" checked={mode === "bulk"} onChange={() => setMode("bulk")} />
        </div>
      )}
      <FormGroup title="근무">
        <Field label="근무일" required>
          <DateField aria-label="근무일" value={workDate} onChange={handleDateChange} />
        </Field>
        {edit ? (
          <p className="text-[14px]">
            <span className="text-erp-label">직원</span> <b className="font-medium">{edit.staffName}</b>
          </p>
        ) : loading ? (
          <p className={HELP}>직원 목록을 불러오는 중입니다…</p>
        ) : pool?.state === "error" ? (
          <p role="alert" className={ERROR}>
            {pool.message}
          </p>
        ) : mode === "one" ? (
          <Field label="직원" required>
            <Select aria-label="직원" value={staffId ?? ""} onChange={(e) => handlePickOne(e.target.value)}>
              <option value="">{staff.length ? "선택" : "이 근무일에 받을 수 있는 직원이 없습니다"}</option>
              {staff.map((s) => (
                <option key={s.staffMemberId} value={s.staffMemberId}>
                  {s.name} · {s.jobTitle}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <div role="group" aria-label="직원" className="flex flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">직원</span>
            {staff.length ? (
              <div className="flex flex-wrap gap-x-[18px] gap-y-[8px]">
                {staff.map((s) => (
                  <Checkbox
                    key={s.staffMemberId}
                    label={`${s.name} · ${s.jobTitle}`}
                    checked={picked.includes(s.staffMemberId)}
                    onChange={(e) => handleToggle(s.staffMemberId, e.target.checked)}
                  />
                ))}
              </div>
            ) : (
              <p className={HELP}>이 근무일에 받을 수 있는 직원이 없습니다.</p>
            )}
            <p className={HELP}>그 근무일에 체결 완료 근로계약이 있고 가입을 마친 직원만 보입니다.</p>
          </div>
        )}

        {mode === "one" && (
          <>
            {staffId !== null && revert(staffId, setShift)}
            <ShiftFields shift={shift} onChange={setShift} />
            {tried && oneProblem && (
              <p role="alert" className={ERROR}>
                {oneProblem}
              </p>
            )}
          </>
        )}
        {mode === "bulk" && (
          <>
            {picked.map((id) => (
              <div key={id} className="flex flex-col gap-[8px] border-b border-erp-thead-line pb-[12px]">
                <div className="flex items-center gap-[6px]">
                  <p className="flex-1 text-[14px] font-medium">{nameOf(id)}</p>
                  {revert(id, (s) => setRows((r) => ({ ...r, [id]: s })))}
                </div>
                <ShiftFields label={nameOf(id)} shift={rows[id] ?? EMPTY_SHIFT} onChange={(s) => setRows((r) => ({ ...r, [id]: s }))} />
                {((tried && bulkProblems[id]) || rowErrors[id]) && (
                  <p role="alert" className={ERROR}>
                    {rowErrors[id] ?? bulkProblems[id]}
                  </p>
                )}
              </div>
            ))}
            {tried && bulkProblem && (
              <p role="alert" className={ERROR}>
                {bulkProblem}
              </p>
            )}
            <p className={HELP}>일부가 실패해도 성공한 등록은 남고 실패한 직원만 남겨 사유를 보입니다.</p>
          </>
        )}
      </FormGroup>

      <p className={HELP}>저장하면 바뀐 직원에게 알림이 갑니다.</p>
      {serverError && (
        <p role="alert" className={ERROR}>
          {serverError}
        </p>
      )}
      <div className="flex justify-between gap-[6px]">
        <span>
          {edit && can.delete && (
            <Button variant="off" disabled={saving} onClick={() => setConfirmDelete(true)}>
              삭제
            </Button>
          )}
        </span>
        <span className="flex gap-[6px]">
          <Button variant="off" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "저장 중" : mode === "bulk" ? `${picked.length}명 등록` : "저장"}
          </Button>
        </span>
      </div>
      {edit && (
        <ConfirmDialog
          open={confirmDelete}
          title="이 근무스케줄을 삭제하시겠습니까?"
          confirmLabel="삭제"
          confirmVariant="danger"
          busy={saving}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        >
          {edit.staffName} · {edit.item.workDate} 근무스케줄을 삭제합니다.
        </ConfirmDialog>
      )}
    </div>
  );
}
