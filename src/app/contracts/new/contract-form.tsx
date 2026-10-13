"use client";

import { useId, useState, useTransition, type ReactNode } from "react";
import { Button, Checkbox, DataTable, DateField, FormGroup, FormRow, Radio, Select, TextField } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { createContract, updateContract } from "./actions";
import {
  formatPhone,
  formatWage,
  initialForm,
  isMinor,
  problems,
  toBody,
  weeklyHolidayOf,
  weeklyHours,
  WEEKDAYS,
  type ContractForm as Form,
  type HourMinute,
  type TimeSpan,
  type Weekday,
} from "./contract-form-model";

export interface ContractFormLabels {
  employmentType: EnumValue[];
  weekday: EnumValue[];
  payMonth: EnumValue[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const HELP = "text-[12px] leading-[1.5] text-erp-muted";

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

// 입력이 여럿인 칸(라디오 · 요일 · 시각). <label> 하나로 묶을 수 없어 group 으로 둔다.
function Group({ label, children, help }: { label: string; children: ReactNode; help?: string }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-px flex-1 flex-col gap-[8px]">
      <span className="truncate text-[14px] font-medium text-erp-label">{label}</span>
      {children}
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

// 시 00~23, 분 00 · 30 (운영 정책 CTR-20 30분 단위)
function TimePick({ value, onChange, label }: { value: HourMinute; onChange: (v: HourMinute) => void; label: string }) {
  return (
    <span className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="w-[72px]">
        <Select aria-label={`${label} 시`} value={value.hour} onChange={(e) => onChange({ ...value, hour: e.target.value })}>
          {HOURS.map((h) => (
            <option key={h}>{h}</option>
          ))}
        </Select>
      </span>
      시
      <span className="w-[72px]">
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
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [saving, startSaving] = useTransition();
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  // 막는 이유는 마지막으로 누른 저장 방식 기준으로 보인다.
  const [lastTemporary, setLastTemporary] = useState(false);
  const issues = problems(form, lastTemporary);
  const minor = isMinor(form);
  const holiday = weeklyHolidayOf(form);
  const dayLabel = (d: Weekday) => labelOf(labels.weekday, d);

  // 임시저장(DRAFT)은 직원 칸과 근무지만 있으면 되고, 초안 저장(발송 대기)은 다 채워야 한다(근로계약은 키만 NOT NULL).
  const save = (temporary: boolean) => {
    setTried(true);
    setLastTemporary(temporary);
    setServerError("");
    if (problems(form, temporary).length) return;
    startSaving(async () => {
      // 성공하면 액션이 목록으로 보낸다. 돌아왔다면 실패다.
      const body = toBody(form, temporary);
      const { error } = contractId ? await updateContract(contractId, body) : await createContract(body);
      setServerError(error);
    });
  };

  const toggleDay = (d: Weekday) => set("days", form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d]);

  const hourRows = WEEKDAYS.map((d) => {
    const on = form.days.includes(d);
    const t = (v: HourMinute) => (on ? `${v.hour}:${v.minute}` : "-");
    return { d, cells: [t(form.work.start), t(form.work.end), t(form.rest.start), t(form.rest.end)] };
  });
  const cell = (i: number) => (r: (typeof hourRows)[number]) => r.cells[i];

  const blocked = saving || !signedIn || minor;
  const saveButtons = (
    <>
      <Button variant="soft" onClick={() => save(true)} disabled={blocked}>
        임시저장
      </Button>
      <Button onClick={() => save(false)} disabled={blocked}>
        {saving ? "저장 중" : "초안 저장"}
      </Button>
    </>
  );

  return (
    <div className="flex flex-col gap-[12px]">
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
          <Group label="계약 방식" help="종이 계약(날인본 파일 등록)은 아직 준비 중이다">
            <div role="radiogroup" className="flex flex-wrap items-center gap-x-[18px] gap-y-[8px]">
              <Radio name="contractMethod" label="전자계약" checked readOnly />
              <Radio name="contractMethod" label="종이 계약" disabled />
            </div>
          </Group>
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
            {/* 고용 형태와 상관없이 시급 한 칸이다(2026-10-12 재영). 정직원 월급은 시급 × 월 기본시간으로 셈한다. */}
            <Item label="시급" required help="2026년 최저임금 10,320원 이상">
              {(id) => <TextField id={id} value={form.wage} inputMode="numeric" onChange={(e) => set("wage", formatWage(e.target.value))} />}
            </Item>
            <Group label="근무요일">
              <span className="flex gap-[6px]">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={form.days.includes(d)}
                    onClick={() => toggleDay(d)}
                    className="grid size-[34px] place-items-center rounded-[2px] border border-erp-field-line bg-white text-[14px] text-erp-label transition-colors duration-150 ease-out aria-pressed:border-erp-brand-soft aria-pressed:bg-erp-brand-soft aria-pressed:text-white"
                  >
                    {dayLabel(d)}
                  </button>
                ))}
              </span>
            </Group>
          </FormRow>
          <FormRow>
            <Group label="근무시간">
              <SpanPick label="근무시간" value={form.work} onChange={(v) => set("work", v)} />
            </Group>
            <Group label="휴게시간">
              <SpanPick label="휴게시간" value={form.rest} onChange={(v) => set("rest", v)} />
            </Group>
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
                { header: "요일", width: "w-[70px]", cell: (r) => dayLabel(r.d) },
                { header: "시업", cell: cell(0) },
                { header: "종업", cell: cell(1) },
                { header: "휴게 시작", cell: cell(2) },
                { header: "휴게 종료", cell: cell(3) },
              ]}
              rows={hourRows}
              rowKey={(r) => r.d}
            />
            <span className={HELP}>요일마다 같은 시간이 들어간다. 요일별로 다른 시간은 근무스케줄에서 고친다.</span>
          </div>
          <FormRow>
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
            {/* 주휴일은 7일 근무를 협의하기 전까지 숨긴다 — 저장은 api 가 NULL 로 한다(2026-10-08). */}
            <div hidden>
            <Group label="주휴일" help="근무로 정해진다 — 주 15시간 이상이면 근무하지 않는 가장 뒤 요일, 미만이면 없음. 계약서 휴일 조항에 들어간다">
              <span className="flex h-[34px] items-center text-[14px] text-erp-ink" aria-live="polite">
                {holiday === "NO_DAY_OFF" ? "쉬는 요일이 없어 정할 수 없습니다" : holiday ? `${dayLabel(holiday)}요일` : "없음 (주 15시간 미만)"}
              </span>
            </Group>
            </div>
          </FormRow>
        </FormGroup>

        <FormGroup title="4대보험 가입 여부">
          <div className="flex gap-[24px]">
            <Checkbox label="건강보험 · 국민연금" checked={form.isHealthPensionInsured} onChange={(e) => set("isHealthPensionInsured", e.target.checked)} />
            <Checkbox label="고용보험 · 산재보험" checked={form.isEmploymentInjuryInsured} onChange={(e) => set("isEmploymentInjuryInsured", e.target.checked)} />
          </div>
        </FormGroup>

        <Band
          risk={minor}
          title="만 19세 미만 직원은 등록할 수 없습니다"
          desc="근로계약·출퇴근·급여는 점포에서 따로 관리해 주세요. 계약 시작일 기준으로 따지며, 만 19세 미만이면 저장이 막히고 초대도 나가지 않습니다."
        />
        {(serverError || (tried && issues.length > 0)) && (
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
        )}
        <div className="flex items-center gap-[6px]">
          <span className="flex-1 text-[14px] text-erp-label">임시저장은 이름 · 휴대전화번호 · 근무지 · 직무만 있으면 된다. 초안 저장은 다 채워야 하고 발송 대기로 남는다. 초대 발송은 아직 없다.</span>
          {saveButtons}
        </div>
      </div>
    </div>
  );
}
