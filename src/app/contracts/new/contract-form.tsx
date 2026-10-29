"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { Button, Checkbox, ConfirmDialog, DataTable, DateField, FormGroup, FormRow, Radio, Select, Textarea, TextField, useAction } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { callSave, SAVE_CALL_LOST, SAVE_UNKNOWN_NEW } from "../[contractId]/send-model";
import { SAVED_COOKIE, SAVED_COOKIE_MAX_AGE, backHrefOf, listAfterSave, savedKindOf, withBack } from "../contract-list";
import { createContract, updateContract } from "./actions";
import {
  formatHours,
  GENDERS,
  formatPhone,
  formatWage,
  fullTimePay,
  initialForm,
  inProgressLine,
  stillCorrecting,
  replaceConfirmBody,
  fieldProblems,
  isMinor,
  MINIMUM_WAGE,
  monthlyHours,
  monthlyWage,
  paperFileAccept,
  paperFileError,
  paperFileTypesOf,
  partTimePay,
  PROBATION_WAGE_FLOOR,
  probationWage,
  problemsByField,
  type ProblemField,
  timesOf,
  toBody,
  weeklyHolidayOf,
  weeklyHours,
  WEEKDAYS,
  type ContractForm as Form,
  type CreateContractBody,
  type DayTimes,
  type HourField,
  type HourMinute,
  type InProgressContract,
  type SaveResult,
  type TimeSpan,
  type Weekday,
} from "./contract-form-model";

export interface ContractFormLabels {
  employmentType: EnumValue[];
  weekday: EnumValue[];
  payMonth: EnumValue[];
  payMethod: EnumValue[];
  gender: EnumValue[];
  /** 대체할지 물을 때 진행 중 계약의 상태 이름 */
  contractStatus: EnumValue[];
  contractMethod: EnumValue[];
  /** 첨부 파일 형식(PDF · JPG · PNG) — 날인본 파일 선택 창 · 안내 */
  attachmentFileType: EnumValue[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
// 월 근로시간 칸 — 폼 키와 화면 이름(현업 요구사항, 2026-10-12 재영)
const HOURS_FIELDS: [HourField, string][] = [
  ["baseHours", "월 기본시간"],
  ["monthlyOvertimeHours", "월간 연장근무"],
  ["baseNightHours", "기본시간 중 야간근무"],
];
const HELP = "text-[12px] leading-[1.5] text-erp-muted";
const LABEL = "truncate text-[14px] font-medium text-erp-label";

const won = (n: number | null) => (n === null ? "-" : n.toLocaleString("ko-KR"));
const hoursLabel = (n: number | null) => (n === null ? "" : String(Number(n.toFixed(2))));

// 셈해서 보이는 칸(현업 견본의 회색 칸). 입력칸과 같은 높이로 오른쪽에 붙인다.
function Calc({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return <span className={`block rounded-[2px] bg-erp-thead-bg px-[10px] text-right leading-[34px] ${strong ? "font-semibold" : ""}`}>{children}</span>;
}

// 표 위 제목과 표. 급여 표가 둘씩 나란히 선다.
function PayTable({ title, help, errors, children }: { title: string; help?: string; errors?: string[]; children: ReactNode }) {
  return (
    <div data-invalid={errors?.length ? true : undefined} className="flex min-w-px flex-1 flex-col gap-[8px]">
      <span className={LABEL}>{title}</span>
      {children}
      <FieldErrors errors={errors} />
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

// 저장 때 찾은 유효성 오류 — 그 칸 바로 아래, 도움말 위에 보인다(WHALEERP-631, 2026-10-29 재영 공지 1번). 색은 종이 계약 파일 칸 오류와 같다.
function FieldErrors({ id, errors }: { id?: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <span id={id} className="flex flex-col text-[12px] leading-[1.5] text-erp-off">
      {errors.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </span>
  );
}

// 오류가 있는 칸의 입력에 aria-invalid · aria-describedby 를 단다. 칸 안 입력은 공통 컴포넌트라 첫 입력을 찾아 단다(DateField 처럼 id 를
// 받지 않는 것도 있다).
function useInvalid(box: RefObject<HTMLElement | null>, errorId: string, invalid: boolean) {
  useEffect(() => {
    const control = box.current?.querySelector<HTMLElement>("input:not([type=file]):not([type=hidden]), select, textarea");
    if (!control) return;
    if (invalid) {
      control.setAttribute("aria-invalid", "true");
      control.setAttribute("aria-describedby", errorId);
    } else if (control.getAttribute("aria-describedby") === errorId) {
      control.removeAttribute("aria-invalid");
      control.removeAttribute("aria-describedby");
    }
  }, [box, errorId, invalid]);
}

type PayRow = { key: string; label: string; cells?: ReactNode[]; hours?: ReactNode; wage?: ReactNode; amount: ReactNode };

// 라벨 · 입력 · 도움말 한 칸. 공통 Field 는 라벨이 글자뿐이라 필수 표시(*)를 달 수 없어 여기서 묶는다.
// 필수 표시 색 #e93737 은 DESIGN.md 의 「위험」 한 번 쓰는 색이다(데모 biz-form REQ 와 같다).
function Item({
  label,
  required,
  help,
  width,
  errors,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  width?: string;
  errors?: string[];
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const invalid = !!errors?.length;
  useInvalid(box, `${id}-error`, invalid);
  return (
    <div ref={box} data-invalid={invalid || undefined} className={`flex flex-col gap-[8px] ${width ?? "min-w-px flex-1"}`}>
      <label htmlFor={id} className="truncate text-[14px] font-medium text-erp-label">
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden className="text-[#e93737]">
              *
            </span>
            <span className="sr-only">(필수)</span>
          </>
        )}
      </label>
      {children(id)}
      <FieldErrors id={`${id}-error`} errors={errors} />
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

// 종이 계약 날인본 한 칸 — 고른 파일 이름(읽기 전용) + 「파일 선택」(숨은 file 입력) + 고른 뒤 「빼기」. 데모 staff-parts fileField 와 같다.
// 1팀 공통 컴포넌트에 파일 칸이 없어 여기 둔다. 형식 · 크기가 맞지 않으면 칸 아래 이유를 보이고 파일을 받지 않는다.
function PaperFile({ id, label, file, error, accept, onPick }: { id: string; label: string; file: File | null; error?: string; accept: string; onPick: (file: File | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <span className="flex flex-col gap-[6px]">
      <span className="flex gap-[6px]">
        <TextField id={id} readOnly value={file?.name ?? ""} placeholder="PDF · JPG · PNG" aria-invalid={error ? true : undefined} />
        <Button variant="soft" onClick={() => input.current?.click()}>
          파일 선택
        </Button>
        {file && (
          <Button variant="off" onClick={() => onPick(undefined)}>
            빼기
          </Button>
        )}
      </span>
      {error && <span className="text-[12px] text-erp-off">{error}</span>}
      <input
        ref={input}
        type="file"
        hidden
        accept={accept}
        aria-label={`${label} 파일`}
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = ""; // 같은 파일을 다시 골라도 onChange 가 오게
        }}
      />
    </span>
  );
}

// 입력이 여럿인 칸(라디오 · 요일 · 시각). <label> 하나로 묶을 수 없어 group 으로 둔다.
function Group({ label, required, children, help, errors }: { label: string; required?: boolean; children: ReactNode; help?: string; errors?: string[] }) {
  const errorId = useId();
  const invalid = !!errors?.length;
  return (
    <div
      role="group"
      aria-label={label}
      aria-describedby={invalid ? errorId : undefined}
      data-invalid={invalid || undefined}
      className="flex min-w-px flex-1 flex-col gap-[8px]"
    >
      <span className="truncate text-[14px] font-medium text-erp-label">
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden className="text-[#e93737]">
              *
            </span>
            <span className="sr-only">(필수)</span>
          </>
        )}
      </span>
      {children}
      <FieldErrors id={errorId} errors={errors} />
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

// 시 00~23, 분 00 · 30 (운영 정책 CTR-20 30분 단위). 칸 폭을 꽉 채운다(근무요일 줄 3등분)
function TimePick({ value, onChange, label }: { value: HourMinute; onChange: (v: HourMinute) => void; label: string }) {
  return (
    <span className="flex min-w-px flex-1 items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="min-w-[56px] flex-1">
        <Select aria-label={`${label} 시`} value={value.hour} onChange={(e) => onChange({ ...value, hour: e.target.value })}>
          {HOURS.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </Select>
      </span>
      시
      <span className="min-w-[56px] flex-1">
        <Select aria-label={`${label} 분`} value={value.minute} onChange={(e) => onChange({ ...value, minute: e.target.value as HourMinute["minute"] })}>
          <option>00</option>
          <option>30</option>
        </Select>
      </span>
      분
    </span>
  );
}

function SpanPick({ value, onChange, label }: { value: TimeSpan; onChange: (v: TimeSpan) => void; label: string }) {
  return (
    <span className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <TimePick label={`${label} 시작`} value={value.start} onChange={(start) => onChange({ ...value, start })} />~
      <TimePick label={`${label} 끝`} value={value.end} onChange={(end) => onChange({ ...value, end })} />
    </span>
  );
}

function Band({ title, desc, risk }: { title: string; desc?: ReactNode; risk?: boolean }) {
  return (
    <div
      role={risk ? "alert" : undefined}
      className={`flex flex-col gap-[4px] rounded-[2px] border px-[16px] py-[12px] ${risk ? "border-erp-off-bg bg-erp-off-bg" : "border-erp-panel-line bg-erp-thead-bg"}`}
    >
      <p className={`text-[14px] font-semibold ${risk ? "text-erp-off" : "text-erp-ink"}`}>{title}</p>
      {desc && <div className="text-[14px] leading-[1.6] text-erp-ink">{desc}</div>}
    </div>
  );
}

export function ContractForm({
  stores,
  labels,
  signedIn,
  contractId,
  initial,
  deleteButton,
  correction = false,
  previousContractId,
  previousStartDate,
  back = "/contracts",
}: {
  stores: { storeId: number; name: string }[];
  labels: ContractFormLabels;
  signedIn: boolean;
  /** 있으면 임시저장 이어 쓰기 — PUT 으로 저장한다 */
  contractId?: number;
  initial?: Form;
  /** 이어 쓰기 화면의 임시저장 삭제. 취소와 임시저장 사이에 선다 */
  deleteButton?: ReactNode;
  /**
   * 직원이 수정을 요청한 계약(수정 요청, WHALEERP-125 · 126)을 고친다. 임시저장 · 종이 계약은 없고, 저장하면 곧바로 서명
   * 대기로 다시 보낸다(2026-10-19 재영, api 가 같은 것을 다시 본다).
   */
  correction?: boolean;
  /**
   * 재계약의 직전 계약(WHALEERP-156) — 저장 본문에 싣는다. 근무지 · 휴대전화번호는 직전 계약과 같아야 해(api 가 다시 본다) 바꾸지
   * 않는다.
   */
  previousContractId?: number;
  /** 재계약의 직전 계약 시작일 — 새 계약 시작일은 그 다음 날부터다(api 가 400 으로 다시 본다) */
  previousStartDate?: string;
  /** 돌아갈 목록 주소(?back=) — 취소 · 저장 뒤 같은 조건의 목록으로 간다 */
  back?: string;
}) {
  const [form, setForm] = useState<Form>(() => initial ?? initialForm(stores.length === 1 ? String(stores[0].storeId) : ""));
  // 저장을 한 번 누른 뒤부터 막는 이유를 보인다. 처음부터 빨간 줄을 띄우지 않는다.
  const router = useRouter();
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saving, startSaving] = useTransition();
  // 저장 · 종이 계약 등록 요청은 화면 전체 딤으로 감싼다 — 고쳐 쓰기(correction)는 「수정중」, 새 계약 · 임시저장 이어 쓰기 · 종이 계약 등록은 「등록중」
  const create = useAction(createContract, { kind: "create" });
  const update = useAction(updateContract, { kind: correction ? "update" : "create" });
  const postPaper = useAction(async (data: FormData) => {
    const res = await fetch("/contracts/paper", { method: "POST", body: data });
    return { status: res.status, body: res.status === 401 ? null : await res.json().catch(() => null) };
  }, { kind: "create" });
  const [locked, setLocked] = useState(false);
  // 저장하지 못하면 화면을 옮긴다 — 화면이 막았으면 첫 오류 칸으로, api 가 막았으면 안내(폼 맨 아래)로. 위쪽 버튼을 누르면 안내가
  // 화면 밖에 떠 제자리인 것처럼 보였다. 같은 이유로 다시 실패해도 옮기도록 횟수로 센다.
  // nearest — 안내는 폼 맨 끝이라 center 로는 본문 스크롤이 끝나도 못 미쳐, 남은 만큼 바깥 틀(AdminFrame 의 overflow-y-hidden
  // 상자)까지 밀어 올려 화면 아래가 빈 공간으로 남았다. nearest 는 본문 안에서 보일 만큼만 옮긴다.
  const failureRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [failures, setFailures] = useState(0);
  useEffect(() => {
    if (!failures) return;
    const target = failureRef.current ?? formRef.current?.querySelector("[data-invalid]");
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [failures]);
  const fail = (message: string) => {
    setServerError(message);
    setFailures((n) => n + 1);
  };
  // 같은 점포에 진행 중 계약이 있어 저장하지 못했을 때 — 대체를 확인받아 같은 본문에 그 목록을 실어 다시 보낸다.
  // paper 면 종이 계약 등록(날인본과 함께)이었다. correcting 이면 종이 계약이 기간이 겹치는 체결 완료와 부딪혀(SIGNED_CONTRACT_OVERLAP)
  // 「잘못 올린 계약 바로잡기」를 묻는다 — 확인하면 correctSignedContracts 를 켜 체결 완료도 대체한다(WHALEERP-156).
  const [replace, setReplace] = useState<{ body: CreateContractBody; list: InProgressContract[]; paper: boolean; correcting: boolean } | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  // 종이 계약 날인본(CTR-23). 근로계약서는 필수, 따로 날인한 임금계약서는 선택. 고르는 순간 형식 · 크기를 먼저 본다(api 가 내용으로 다시 본다).
  const [files, setFiles] = useState<{ employment: File | null; wage: File | null }>({ employment: null, wage: null });
  const [fileErrors, setFileErrors] = useState<{ employment?: string; wage?: string }>({});
  const paperTypes = paperFileTypesOf(labels.attachmentFileType.map((v) => v.value));
  const paper = form.contractMethod === "PAPER";
  const pickFile = (key: "employment" | "wage", file: File | undefined) => {
    const error = file ? paperFileError(file, paperTypes) : null;
    setFileErrors((e) => ({ ...e, [key]: error ?? undefined }));
    setFiles((f) => ({ ...f, [key]: file && !error ? file : null }));
  };

  // 막는 이유는 마지막으로 누른 저장 방식 기준으로 보인다.
  const [lastTemporary, setLastTemporary] = useState(false);
  // 칸 아래 오류는 저장을 한 번 누른 뒤부터, 고칠 때마다 다시 본다
  const errs: Partial<Record<ProblemField, string[]>> = tried ? problemsByField(fieldProblems(form, lastTemporary, files.employment !== null, previousStartDate)) : {};
  const minor = isMinor(form);
  const holiday = weeklyHolidayOf(form);
  const dayLabel = (d: Weekday) => labelOf(labels.weekday, d);

  // 임시저장(DRAFT)은 직원 칸과 근무지만 있으면 되고, 초안 저장(발송 대기)은 다 채워야 한다(근로계약은 키만 NOT NULL).
  const save = (temporary: boolean) => {
    setTried(true);
    setLastTemporary(temporary);
    setServerError("");
    if (fieldProblems(form, temporary, files.employment !== null, previousStartDate).length) {
      setFailures((n) => n + 1);
      return;
    }
    // 종이 계약 등록은 날인본과 함께 보낸다. 임시저장은 종이 계약이어도 파일 없이 JSON 으로 둔다.
    // 직전 계약은 처음 저장(POST)에만 싣는다 — 이어 쓰기(PUT)는 계약에 남은 직전 계약을 api 가 그대로 쓴다(front #135 code-review)
    const body = (b: CreateContractBody): CreateContractBody => (previousContractId && !contractId ? { ...b, previousContractId } : b);
    if (paper && !temporary) sendPaper(body(toBody(form)));
    else send(body(toBody(form, temporary)));
  };

  const send = (body: CreateContractBody) =>
    startSaving(async () => {
      // 성공하면 액션이 목록으로 보낸다. 돌아왔다면 실패다.
      // 액션의 redirect(성공 · 보내기 실패)는 callSave 가 다시 던져 그 목적지로 간다
      const result = await callSave(() => (contractId ? update(contractId, body, back) : create(body, back)), unstable_rethrow);
      if (result === SAVE_CALL_LOST) {
        // 서버 액션 호출 자체가 끊겼다(앞단 504 · 배포 중 재시작 · 네트워크) — 저장 = 발송이라 이미 저장 · 발송됐을 수 있다.
        // 이어 쓰기는 상세로 옮겨 알리고, 새 계약은 같은 폼으로 다시 저장하지 못하게 막는다(front #50 재리뷰).
        if (contractId) {
          router.replace(withBack(`/contracts/${contractId}?send=unknown`, back));
          return;
        }
        setLocked(true);
        fail(SAVE_UNKNOWN_NEW);
        return;
      }
      if (result.inProgress) {
        setReplace({ body, list: result.inProgress, paper: false, correcting: false });
        return;
      }
      setReplace(null);
      // 결과를 받지 못했다 — 저장 · 발송됐을 수 있어 이 폼으로는 다시 저장하지 않는다(front #50 리뷰)
      if (result.locked) setLocked(true);
      fail(result.error);
    });

  // 종이 계약 등록 — 날인본이 10MB 까지라 서버 액션(6MB 한도) 대신 라우트 핸들러(/contracts/paper)로 보낸다.
  const sendPaper = (body: CreateContractBody) =>
    startSaving(async () => {
      const data = new FormData();
      data.set("data", JSON.stringify(body));
      if (files.employment) data.set("employmentContract", files.employment);
      if (files.wage) data.set("wageContract", files.wage);
      if (contractId) data.set("contractId", String(contractId));
      let result: SaveResult & { ok?: boolean; status?: string | null; draftAction?: string | null };
      try {
        const res = await postPaper(data);
        // 세션이 끊겼다 — proxy · 핸들러가 쿠키를 지우고 401 을 준다. 로그인 화면으로 보낸다.
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        result = (res.body ?? { error: `요청이 실패했습니다 (HTTP ${res.status})` }) as typeof result;
      } catch {
        result = { error: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
      }
      if (result.ok) {
        // 저장 뒤 안내는 서버 액션과 같이 저장 응답으로 고른다(종이 계약 등록이면 체결 완료 — 쿠키 SAVED_COOKIE, WHALEERP-132)
        const kind = savedKindOf(result);
        if (kind) document.cookie = `${SAVED_COOKIE}=${kind}; path=/contracts; max-age=${SAVED_COOKIE_MAX_AGE}; samesite=lax`;
        router.push(listAfterSave(back, contractId ? body.storeId : null));
        return;
      }
      // 기간이 겹치는 체결 완료(SIGNED_CONTRACT_OVERLAP)면 바로잡기를 묻는다. 재계약은 api 가 RENEWAL_SIGNED_OVERLAP 으로 막기만 해
      // signedOverlap 이 없고 아래 fail 이 그 문장을 보인다 — 재계약에 바로잡기를 묻지 않게 한 번 더 막는다(front #135 code-review)
      if (result.signedOverlap && !body.previousContractId) {
        setReplace({ body, list: result.signedOverlap, paper: true, correcting: true });
        return;
      }
      // 바로잡기로 다시 보냈는데 그사이 대체할 목록이 바뀌었으면 api 가 지금 목록으로 다시 묻는다 — 바로잡기 문구는 목록에 체결
      // 완료가 있을 때만 보이고(진행 중 계약만이면 대체 문구, front #135 code-review), 그때는 본문에서 바로잡기도 뺀다 — 문구와 본문이
      // 한 판정을 따른다(front #135 재리뷰)
      if (result.inProgress) {
        const correcting = stillCorrecting(body, result.inProgress);
        setReplace({ body, list: result.inProgress, paper: true, correcting });
        return;
      }
      setReplace(null);
      fail(result.error);
    });

  // 요일을 켜고 끄면 그 요일의 표 시간은 위 근무시간 · 휴게시간으로 돌아간다(데모 확인 2026-10-15).
  const toggleDay = (d: Weekday) =>
    setForm((f) => {
      const dayTimes = { ...f.dayTimes };
      delete dayTimes[d];
      return { ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d], dayTimes };
    });
  // 위 근무시간 · 휴게시간을 바꾸면 켜진 요일을 모두 그 값으로 다시 채운다 — 표에서 요일별로 고친 시간은 덮어쓴다.
  const setTop = (key: "work" | "rest", value: TimeSpan) => setForm((f) => ({ ...f, [key]: value, dayTimes: {} }));
  // 파트타이머 표에서 한 요일의 시간을 고친다
  const setDay = (d: Weekday, key: keyof DayTimes, value: TimeSpan) =>
    setForm((f) => ({ ...f, dayTimes: { ...f.dayTimes, [d]: { ...timesOf(f, d), [key]: value } } }));

  // 월급은 저장하지 않고 고용 형태별 급여 표로 셈해 보인다(현업 엑셀 견본, 2026-10-13).
  const monthly = monthlyWage(form);
  const fullPay = fullTimePay(form);
  const partPay = partTimePay(form);
  const wageNumber = Number(form.wage.replace(/\D/g, "")) || 0;
  const partTime = form.employmentType === "PART_TIME";

  // 소정근로시간 표. 파트타이머면 같은 표에 근무시간 · 시급 · 소계 열과 주휴수당 · 주급 · 월급여 줄을 붙이고,
  // 근무하는 요일의 시업 · 종업 · 휴게는 위 근무시간과 같은 시 · 분 상자로 요일마다 고친다(데모 확인 2026-10-15).
  const hourRows: PayRow[] = WEEKDAYS.map((d, i) => {
    const on = form.days.includes(d);
    const t = timesOf(form, d);
    const text = (v: HourMinute) => (on ? `${v.hour}:${v.minute}` : "-");
    const pick = (key: keyof DayTimes, end: "start" | "end", what: string) =>
      on ? (
        <TimePick label={`${dayLabel(d)}요일 ${what}`} value={t[key][end]} onChange={(v) => setDay(d, key, { ...t[key], [end]: v })} />
      ) : (
        "-"
      );
    const day = partPay.days[i];
    return {
      key: d,
      label: dayLabel(d),
      cells: partTime
        ? [pick("work", "start", "시업"), pick("work", "end", "종업"), pick("rest", "start", "휴게 시작"), pick("rest", "end", "휴게 종료")]
        : [text(t.work.start), text(t.work.end), text(t.rest.start), text(t.rest.end)],
      hours: hoursLabel(day.hours),
      wage: won(wageNumber),
      amount: won(day.amount),
    };
  });
  const scheduleRows: PayRow[] = partTime
    ? [
        ...hourRows,
        { key: "work", label: "소계", hours: <b>{hoursLabel(partPay.workHours)}</b>, amount: <b>{won(partPay.workPay)}</b> },
        { key: "holiday", label: "주휴수당", hours: hoursLabel(partPay.holidayHours), amount: won(partPay.holidayPay) },
        { key: "weekly", label: "주급", amount: <b>{won(partPay.weekly)}</b> },
        { key: "monthly", label: "월급여", amount: <b>{won(partPay.monthly)}</b> },
      ]
    : hourRows;
  const cell = (i: number) => (r: PayRow) => r.cells?.[i];
  const money = (key: "mealAllowance" | "carAllowance" | "childcareAllowance", label: string) => (
    <TextField aria-label={label} value={form[key]} inputMode="numeric" placeholder="0" onChange={(e) => set(key, formatWage(e.target.value))} />
  );
  const taxFreeRows: PayRow[] = [
    { key: "meal", label: "식대", amount: money("mealAllowance", "식대") },
    { key: "car", label: "자가운전보조금", amount: money("carAllowance", "자가운전보조금") },
    { key: "child", label: "육아수당", amount: money("childcareAllowance", "육아수당") },
    { key: "sum", label: "합계", amount: <Calc strong>{won(fullPay.taxFree)}</Calc> },
  ];
  const payRows: PayRow[] = [
    ...HOURS_FIELDS.map(([key, label], i): PayRow => ({
      key,
      label,
      hours: <TextField aria-label={`${label} 시간`} value={form[key]} inputMode="decimal" placeholder="0" onChange={(e) => set(key, formatHours(e.target.value))} />,
      amount: <Calc>{won(fullPay.items[i].amount)}</Calc>,
    })),
    { key: "sum", label: "합계(계산용)", amount: <Calc strong>{won(fullPay.payTotal)}</Calc> },
  ];

  const blocked = saving || !signedIn || minor || locked;
  const saveButtons = (
    <>
      {!correction && (
        <Button variant="soft" onClick={() => save(true)} disabled={blocked}>
          임시저장
        </Button>
      )}
      <Button onClick={() => save(false)} disabled={blocked}>
        {saving ? "저장 중" : correction ? "수정 저장" : paper ? "종이 계약 등록" : "초안 저장"}
      </Button>
    </>
  );

  return (
    // 막힌 입력칸(주휴일 등)은 이 화면에서만 회색 바탕이다(데모 확인 2026-10-15). 공통 FIELD 는 읽기 전용만 회색이라 1팀 화면은 그대로다.
    <div ref={formRef} className="flex flex-col gap-[12px] [&_:is(select,input:not([type=radio],[type=checkbox])):disabled]:bg-erp-thead-bg">
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">근로계약서</h2>
        <Button variant="off" href={backHrefOf(back)}>
          취소
        </Button>
        {deleteButton}
        {saveButtons}
      </div>

      <div className="flex flex-col gap-[24px]">
        {!signedIn && <Band risk title="로그인이 필요합니다" desc="관리자 로그인이 생기면 근무지를 고르고 저장할 수 있습니다." />}

        <FormGroup title="직원 정보">
          <FormRow>
            <Item label="이름" required errors={errs.name}>
              {(id) => <TextField id={id} value={form.name} maxLength={50} onChange={(e) => set("name", e.target.value)} />}
            </Item>
            <Item label="휴대전화번호" required help="초대 발송과 가입 연결의 기준값" errors={errs.phone}>
              {(id) => (
                <TextField
                  id={id}
                  value={form.phone}
                  inputMode="tel"
                  placeholder="010-0000-0000"
                  maxLength={13}
                  disabled={previousContractId !== undefined}
                  onChange={(e) => set("phone", formatPhone(e.target.value))}
                />
              )}
            </Item>
          </FormRow>
          <FormRow>
            <Item label="생년월일" required help="계약 시작일 기준 만 19세 미만이면 저장할 수 없다" errors={errs.birthDate}>
              {() => <DateField aria-label="생년월일" autoHyphen value={form.birthDate} onChange={(v) => set("birthDate", v)} />}
            </Item>
            {/* 성별 · 외국인 여부 — 직원이 가입하며 넣는 값과 이름 · 번호 · 생년월일과 함께 대조해 본인만 날인한다(WHALEERP-125) */}
            <Group label="성별" required help="가입 값과 대조해 본인만 날인한다" errors={errs.gender}>
              <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
                {GENDERS.map((v) => (
                  <Radio key={v} name="gender" label={labelOf(labels.gender, v)} checked={form.gender === v} onChange={() => set("gender", v)} />
                ))}
                <Checkbox label="외국인" checked={form.isForeigner} onChange={(e) => set("isForeigner", e.target.checked)} />
              </div>
            </Group>
            <Item label="소속 근무지" required errors={errs.storeId}>
              {(id) => (
                // 수정 요청은 이미 보낸 계약이라 근무지를 바꾸지 않는다 — 다른 근무지는 새 근로계약서로(api #58). 재계약도 직전 계약의 근무지다
                <Select id={id} value={form.storeId} disabled={correction || previousContractId !== undefined} onChange={(e) => set("storeId", e.target.value)}>
                  <option value="">선택</option>
                  {stores.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Item>
            <Item label="직무" required errors={errs.jobTitle}>
              {(id) => <TextField id={id} value={form.jobTitle} maxLength={50} placeholder="예: 바리스타" onChange={(e) => set("jobTitle", e.target.value)} />}
            </Item>
          </FormRow>
          {/* 기재사항 · 주민등록번호는 받지 않는다(WHALEERP-132). 가입 값은 계약서에 채우지 않고 날인 전 본인 대조에만 쓴다(2026-10-23, WHALEERP-130) */}
          <span className={HELP}>
            주소 등 직원 기재사항은 받지 않는다 — 직원이 가입하며 넣는 값은 계약서에 채우지 않고 날인 전 본인 대조에만 쓴다. 주민등록번호는 날인을
            마친 뒤 직원이 앱에서 넣는다.
          </span>
        </FormGroup>

        <FormGroup title="계약 방식">
          <Group label="고용 형태">
            <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              {(["FULL_TIME", "PART_TIME"] as const).map((v) => (
                <Radio key={v} name="employmentType" label={labelOf(labels.employmentType, v)} checked={form.employmentType === v} onChange={() => set("employmentType", v)} />
              ))}
            </div>
          </Group>
          <Group
            label="계약 방식"
            help={paper ? "당사자가 모두 날인한 근로계약서를 올려 등록하면 발송 · 날인 없이 체결 완료로 저장된다" : "초안 저장하면 곧바로 직원에게 보내고, 직원이 앱에서 날인한다"}
          >
            <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              {(["ELECTRONIC", "PAPER"] as const).map((v) => (
                <Radio
                  key={v}
                  name="contractMethod"
                  label={labelOf(labels.contractMethod, v)}
                  checked={form.contractMethod === v}
                  disabled={correction && v === "PAPER"}
                  onChange={() => set("contractMethod", v)}
                />
              ))}
            </div>
          </Group>
          {/* 종이 계약 날인본(CTR-23, 데모 contracts-new 의 파일 칸). 근로계약서는 필수, 임금계약서는 따로 작성한 경우만 */}
          {paper && (
            <FormRow>
              <Item label="근로계약서" required help={`당사자가 모두 날인한 파일. ${paperTypes.join(" · ")}, 10MB까지`}>
                {(id) => <PaperFile id={id} label="근로계약서" file={files.employment} error={fileErrors.employment ?? errs.employmentFile?.[0]} accept={paperFileAccept(paperTypes)} onPick={(f) => pickFile("employment", f)} />}
              </Item>
              <Item label="임금계약서" help="임금 약정을 따로 날인한 경우. 없으면 비워 둔다">
                {(id) => <PaperFile id={id} label="임금계약서" file={files.wage} error={fileErrors.wage} accept={paperFileAccept(paperTypes)} onPick={(f) => pickFile("wage", f)} />}
              </Item>
            </FormRow>
          )}
        </FormGroup>

        <FormGroup title="계약 조건">
          <FormRow>
            <Item label="계약 시작일" required help={previousStartDate ? `재계약은 직전 계약 시작일(${previousStartDate}) 다음 날부터` : undefined} errors={errs.startDate}>
              {() => <DateField aria-label="계약 시작일" value={form.startDate} onChange={(v) => set("startDate", v)} />}
            </Item>
            <Item label="계약 종료일" help="비워 두면 기간의 정함이 없는 계약" errors={errs.endDate}>
              {() => <DateField aria-label="계약 종료일" value={form.endDate} onChange={(v) => set("endDate", v)} />}
            </Item>
          </FormRow>
          <FormRow>
            <Group label="근무요일" errors={errs.days}>
              <span className="flex gap-[6px]">
                {/* 요일 단추는 칸 폭을 7등분해 채운다 */}
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={form.days.includes(d)}
                    onClick={() => toggleDay(d)}
                    className="grid h-[34px] min-w-[34px] flex-1 place-items-center rounded-[2px] border border-erp-field-line bg-white text-[14px] text-erp-label transition-colors duration-150 ease-out aria-pressed:border-erp-brand-soft aria-pressed:bg-erp-brand-soft aria-pressed:text-white"
                  >
                    {dayLabel(d)}
                  </button>
                ))}
              </span>
            </Group>
            <Group label="근무시간" errors={errs.work}>
              <SpanPick label="근무시간" value={form.work} onChange={(v) => setTop("work", v)} />
            </Group>
            <Group label="휴게시간" errors={errs.rest}>
              <SpanPick label="휴게시간" value={form.rest} onChange={(v) => setTop("rest", v)} />
            </Group>
          </FormRow>
          {/* 급여 표 — 흰 칸은 입력, 회색 칸은 셈한 값이다(현업 엑셀 견본, 2026-10-13). */}
          {/* 시급 · 월급 · 연봉 한 줄이 소정근로시간 표 위에 있다(데모 확인 2026-10-15). 생년월일 · 근무요일 줄처럼 3등분한다(파트타이머는 셋째 칸을 비운다). 시급은 고용 형태와 상관없이 한 칸이다(2026-10-12 재영). */}
          <FormRow>
            <Item label="시급" required help={`2026년 최저임금 ${MINIMUM_WAGE.toLocaleString("ko-KR")}원 이상`} errors={errs.wage}>
              {(id) => <TextField id={id} value={form.wage} inputMode="numeric" onChange={(e) => set("wage", formatWage(e.target.value))} />}
            </Item>
            <Item label="월급" help={form.employmentType === "FULL_TIME" ? "급여항목 합계 + 비과세 합계" : "주급 × 4.345"}>
              {(id) => <TextField id={id} readOnly value={monthly === null ? "" : won(monthly)} />}
            </Item>
            {form.employmentType === "FULL_TIME" ? (
              <Item label="연봉" help="월급 × 12">
                {(id) => <TextField id={id} readOnly value={monthly === null ? "" : won(fullPay.annual)} />}
              </Item>
            ) : (
              <div className="min-w-px flex-1" />
            )}
          </FormRow>
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center">
              <span className="flex-1 text-[14px] font-medium text-erp-label">소정근로시간</span>
              <span className="text-[14px] text-erp-label">
                주 <b className="font-semibold text-erp-ink">{weeklyHours(form).toFixed(1)}</b> 시간
              </span>
            </div>
            <DataTable
              columns={[
                { header: "요일", width: partTime ? "w-[90px]" : "w-[70px]", cell: (r: PayRow) => r.label },
                { header: "시업", cell: cell(0) },
                { header: "종업", cell: cell(1) },
                { header: "휴게 시작", cell: cell(2) },
                { header: "휴게 종료", cell: cell(3) },
                ...(partTime
                  ? [
                      { header: "근무시간", cell: (r: PayRow) => r.hours },
                      { header: "시급", cell: (r: PayRow) => r.wage },
                      { header: "소계", cell: (r: PayRow) => r.amount },
                    ]
                  : []),
              ]}
              rows={scheduleRows}
              rowKey={(r) => r.key}
            />
            {errs.schedule && (
              <div data-invalid>
                <FieldErrors errors={errs.schedule} />
              </div>
            )}
            <span className={HELP}>
              {partTime
                ? "요일마다 시업 · 종업 · 휴게를 고칠 수 있다. 위 근무시간 · 휴게시간을 바꾸거나 요일을 켜면 그 값으로 다시 채운다. 주휴시간은 주 15시간 이상일 때 주 시간 ÷ 5(8시간까지), 월급여는 주급 × 4.345."
                : "요일마다 같은 시간이 들어간다. 요일별로 다른 시간은 근무스케줄에서 고친다."}{" "}
              이 소정근로시간이 근무스케줄 기본값이 된다.
            </span>
          </div>
          {/* 급여 지급 방식은 소정근로시간 표 바로 밑(데모 확인 2026-10-15) */}
          <Group label="급여 지급 방식" required>
            <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              {(["ACCOUNT", "CASH"] as const).map((v) => (
                <Radio key={v} name="payMethod" label={labelOf(labels.payMethod, v)} checked={form.payMethod === v} onChange={() => set("payMethod", v)} />
              ))}
            </div>
          </Group>
          {!partTime && (
            <>
              <FormRow>
                <PayTable title="비과세 항목" help="금액은 원 단위. 0 원도 값으로 저장한다." errors={errs.allowances}>
                  <DataTable
                    columns={[
                      { header: "항목", align: "left", cell: (r: PayRow) => r.label },
                      { header: "금액", cell: (r: PayRow) => r.amount },
                    ]}
                    rows={taxFreeRows}
                    rowKey={(r) => r.key}
                  />
                </PayTable>
                <PayTable title="급여항목" help="시간은 월 · 30분(0.5) 단위. 연장 1.5배 · 야간 0.5배(가산분)로 셈한다." errors={errs.hours}>
                  <DataTable
                    columns={[
                      { header: "항목", align: "left", cell: (r: PayRow) => r.label },
                      { header: "시간", width: "w-[110px]", cell: (r: PayRow) => r.hours },
                      { header: "금액", cell: (r: PayRow) => r.amount },
                    ]}
                    rows={payRows}
                    rowKey={(r) => r.key}
                  />
                </PayTable>
              </FormRow>
            </>
          )}
          {/* 계산 기준(노무사 확인 2026-10-14, 질문 1 · 2 · 12 · 13): 주휴는 주 15시간 이상이고 그 주 소정근로일을 다 나온 주에만, 주휴시간 = 주 근로시간 ÷ 5.
              초과근무는 단시간근로자여도 1.5배(5인 미만 사업장은 1.0배 가능), 연장과 야간이 겹치면 2.0배, 계약하지 않은 요일 근무는 연장으로 1.5배. */}
          <span className={HELP}>
            주휴수당은 주 15시간 이상이고 그 주 소정근로일을 다 나온 주에만 주고, 주휴시간은 주 근로시간 ÷ 5 입니다. 연장과 야간이 겹치면 2.0배, 계약하지 않은 요일에 일한
            시간은 연장(1.5배)으로 셉니다. 셈한 값은 저장하지 않습니다.
          </span>
          <FormRow>
            {/* 주휴일은 특정 요일로 정해 계약서 휴일 조항에 적는다(노무사 확인 2026-10-14, 질문 4). 주 15시간 미만이면 없음이라 고를 수 없다. */}
            <Item
              label="주휴일"
              required={holiday !== null}
              help="특정 요일로 정해 계약서 휴일 조항에 적는다. 근무하는 요일은 고를 수 없고, 주 15시간 미만이면 주휴가 없다"
              errors={errs.weeklyHoliday}
            >
              {(id) =>
                holiday === null ? (
                  <Select id={id} disabled value="">
                    <option value="">없음 (주 15시간 미만)</option>
                  </Select>
                ) : (
                  <Select id={id} value={holiday === "NO_DAY_OFF" ? "" : holiday} onChange={(e) => set("weeklyHoliday", e.target.value as Weekday)}>
                    {holiday === "NO_DAY_OFF" && <option value="">쉬는 요일이 없습니다</option>}
                    {WEEKDAYS.map((d) => (
                      <option key={d} value={d} disabled={form.days.includes(d)}>
                        {dayLabel(d)}
                      </option>
                    ))}
                  </Select>
                )
              }
            </Item>
            <Group label="임금지급일" help="31 을 넣으면 말일로 본다" errors={errs.payDay}>
              <span className="flex gap-[6px]">
                <span className="w-[100px] shrink-0">
                  <Select aria-label="임금지급 월" value={form.payMonth} onChange={(e) => set("payMonth", e.target.value as Form["payMonth"])}>
                    {(["NEXT_MONTH", "CURRENT_MONTH"] as const).map((v) => (
                      <option key={v} value={v}>
                        {labelOf(labels.payMonth, v)}
                      </option>
                    ))}
                  </Select>
                </span>
                <TextField aria-label="임금지급일 날짜" value={form.payDay} inputMode="numeric" maxLength={2} onChange={(e) => set("payDay", e.target.value.replace(/\D/g, ""))} />
              </span>
            </Group>
            <Item label="근무 장소" help="계약서 근무 장소 조항에 들어간다. 근무지 점포와 따로 적는다">
              {(id) => (
                <TextField id={id} value={form.workLocation} maxLength={200} placeholder="예: 서울 성동구 연무장길 18, 1층" onChange={(e) => set("workLocation", e.target.value)} />
              )}
            </Item>
          </FormRow>
        </FormGroup>

        <FormGroup title="계약서 조항">
          <FormRow>
            <Item label="연차휴가" help="계약서 연차휴가 조항에 그대로 들어간다">
              {(id) => <Textarea id={id} rows={2} maxLength={1000} value={form.annualLeaveTerms} onChange={(e) => set("annualLeaveTerms", e.target.value)} />}
            </Item>
            <Item label="퇴직금" help="계약서 퇴직금 조항에 그대로 들어간다">
              {(id) => <Textarea id={id} rows={2} maxLength={1000} value={form.severancePayTerms} onChange={(e) => set("severancePayTerms", e.target.value)} />}
            </Item>
          </FormRow>
        </FormGroup>

        {/* 수습(노무사 확인 2026-10-14, 질문 19): 정직원만, 4대보험 가입 여부 위. 필수는 아니지만 수습 대상이면 계약서에 적는다.
            계약 기간이 1년 이상(또는 기간의 정함 없음)일 때만, 기간은 최대 3개월, 감액해도 최저임금의 90% 이상. 급여명세서는 수습 기간이면 그렇다고 표기한다. */}
        {!partTime && (
          <FormGroup title="수습">
            <Group label="수습 여부">
              <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
                <Radio name="probation" label="없음" checked={!form.probation} onChange={() => set("probation", false)} />
                <Radio name="probation" label="적용" checked={form.probation} onChange={() => set("probation", true)} />
              </div>
            </Group>
            {form.probation && (
              <FormRow>
                <Item label="수습 기간" required help="최대 3개월. 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둘 수 있다" errors={errs.probationMonths}>
                  {(id) => (
                    <Select id={id} value={form.probationMonths} onChange={(e) => set("probationMonths", e.target.value as Form["probationMonths"])}>
                      {(["1", "2", "3"] as const).map((m) => (
                        <option key={m} value={m}>
                          {m}개월
                        </option>
                      ))}
                    </Select>
                  )}
                </Item>
                <Item label="임금 감액률" required help="최대 10%. 감액하지 않으면 0" errors={errs.probationRate}>
                  {(id) => (
                    <span className="flex items-center gap-[8px] text-[14px] text-erp-ink">
                      <TextField id={id} value={form.probationRate} inputMode="numeric" maxLength={2} onChange={(e) => set("probationRate", e.target.value.replace(/\D/g, ""))} />%
                    </span>
                  )}
                </Item>
                <Item
                  label="수습 중 시급"
                  help={`시급 × (1 − 감액률). 최저임금의 90%(${PROBATION_WAGE_FLOOR.toLocaleString("ko-KR")}원) 이상이어야 한다`}
                  errors={errs.probationWage}
                >
                  {(id) => <TextField id={id} readOnly value={won(probationWage(form))} />}
                </Item>
              </FormRow>
            )}
          </FormGroup>
        )}

        <FormGroup title="4대보험 가입 여부">
          <div className="flex gap-[24px]">
            <Checkbox label="건강보험 · 국민연금" checked={form.isHealthPensionInsured} onChange={(e) => set("isHealthPensionInsured", e.target.checked)} />
            <Checkbox label="고용보험 · 산재보험" checked={form.isEmploymentInjuryInsured} onChange={(e) => set("isEmploymentInjuryInsured", e.target.checked)} />
          </div>
          {/* 월 60시간 이상이면 가입이 원칙(노무사 확인 2026-10-14, 질문 6). 3.3% 원천징수는 부과 기관이 달라 4대보험과 따로 공제한다. */}
          <span className={HELP} aria-live="polite">
            이 계약은 월 약 <b className="font-semibold text-erp-ink">{Math.round(monthlyHours(form))}</b>시간이라{" "}
            <b className="font-semibold text-erp-ink">{monthlyHours(form) >= 60 ? "4대보험 가입 대상입니다" : "4대보험 가입 대상이 아닙니다"}</b>. 월 60시간 이상 일하면 가입이 원칙이고,
            3.3% 원천징수와는 따로 공제합니다.
          </span>
        </FormGroup>

        <Band
          risk={minor}
          title="만 19세 미만 직원은 등록할 수 없습니다"
          desc="근로계약·출퇴근·급여는 점포에서 따로 관리해 주세요. 계약 시작일 기준으로 따지며, 만 19세 미만이면 저장이 막히고 초대도 나가지 않습니다."
        />
        {/* 화면이 막은 유효성 오류는 칸 아래에 보이고, 여기는 api 가 막은 것(특정 칸에 붙일 수 없는 것)만이다(WHALEERP-631) */}
        {serverError && (
          <div ref={failureRef}>
            <Band risk title="저장하지 못했습니다" desc={serverError} />
          </div>
        )}
        <div className="flex items-center gap-[6px]">
          <span className="flex-1 text-[14px] text-erp-label">
            {correction
              ? "직원이 수정을 요청한 근로계약서다. 다 채워 수정 저장하면 곧바로 서명 대기로 다시 보낸다(새 날인 기한 30일). 근무지는 바꿀 수 없다."
              : paper
              ? "임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 되고 날인본은 올리지 않는다. 종이 계약 등록은 다 채우고 근로계약서 날인본을 올려야 하며 체결 완료로 남는다."
              : "임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 되고 보내지 않는다. 초안 저장은 다 채워야 하고 곧바로 직원에게 보낸다 — 계정이 없는 번호면 가입 초대 알림톡(발송 대기), 있으면 서명 대기."}
          </span>
          {saveButtons}
        </div>
      </div>

      {/* 같은 점포 · 같은 번호의 진행 중 계약(WHALEERP-129). 대체하면 임시저장은 지우고, 발송 대기 · 서명 대기 · 수정 요청은 종료한다.
          종이 계약이 기간이 겹치는 체결 완료와 부딪히면 대체하지 않고 「잘못 올린 계약 바로잡기」를 묻는다 — 바로잡기만 체결 완료도
          곧바로 종료한다. 재계약이면 앞 계약은 새 계약 시작일에 하루 배치가 닫는다(WHALEERP-156). */}
      <ConfirmDialog
        open={replace !== null}
        title={replace?.correcting ? "잘못 올린 계약을 바로잡으시겠습니까?" : "기존 근로계약을 대체하시겠습니까?"}
        confirmLabel={saving ? "저장 중" : replace?.correcting ? "바로잡고 등록" : "대체하고 저장"}
        busy={saving}
        wide
        onCancel={() => setReplace(null)}
        onConfirm={() => {
          if (!replace) return;
          // 다시 물은 목록만 보낸다 — api(checkReplace)는 지금 목록과 같은 집합만 받고, 409 는 늘 지금 목록 전체를 싣는다. 앞서 고른 것을
          // 합치면 그사이 빠진 계약 때문에 같은 409 가 되풀이된다(front #135 재리뷰)
          const body = replaceConfirmBody(replace.body, replace.list, replace.correcting);
          if (replace.paper) sendPaper(body);
          else send(body);
        }}
      >
        <p>
          {replace?.correcting
            ? "이 점포에 같은 휴대전화번호로 계약 기간이 겹치는 체결 완료 근로계약이 있습니다."
            : "이 점포에 같은 휴대전화번호로 진행 중인 근로계약이 있습니다."}
        </p>
        <ul className="mt-[6px] list-disc pl-[18px]">
          {replace?.list.map((c) => (
            <li key={c.contractId}>{inProgressLine(c, labelOf(labels.contractStatus, c.status))}</li>
          ))}
        </ul>
        {replace?.correcting ? (
          <p className="mt-[6px]">
            같은 계약서를 다시 올렸다면 등록하지 않아도 됩니다. 재계약이면 기존 계약 상세의 [새 계약]으로 작성해 주세요. 잘못 올린 계약이면 바로잡기로 위 계약을 종료하고 이 계약서로 등록합니다(임시저장은 지웁니다).
          </p>
        ) : (
          <p className="mt-[6px]">대체하면 임시저장은 지우고, 발송 대기 · 서명 대기 · 수정 요청 계약은 종료합니다.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
