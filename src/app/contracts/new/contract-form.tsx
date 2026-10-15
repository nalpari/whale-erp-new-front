"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { Button, Checkbox, ConfirmDialog, DataTable, DateField, FormGroup, FormRow, Radio, Select, Textarea, TextField } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { createContract, updateContract } from "./actions";
import {
  formatHours,
  formatPhone,
  formatWage,
  fullTimePay,
  initialForm,
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
  problems,
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
function PayTable({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[8px]">
      <span className={LABEL}>{title}</span>
      {children}
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

type PayRow = { key: string; label: string; cells?: ReactNode[]; hours?: ReactNode; wage?: ReactNode; amount: ReactNode };

// 라벨 · 입력 · 도움말 한 칸. 공통 Field 는 라벨이 글자뿐이라 필수 표시(*)를 달 수 없어 여기서 묶는다.
// 필수 표시 색 #e93737 은 DESIGN.md 의 「위험」 한 번 쓰는 색이다(데모 biz-form REQ 와 같다).
function Item({ label, required, help, width, children }: { label: string; required?: boolean; help?: string; width?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-[8px] ${width ?? "min-w-px flex-1"}`}>
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
function Group({ label, required, children, help }: { label: string; required?: boolean; children: ReactNode; help?: string }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-px flex-1 flex-col gap-[8px]">
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
}: {
  stores: { storeId: number; name: string }[];
  labels: ContractFormLabels;
  signedIn: boolean;
  /** 있으면 임시저장 이어 쓰기 — PUT 으로 저장한다 */
  contractId?: number;
  initial?: Form;
  /** 이어 쓰기 화면의 임시저장 삭제. 취소와 임시저장 사이에 선다 */
  deleteButton?: ReactNode;
}) {
  const [form, setForm] = useState<Form>(() => initial ?? initialForm(stores.length === 1 ? String(stores[0].storeId) : ""));
  // 저장을 한 번 누른 뒤부터 막는 이유를 보인다. 처음부터 빨간 줄을 띄우지 않는다.
  const router = useRouter();
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saving, startSaving] = useTransition();
  // 저장하지 못하면 안내(폼 맨 아래)로 화면을 옮긴다 — 위쪽 버튼을 누르면 안내가 화면 밖에 떠 제자리인 것처럼 보였다.
  // 같은 이유로 다시 실패해도 옮기도록 횟수로 센다.
  const failureRef = useRef<HTMLDivElement>(null);
  const [failures, setFailures] = useState(0);
  useEffect(() => {
    if (failures) failureRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [failures]);
  const fail = (message: string) => {
    setServerError(message);
    setFailures((n) => n + 1);
  };
  // 같은 점포에 진행 중 계약이 있어 저장하지 못했을 때 — 대체를 확인받아 같은 본문에 그 목록을 실어 다시 보낸다.
  // paper 면 종이 계약 등록(날인본과 함께)이었다.
  const [replace, setReplace] = useState<{ body: CreateContractBody; list: InProgressContract[]; paper: boolean } | null>(null);
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
  const issues = problems(form, lastTemporary, files.employment !== null);
  const minor = isMinor(form);
  const holiday = weeklyHolidayOf(form);
  const dayLabel = (d: Weekday) => labelOf(labels.weekday, d);

  // 임시저장(DRAFT)은 직원 칸과 근무지만 있으면 되고, 초안 저장(발송 대기)은 다 채워야 한다(근로계약은 키만 NOT NULL).
  const save = (temporary: boolean) => {
    setTried(true);
    setLastTemporary(temporary);
    setServerError("");
    if (problems(form, temporary, files.employment !== null).length) {
      setFailures((n) => n + 1);
      return;
    }
    // 종이 계약 등록은 날인본과 함께 보낸다. 임시저장은 종이 계약이어도 파일 없이 JSON 으로 둔다.
    if (paper && !temporary) sendPaper(toBody(form));
    else send(toBody(form, temporary));
  };

  const send = (body: CreateContractBody) =>
    startSaving(async () => {
      // 성공하면 액션이 목록으로 보낸다. 돌아왔다면 실패다.
      const result = contractId ? await updateContract(contractId, body) : await createContract(body);
      if (result.inProgress) {
        setReplace({ body, list: result.inProgress, paper: false });
        return;
      }
      setReplace(null);
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
      let result: SaveResult & { ok?: boolean };
      try {
        const res = await fetch("/contracts/paper", { method: "POST", body: data });
        // 세션이 끊겼다 — proxy · 핸들러가 쿠키를 지우고 401 을 준다. 로그인 화면으로 보낸다.
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        result = (await res.json().catch(() => ({ error: `요청이 실패했습니다 (HTTP ${res.status})` }))) as SaveResult & { ok?: boolean };
      } catch {
        result = { error: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요" };
      }
      if (result.ok) {
        router.push("/contracts");
        return;
      }
      if (result.inProgress) {
        setReplace({ body, list: result.inProgress, paper: true });
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

  const blocked = saving || !signedIn || minor;
  const saveButtons = (
    <>
      <Button variant="soft" onClick={() => save(true)} disabled={blocked}>
        임시저장
      </Button>
      <Button onClick={() => save(false)} disabled={blocked}>
        {saving ? "저장 중" : paper ? "종이 계약 등록" : "초안 저장"}
      </Button>
    </>
  );

  return (
    // 막힌 입력칸(주휴일 등)은 이 화면에서만 회색 바탕이다(데모 확인 2026-10-15). 공통 FIELD 는 읽기 전용만 회색이라 1팀 화면은 그대로다.
    <div className="flex flex-col gap-[12px] [&_:is(select,input:not([type=radio],[type=checkbox])):disabled]:bg-erp-thead-bg">
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">근로계약서</h2>
        <Button variant="off" href="/contracts">
          취소
        </Button>
        {deleteButton}
        {saveButtons}
      </div>

      <div className="flex flex-col gap-[24px]">
        {!signedIn && <Band risk title="로그인이 필요합니다" desc="관리자 로그인이 생기면 근무지를 고르고 저장할 수 있습니다." />}

        <FormGroup title="직원 정보">
          <FormRow>
            <Item label="이름" required>
              {(id) => <TextField id={id} value={form.name} maxLength={50} onChange={(e) => set("name", e.target.value)} />}
            </Item>
            <Item label="휴대전화번호" required help="초대 발송과 가입 연결의 기준값">
              {(id) => <TextField id={id} value={form.phone} inputMode="tel" placeholder="010-0000-0000" maxLength={13} onChange={(e) => set("phone", formatPhone(e.target.value))} />}
            </Item>
          </FormRow>
          <FormRow>
            <Item label="생년월일" required help="계약 시작일 기준 만 19세 미만이면 저장할 수 없다">
              {() => <DateField aria-label="생년월일" autoHyphen value={form.birthDate} onChange={(v) => set("birthDate", v)} />}
            </Item>
            <Item label="소속 근무지" required>
              {(id) => (
                <Select id={id} value={form.storeId} onChange={(e) => set("storeId", e.target.value)}>
                  <option value="">선택</option>
                  {stores.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            </Item>
            <Item label="직무" required>
              {(id) => <TextField id={id} value={form.jobTitle} maxLength={50} placeholder="예: 바리스타" onChange={(e) => set("jobTitle", e.target.value)} />}
            </Item>
          </FormRow>
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
            help={paper ? "당사자가 모두 날인한 근로계약서를 올려 등록하면 발송 · 날인 없이 체결 완료로 저장된다" : "초안 저장 뒤 근로계약서를 발송해 직원이 앱에서 날인한다"}
          >
            <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              {(["ELECTRONIC", "PAPER"] as const).map((v) => (
                <Radio key={v} name="contractMethod" label={labelOf(labels.contractMethod, v)} checked={form.contractMethod === v} onChange={() => set("contractMethod", v)} />
              ))}
            </div>
          </Group>
          {/* 종이 계약 날인본(CTR-23, 데모 contracts-new 의 파일 칸). 근로계약서는 필수, 임금계약서는 따로 작성한 경우만 */}
          {paper && (
            <FormRow>
              <Item label="근로계약서" required help={`당사자가 모두 날인한 파일. ${paperTypes.join(" · ")}, 10MB까지`}>
                {(id) => <PaperFile id={id} label="근로계약서" file={files.employment} error={fileErrors.employment} accept={paperFileAccept(paperTypes)} onPick={(f) => pickFile("employment", f)} />}
              </Item>
              <Item label="임금계약서" help="임금 약정을 따로 날인한 경우. 없으면 비워 둔다">
                {(id) => <PaperFile id={id} label="임금계약서" file={files.wage} error={fileErrors.wage} accept={paperFileAccept(paperTypes)} onPick={(f) => pickFile("wage", f)} />}
              </Item>
            </FormRow>
          )}
        </FormGroup>

        <FormGroup title="계약 조건">
          <FormRow>
            <Item label="계약 시작일" required>
              {() => <DateField aria-label="계약 시작일" value={form.startDate} onChange={(v) => set("startDate", v)} />}
            </Item>
            <Item label="계약 종료일" help="비워 두면 기간의 정함이 없는 계약">
              {() => <DateField aria-label="계약 종료일" value={form.endDate} onChange={(v) => set("endDate", v)} />}
            </Item>
          </FormRow>
          <FormRow>
            <Group label="근무요일">
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
            <Group label="근무시간">
              <SpanPick label="근무시간" value={form.work} onChange={(v) => setTop("work", v)} />
            </Group>
            <Group label="휴게시간">
              <SpanPick label="휴게시간" value={form.rest} onChange={(v) => setTop("rest", v)} />
            </Group>
          </FormRow>
          {/* 급여 표 — 흰 칸은 입력, 회색 칸은 셈한 값이다(현업 엑셀 견본, 2026-10-13). */}
          {/* 시급 · 월급 · 연봉 한 줄이 소정근로시간 표 위에 있다(데모 확인 2026-10-15). 생년월일 · 근무요일 줄처럼 3등분한다(파트타이머는 셋째 칸을 비운다). 시급은 고용 형태와 상관없이 한 칸이다(2026-10-12 재영). */}
          <FormRow>
            <Item label="시급" required help={`2026년 최저임금 ${MINIMUM_WAGE.toLocaleString("ko-KR")}원 이상`}>
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
            <span className={HELP}>
              {partTime
                ? "요일마다 시업 · 종업 · 휴게를 고칠 수 있다. 위 근무시간 · 휴게시간을 바꾸거나 요일을 켜면 그 값으로 다시 채운다. 주휴시간은 주 15시간 이상일 때 주 시간 ÷ 5(8시간까지), 월급여는 주급 × 4.345."
                : "요일마다 같은 시간이 들어간다. 요일별로 다른 시간은 근무스케줄에서 고친다."}
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
                <PayTable title="비과세 항목" help="금액은 원 단위. 0 원도 값으로 저장한다.">
                  <DataTable
                    columns={[
                      { header: "항목", align: "left", cell: (r: PayRow) => r.label },
                      { header: "금액", cell: (r: PayRow) => r.amount },
                    ]}
                    rows={taxFreeRows}
                    rowKey={(r) => r.key}
                  />
                </PayTable>
                <PayTable title="급여항목" help="시간은 월 · 30분(0.5) 단위. 연장 1.5배 · 야간 0.5배(가산분)로 셈한다.">
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
            <Item label="주휴일" required={holiday !== null} help="특정 요일로 정해 계약서 휴일 조항에 적는다. 근무하는 요일은 고를 수 없고, 주 15시간 미만이면 주휴가 없다">
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
            <Group label="임금지급일" help="31 을 넣으면 말일로 본다">
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
                <Item label="수습 기간" required help="최대 3개월. 계약 기간이 1년 이상이거나 기간의 정함이 없을 때만 둘 수 있다">
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
                <Item label="임금 감액률" required help="최대 10%. 감액하지 않으면 0">
                  {(id) => (
                    <span className="flex items-center gap-[8px] text-[14px] text-erp-ink">
                      <TextField id={id} value={form.probationRate} inputMode="numeric" maxLength={2} onChange={(e) => set("probationRate", e.target.value.replace(/\D/g, ""))} />%
                    </span>
                  )}
                </Item>
                <Item label="수습 중 시급" help={`시급 × (1 − 감액률). 최저임금의 90%(${PROBATION_WAGE_FLOOR.toLocaleString("ko-KR")}원) 이상이어야 한다`}>
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
        {(serverError || (tried && issues.length > 0)) && (
          <div ref={failureRef}>
            <Band
              risk
              title="저장하지 못했습니다"
              desc={
                <ul className="list-disc pl-[18px]">
                  {(serverError ? [serverError] : issues).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              }
            />
          </div>
        )}
        <div className="flex items-center gap-[6px]">
          <span className="flex-1 text-[14px] text-erp-label">
            {paper
              ? "임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 되고 날인본은 올리지 않는다. 종이 계약 등록은 다 채우고 근로계약서 날인본을 올려야 하며 체결 완료로 남는다."
              : "임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 된다. 초안 저장은 다 채워야 하고 발송 대기로 남는다. 초대 발송은 아직 없다."}
          </span>
          {saveButtons}
        </div>
      </div>

      {/* 같은 점포 · 같은 번호의 진행 중 계약(WHALEERP-129). 대체하면 임시저장은 지우고, 발송 대기 · 서명 대기는 종료한다.
          종이 계약 등록은 체결 완료도 묻고 종료한다 — 두 번 눌러 두 벌이 생기지 않게(api #49). */}
      <ConfirmDialog
        open={replace !== null}
        title="기존 근로계약을 대체하시겠습니까?"
        confirmLabel={saving ? "저장 중" : "대체하고 저장"}
        busy={saving}
        wide
        onCancel={() => setReplace(null)}
        onConfirm={() => {
          if (!replace) return;
          const body = { ...replace.body, replaceContractIds: replace.list.map((c) => c.contractId) };
          if (replace.paper) sendPaper(body);
          else send(body);
        }}
      >
        <p>이 점포에 같은 휴대전화번호로 진행 중인 근로계약이 있습니다.</p>
        <ul className="mt-[6px] list-disc pl-[18px]">
          {replace?.list.map((c) => (
            <li key={c.contractId}>
              {labelOf(labels.contractStatus, c.status)} · 계약 {c.contractId}
            </li>
          ))}
        </ul>
        <p className="mt-[6px]">
          대체하면 임시저장은 지우고, 발송 대기 · 서명 대기{replace?.paper ? " · 체결 완료" : ""} 계약은 종료합니다.
        </p>
      </ConfirmDialog>
    </div>
  );
}
