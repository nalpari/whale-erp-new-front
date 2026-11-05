"use client";

import { useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { Button, Checkbox, ConfirmDialog, DateField, Field, FormGroup, FormRow, GuideBand, Radio, RequiredMark, Select, SlidePanel, TextField, useBackdropActive, useToast } from "@/components/common";
import { useAccount, usePagePermission, useStores } from "@/components/site/session-gate";
import { isPlatformRole } from "@/lib/auth-routes";
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


/**
 * 화면에서 고른 점포의 등록 · 수정 패널. 안쪽 버튼(막대 · 공백 · 등록)은 useSchedulePanel 로 연다.
 * 연 채 점포를 바꾸면 닫는다 — 남겨 두면 앞 점포 직원으로 저장이 나간다(front #95 리뷰).
 */
export function SchedulePanel({ storeId, children }: { storeId: number; children: ReactNode }) {
  const store = useStores().find((s) => s.storeId === storeId);
  const closed = !!store && isClosedStore(store);
  const [opening, setOpening] = useState<Opening | null>(null);
  // 열 때마다 칸을 새로 그린다(같은 근무스케줄을 다시 열어도 처음 값부터)
  const [round, setRound] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  // 점포가 바뀌면 닫는다 — 렌더 중에 앞 값과 견준다(effect 로 한 박자 늦게 닫지 않게)
  const [seenStoreId, setSeenStoreId] = useState(storeId);
  if (seenStoreId !== storeId) {
    setSeenStoreId(storeId);
    setOpening(null);
  }
  const open = (o: Opening) => {
    if (o.kind === "new" && closed) return;
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpening(o);
    setRound((n) => n + 1);
  };
  const close = () => setOpening(null);
  const backdropActive = useBackdropActive();
  return (
    <OpenContext value={{ open, closed }}>
      {/* 출퇴근 대신 등록과 같이 바탕을 깔고 바탕을 누르면 닫는다 — 패널이 아닌 본문은 그동안 inert(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <div className="contents" inert={backdropActive}>
        {children}
      </div>
      <SlidePanel
        id="schedule-form"
        open={opening !== null}
        onClose={close}
        closeOnBackdrop
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
  const toast = useToast();
  const platform = isPlatformRole(useAccount().roleTypeCode);
  const canCreate = usePagePermission().create;
  // 플랫폼 계정은 등록 권한이 없어도 BP 마스터와 같은 버튼을 두고, 누르면 권한 안내만 띄운다 — 버튼이 없으면 BP 화면이 다르게 보였다
  // (2026-11-05 사용자 지정, 3팀 확인 필요 — 점포 없음 띠 [점포 등록하기]와 같은 문구). 그 밖의 계정은 지금처럼 두지 않는다
  if (!canCreate && !platform) return null;
  // 막힌 버튼은 마우스를 받지 않아(disabled:pointer-events-none) title 이 뜨지 않는다 — 이유는 옆에 글자로 둔다
  return (
    <>
      <Button aria-controls="schedule-form" disabled={closed} onClick={() => (canCreate ? open({ kind: "new", workDate }) : toast("접근 권한이 없습니다."))}>
        근무스케줄 등록
      </Button>
    </>
  );
}

/** 공백 줄 「이 시간대에 배정」(데모 soft 버튼) — 그 근무일 · 공백 시작 · 끝으로 등록을 연다. 공백이 여럿이면 글자에 시각을 적는다(label) */
export function AssignGapButton({ workDate, startTime, endTime, label }: { workDate: string; startTime: string; endTime: string; label: string }) {
  const { open, closed } = useSchedulePanel();
  if (!usePagePermission().create || closed) return null;
  return (
    <Button variant="soft" aria-controls="schedule-form" aria-label={`${startTime}-${endTime} 에 배정`} onClick={() => open({ kind: "new", workDate, startTime, endTime })}>
      {label}
    </Button>
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
// 직원 칸의 상태 문구(없음 · 불러오는 중) — 입력칸과 같은 14px 회색. 12px 는 너무 작았다(2026-11-05 사용자 지적, 3팀 확인 필요)
const STATUS = "text-[14px] text-erp-label";
const STAFF_FAILED = "직원 목록을 불러오지 못했습니다. 근무일을 다시 골라 주세요.";

type Pool =
  { workDate: string; state: "ok"; staff: ScheduleStaff[] } | { workDate: string; state: "error"; message: string };

function ShiftFields({ shift, onChange, label }: { shift: ShiftInput; onChange: (s: ShiftInput) => void; label?: string }) {
  const prefix = label ? `${label} ` : "";
  return (
    <FormRow>
      <Field label="시작시간" required>
        <Select aria-label={`${prefix}시작시간`} value={shift.startTime} onChange={(e) => onChange({ ...shift, startTime: e.target.value })}>
          <option value="">선택</option>
          {START_TIMES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="종료시간" required>
        <Select aria-label={`${prefix}종료시간`} value={shift.endTime} onChange={(e) => onChange({ ...shift, endTime: e.target.value })}>
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
  // 공백에서 열면 그 시각 · 휴게 0분으로 채운다 — 직원을 골라도 계약 값으로 덮지 않는다(「근로계약 시간적용」로 바꾼다)
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
  // 계약 값 요청 — 마지막 요청의 응답만 칸을 채운다(직원 · 근무일을 빠르게 바꿀 때, front #95 리뷰)
  const defaultsSeq = useRef(0);
  // 지금 근무일 — 늦게 온 계약 값이 바뀐 근무일 칸을 덮지 않게 견준다(handleDateChange 가 고친다)
  const workDateNow = useRef(workDate);
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
    const n = ++defaultsSeq.current;
    const date = workDate;
    const cached = defaults[key(id)];
    if (cached) return fill?.(cached);
    getScheduleDefaultsAction(id, workDate)
      .then((result) => {
        if (!result.ok) {
          if (result.status === 401 || result.status === 403) onFailure(result);
          return;
        }
        setDefaults((d) => ({ ...d, [`${id}|${workDate}`]: result.defaults }));
        // 근무일이 바뀐 뒤의 응답은 버린다. 일괄은 직원마다 제 줄을 채우므로 한 명 칸만 마지막 요청으로 막는다
        if (date === workDateNow.current && (n === defaultsSeq.current || mode === "bulk")) fill?.(result.defaults);
      })
      .catch((error: unknown) => console.error("근무스케줄 계약 값 조회 실패", error));
  };
  // 수정은 열 때 · 근무일을 바꿀 때 계약 값을 받아 둔다(되돌리기 버튼용)
  useEffect(() => {
    if (edit && workDate) loadDefaults(edit.item.staffMemberId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workDate]);

  // 등록 인원을 바꾸면 앞 방식의 저장 실패 문장 · 칸 오류를 내린다 — 1명에서 겹침으로 거절된 뒤 여러 명으로 바꾸면 그 문장과
  // 「직원을 한 명 이상 골라 주세요.」가 아직 고르지도 않았는데 함께 보였다(2026-11-05 사용자 지적)
  const changeMode = (next: "one" | "bulk") => {
    setMode(next);
    setTried(false);
    setServerError("");
  };
  const handleDateChange = (value: string) => {
    setServerError("");
    setWorkDate(value);
    workDateNow.current = value;
    if (edit) return;
    // 받을 수 있는 직원이 근무일마다 달라 고른 직원을 비운다
    setStaffId(null);
    setPicked([]);
    setRows({});
    setRowErrors({});
    if (!gap) setShift(EMPTY_SHIFT);
  };
  const handlePickOne = (value: string) => {
    setServerError("");
    const id = value ? Number(value) : null;
    setStaffId(id);
    if (id !== null) loadDefaults(id, gap ? undefined : (d) => setShift(shiftOfDefaults(d)));
  };
  const handleToggle = (id: number, on: boolean) => {
    setServerError("");
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
  // 일괄 저장을 막는 이유 — 직원 칸 아래, 직원 목록을 불러오는 중 · 실패 문구 아래 같은 자리에 쓴다
  const bulkError = tried && bulkProblem ? (
    <p role="alert" className={ERROR}>
      {bulkProblem}
    </p>
  ) : null;

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
        {/* 직원 상자 머리 줄 안의 작은 흰 버튼(26px · 13px) — outline 34px 은 회색 머리 줄에서 너무 튀었다. 모양은 outline 과 같게 회청 테두리 · 먹색이 기본이고 호버하면 회색 바탕.
            문구는 근로계약서의 근무시간을 넣는다는 것이 보이게(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 off 34px · 「계약 값으로 되돌리기」) */}
        <button
          type="button"
          onClick={() => apply(shiftOfDefaults(d))}
          className="h-[26px] shrink-0 rounded-[2px] border border-erp-brand bg-white px-[10px] text-[13px] font-medium whitespace-nowrap text-erp-ink transition-colors duration-150 ease-out hover:bg-erp-subtle"
        >
          근로계약 시간적용
        </button>
      </div>
    ) : null;
  };

  return (
    <div className="contents">
      {/* 패널(SlidePanel)이 이미 안쪽 24px · 칸 사이 16px 를 준다 — 출퇴근 대신 등록 패널과 같게(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <h2 className="text-[18px] font-semibold text-erp-ink">{edit ? "근무스케줄 수정" : "근무스케줄 등록"}</h2>
      {/* 묶음 제목은 「근무스케줄 정보」, 칸 순서는 근무일 → 직원 → 시간, 「1명 · 여러 명」은 맨 위 「등록 인원」 칸(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「근무」, 라디오 「한 명 · 여러 명 일괄」은 제목 아래) */}
      <FormGroup title="근무스케줄 정보">
        {/* 근무일 · 직원 · 시간 묶음 사이는 24 — 묶음 상자 기본 18 이면 칸들이 다닥다닥 붙어 보였다(2026-11-05 사용자 지적, 3팀 확인 필요).
            근무일이 먼저다 — 직원 목록이 근무일마다 달라(STAFF-29) 근무일을 바꾸면 고른 직원을 비운다 */}
        {/* 등록 인원은 맨 위 칸 — 무엇을 할지 먼저 고르고 내용을 채운다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 직원 라벨 아래 라디오). 수정은 한 건이라 없다 */}
        {!edit && (
          <div className="flex flex-col gap-[8px] pb-[6px]">
            <span className="text-[14px] font-medium text-erp-label">
              등록 인원
              <RequiredMark />
            </span>
            <div role="radiogroup" aria-label="등록 인원" className="flex gap-[18px]">
              <Radio label="1명" name="schedule-mode" checked={mode === "one"} onChange={() => changeMode("one")} />
              <Radio label="여러 명" name="schedule-mode" checked={mode === "bulk"} onChange={() => changeMode("bulk")} />
            </div>
          </div>
        )}
        <div className="pb-[6px]">
          <Field label="근무일" required>
            <DateField aria-label="근무일" value={workDate} onChange={handleDateChange} />
          </Field>
        </div>
        <div className="flex flex-col gap-[8px] pb-[6px]">
          <span className="text-[14px] font-medium text-erp-label">
            직원
            {!edit && <RequiredMark />}
          </span>
          {edit ? (
            <p className="text-[14px] font-medium">{edit.staffName}</p>
          ) : loading ? (
            // 여러 명 일괄의 오류 문구는 직원 칸 안에 있어 목록을 불러오는 동안 · 실패했을 때는 그려지지 않는다 — 그새 [저장]을 누르면 이유가 안 보여 여기에도 둔다(리뷰 반영)
            <div className="flex flex-col gap-[6px]">
              <p className={STATUS}>직원 목록을 불러오는 중입니다…</p>
              {mode === "bulk" && bulkError}
            </div>
          ) : pool?.state === "error" ? (
            <div className="flex flex-col gap-[6px]">
              <p role="alert" className={ERROR}>
                {pool.message}
              </p>
              {mode === "bulk" && bulkError}
            </div>
          ) : mode === "one" ? (
            <div className="flex flex-col gap-[6px]">
              <Select aria-label="직원" value={staffId ?? ""} onChange={(e) => handlePickOne(e.target.value)}>
                <option value="">{staff.length ? "선택" : "근무 가능한 직원이 없습니다"}</option>
                {staff.map((s) => (
                  <option key={s.staffMemberId} value={s.staffMemberId}>
                    {s.name} · {s.jobTitle}
                  </option>
                ))}
              </Select>
              </div>
          ) : (
            <div role="group" aria-label="직원" className="flex flex-col gap-[8px]">
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
                <p className={STATUS}>근무 가능한 직원이 없습니다.</p>
              )}
              {/* 직원을 고르지 않은 오류는 직원 칸 바로 아래 — 고른 직원 줄들 뒤(카드 줄 간격 18px)에 두면 칸과 떨어져 보였다(2026-11-04 사용자 지적) */}
              {bulkError}
            </div>
          )}
        </div>

        {mode === "one" && (
          // 1명 · 수정도 여러 명과 같은 직원 상자 — 머리 줄에 고른 직원 이름과 [근로계약 시간적용](2026-11-05 사용자 지정, 3팀 확인 필요).
          // 아직 고르지 않았으면 머리 줄에 회색 안내만. 칸과 오류 문구는 한 묶음(2026-11-04 사용자 지적)
          <div className="flex flex-col overflow-hidden rounded-[2px] border border-erp-panel-line">
            <div className="flex h-[42px] items-center gap-[6px] border-b border-erp-thead-line bg-erp-thead-bg pr-[8px] pl-[12px]">
              {edit || staffId !== null ? (
                <p className="flex-1 truncate text-[14px] font-semibold text-erp-ink">{edit ? edit.staffName : nameOf(staffId!)}</p>
              ) : (
                <p className="flex-1 truncate text-[14px] text-erp-label">직원을 고르면 근무시간을 입력할 수 있습니다.</p>
              )}
              {staffId !== null && revert(staffId, setShift)}
            </div>
            <div className="flex flex-col gap-[8px] p-[12px]">
              <ShiftFields shift={shift} onChange={setShift} />
              {tried && oneProblem && (
                <p role="alert" className={ERROR}>
                  {oneProblem}
                </p>
              )}
            </div>
          </div>
        )}
        {mode === "bulk" && (
          <>
            {picked.map((id) => (
              // 직원마다 작은 상자 — 회색 머리 줄(42px)에 이름과 [근로계약 시간적용]을 두어 버튼 · 시간 칸이 그 직원과 짝으로 보이게(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 이름 줄 + 아래 선)
              <div key={id} className="flex flex-col overflow-hidden rounded-[2px] border border-erp-panel-line">
                <div className="flex h-[42px] items-center gap-[6px] border-b border-erp-thead-line bg-erp-thead-bg pr-[8px] pl-[12px]">
                  <p className="flex-1 truncate text-[14px] font-semibold text-erp-ink">{nameOf(id)}</p>
                  {revert(id, (s) => setRows((r) => ({ ...r, [id]: s })))}
                </div>
                <div className="flex flex-col gap-[8px] p-[12px]">
                  <ShiftFields label={nameOf(id)} shift={rows[id] ?? EMPTY_SHIFT} onChange={(s) => setRows((r) => ({ ...r, [id]: s }))} />
                  {((tried && bulkProblems[id]) || rowErrors[id]) && (
                    <p role="alert" className={ERROR}>
                      {rowErrors[id] ?? bulkProblems[id]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </FormGroup>

      {/* 직원 칸에는 상태(없음 · 불러오는 중)만 두고, 규칙은 이 안내 박스에 모은다 — 회색 세 줄이 칸 아래 몰려 어수선했다(2026-11-05 사용자 지적, 3팀 확인 필요) */}
      <GuideBand
        title={edit ? "근무스케줄 수정 안내" : "근무스케줄 등록 안내"}
        lines={[
          ...(edit
            ? []
            : [
                // 직원이 목록에 나오는 조건(STAFF-29 · CTR-24, api schedulable) — 체결 완료 근로계약 · 앱 가입이 중요해 밑줄(2026-11-05 사용자 지정)
                <>
                  직원 목록에는 선택한 근무일에 <u>근로계약이 체결 완료</u>된 직원 중 <u>직원 근무 앱에 가입</u>한 직원만 표시됩니다.
                </>,
                "퇴직일이 정해진 직원은 퇴직일까지만 근무스케줄을 등록할 수 있습니다.",
              ]),
          ...(mode === "bulk" && !edit ? ["여러 명을 등록할 때 일부가 실패하면, 성공한 직원은 등록되고 실패한 직원만 사유와 함께 남습니다."] : []),
          // 알림이 가는 곳에 밑줄(2026-11-05 사용자 지정, 3팀 확인 필요)
          <>
            관리자가 근무스케줄을 저장하면 해당 <u>직원의 근무 앱</u>과 <u>이메일</u>로 알림이 발송됩니다.
          </>,
          "직원이 근무 앱에서 근무스케줄 알림을 끄면 알림은 근무 앱 알림함에만 표시됩니다.",
        ]}
      />
      {serverError && (
        <p role="alert" className={ERROR}>
          {serverError}
        </p>
      )}
      {/* [취소] [삭제] [저장]은 패널 가운데 — 출퇴근 대신 등록 패널 · 1팀 패널과 같다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 삭제 왼쪽 끝 · 나머지 오른쪽 끝) */}
      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose}>
          취소
        </Button>
        {edit && can.delete && (
          <Button variant="soft" disabled={saving} onClick={() => setConfirmDelete(true)}>
            삭제
          </Button>
        )}
        <Button onClick={handleSave} disabled={saving}>
          {/* 1명 · 여러 명 · 수정 모두 [저장](2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 여러 명이면 「N명 등록」) */}
          {saving ? "저장 중" : "저장"}
        </Button>
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
