// 근로계약 상세의 칸 표기. 테스트: node --test "src/app/contracts/[contractId]/detail-format.test.ts"
import { WEEKDAYS, WEEKS_PER_MONTH, type ContractDetail } from "../new/contract-form-model.ts";
import { payrollAccountText } from "../../staff-members/[id]/contract-summary.ts";

const minutes = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

/** 주 소정근로시간(시간). 요일마다 종업 − 시업 − 휴게를 더한다 */
export function weeklyHoursOf(days: ContractDetail["workDays"]): number {
  return (
    days.reduce(
      (sum, d) => sum + minutes(d.endTime) - minutes(d.startTime) - (d.breakStartTime && d.breakEndTime ? minutes(d.breakEndTime) - minutes(d.breakStartTime) : 0),
      0,
    ) / 60
  );
}

/**
 * 근무 요일 · 시각을 줄로 묶는다. 같은 시각인 요일끼리 한 줄(「월·화·수 09:00-18:00 · 휴게 12:00-13:00」).
 * dayLabel 은 요일 한글(월 · 화 …)을 준다.
 */
export function workDayLines(days: ContractDetail["workDays"], dayLabel: (d: string) => string): string[] {
  const groups = new Map<string, string[]>();
  for (const d of days) {
    const rest = d.breakStartTime && d.breakEndTime ? ` · 휴게 ${d.breakStartTime}-${d.breakEndTime}` : "";
    const key = `${d.startTime}-${d.endTime}${rest}`;
    groups.set(key, [...(groups.get(key) ?? []), dayLabel(d.weekday)]);
  }
  return [...groups].map(([time, names]) => `${names.join("·")} ${time}`);
}

/** 임금지급일. 31 은 말일 */
export function payDayText(payMonthLabel: string | null, payDay: number | null): string {
  if (!payMonthLabel || payDay === null) return "-";
  return `${payMonthLabel} ${payDay === 31 ? "말일" : `${payDay}일`}`;
}

/** 수습. 「3개월 · 감액 10% (수습 중 시급 10,080원)」, 없으면 「없음」. 시급이 비었으면 수습 중 시급은 뺀다 */
export function probationText(months: number | null, rate: number | null, wage: number | null): string {
  if (months === null || rate === null) return "없음";
  const during = wage === null ? "" : ` (수습 중 시급 ${Math.round(wage * (1 - rate / 100)).toLocaleString("ko-KR")}원)`;
  return `${months}개월 · 감액 ${rate}%${during}`;
}

/** 4대보험. 가입한 묶음만, 없으면 「가입 안 함」, 정하지 않았으면 「-」 */
export function insuranceText(healthPension: boolean | null, employmentInjury: boolean | null): string {
  if (healthPension === null && employmentInjury === null) return "-";
  const on = [healthPension ? "건강보험 · 국민연금" : "", employmentInjury ? "고용보험 · 산재보험" : ""].filter(Boolean);
  return on.length ? on.join(", ") : "가입 안 함";
}

/** 신고 정보를 풀 수 없을 때(api UNAVAILABLE — 키 없음 · 복호화 실패) 주민등록번호 · 급여 계좌 칸에 보이는 글자 */
export const TAX_PROFILE_UNAVAILABLE = "신고 정보를 지금 볼 수 없습니다.";

/**
 * 「주민등록번호」 · 「급여 계좌」 칸 글자(WHALEERP-155). 주민등록번호는 api 가 가린 값(900101-1******) 그대로, 급여 계좌는 직원 상세 근로계약
 * 요약과 같은 「은행이름 계좌번호」다. 미입력(NONE)과 본사 역할이 가맹 점포 직원을 볼 때(HIDDEN)는 같은 「-」다 — 줄은 그대로 둔다(직원 상세와 다르다).
 * 칸이 없는 옛 api 응답이 와도 「-」로 둔다.
 */
export function taxProfileTexts(t: ContractDetail["taxProfile"] | undefined): { rrn: string; account: string } {
  if (t?.status === "UNAVAILABLE") return { rrn: TAX_PROFILE_UNAVAILABLE, account: TAX_PROFILE_UNAVAILABLE };
  if (t?.status !== "OK") return { rrn: "-", account: "-" };
  return {
    // 빈 글자 · 빠진 칸도 비었다고 본다 — 빈 칸이나 「은행 undefined」를 보이지 않게
    rrn: t.rrnMasked || "-",
    account: payrollAccountText(t.bankName && t.accountNumber ? { bankName: t.bankName, accountNumber: t.accountNumber } : null),
  };
}

/** 이력 시각. 한국 시간 YYYY-MM-DD HH:mm (서버가 UTC 로 그려도 같게) */
export function kstDateTime(iso: string): string {
  const k = new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString();
  return `${k.slice(0, 10)} ${k.slice(11, 16)}`;
}

type ProcessFields = Pick<
  ContractDetail,
  | "status"
  | "contractMethod"
  | "firstSentAt"
  | "lastSentAt"
  | "signDeadlineAt"
  | "lastProcessedAt"
  | "resendCount"
  | "correctionReason"
  | "registeredAt"
  | "registeredBy"
>;

/** 날인 기한이 뜻이 있는 상태 — 날인을 기다리는 동안과 그 기한이 지나 만료된 때 */
const DEADLINE_SHOWN = new Set(["PENDING_SEND", "PENDING_SIGNATURE", "EXPIRED"]);

/**
 * 근로계약 상세의 발송 · 처리 정보 줄(WHALEERP-155 · 328). 전자계약은 발송일 · (재발송했으면) 재발송 횟수와 마지막 발송 · (날인을
 * 기다리는 동안 · 만료) 날인 기한, 종이 계약은 발송 칸 대신 등록일 · 등록 관리자다. 그 뒤 최종 처리일(가장 최근 상태 변경), 수정
 * 요청된 계약은 직원이 남긴 수정 요청 사유(직원이 쓴 글이라 길면 줄이 늘어난다, 없으면 「-」). 거부 사유는 받지 않아 줄이 없다
 * (WHALEERP-635). 값이 없는 칸은 줄을 두지 않는다. 시각은 한국 시간.
 */
export function processRows(c: ProcessFields): { label: string; value: string; multiline?: boolean }[] {
  const rows: { label: string; value: string; multiline?: boolean }[] = [];
  if (c.contractMethod === "PAPER") {
    if (c.registeredAt) rows.push({ label: "등록일", value: kstDateTime(c.registeredAt) });
    if (c.registeredBy) rows.push({ label: "등록 관리자", value: c.registeredBy });
  } else {
    if (c.firstSentAt) rows.push({ label: "발송일", value: kstDateTime(c.firstSentAt) });
    if (c.resendCount > 0 && c.lastSentAt) rows.push({ label: "재발송", value: `${c.resendCount}회 · 마지막 ${kstDateTime(c.lastSentAt)}` });
    if (c.signDeadlineAt && c.status && DEADLINE_SHOWN.has(c.status)) rows.push({ label: "날인 기한", value: kstDateTime(c.signDeadlineAt) });
  }
  if (c.lastProcessedAt) rows.push({ label: "최종 처리일", value: kstDateTime(c.lastProcessedAt) });
  // 사유는 고쳐 다시 보내도 api 에 남지만 수정 요청일 때만 보인다
  if (c.status === "CORRECTION_REQUESTED") rows.push({ label: "수정 요청 사유", value: c.correctionReason ?? "-", multiline: true });
  return rows;
}

/** 파트타이머 소정근로시간 표 한 줄. 요일 줄은 시각 · 근무시간 · 시급 · 소계, 합계 줄은 근무시간 · 금액만 */
export type PartTimeRow = {
  key: string;
  label: string;
  start?: string;
  end?: string;
  restStart?: string;
  restEnd?: string;
  hours?: string;
  wage?: string;
  amount: string;
};

const won = (n: number | null) => (n === null ? "-" : n.toLocaleString("ko-KR"));
const hoursText = (n: number | null) => (n === null ? "" : String(Number(n.toFixed(2))));

/**
 * 파트타이머 상세의 소정근로시간 표 — 작성 화면의 표와 같은 줄 · 같은 셈(partTimePay: 요일 소계 = 시급 × 그날 시간, 주휴시간 =
 * 주 15시간 이상일 때 주 시간 ÷ 5(8시간까지), 월급여 = 주급 × 4.345)을 저장한 시각으로 읽기 전용으로 보인다. 요일마다 저장한
 * 시업 · 종업 · 휴게가 다를 수 있다(데모 확인 2026-10-15). 근무하지 않는 요일은 「-」, 맨 아래 소계 · 주휴수당 · 주급 · 월급여.
 */
export function partTimeRows(d: ContractDetail, dayLabel: (d: string) => string): PartTimeRow[] {
  const rate = d.wageAmount ?? 0;
  const wage = d.wageAmount === null ? "-" : won(d.wageAmount);
  const days = WEEKDAYS.map((weekday) => {
    const w = d.workDays.find((x) => x.weekday === weekday);
    const hours = w ? weeklyHoursOf([w]) : null;
    return { w, hours, amount: hours === null ? null : Math.round(hours * rate) };
  });
  const workHours = weeklyHoursOf(d.workDays);
  const workPay = days.reduce((sum, x) => sum + (x.amount ?? 0), 0);
  const holidayHours = workHours >= 15 ? Math.min(8, workHours / 5) : 0;
  const holidayPay = Math.round(holidayHours * rate);
  const weekly = workPay + holidayPay;
  const pay = { days, workHours, workPay, holidayHours, holidayPay, weekly, monthly: Math.round(weekly * WEEKS_PER_MONTH) };
  const dayRows = WEEKDAYS.map((weekday, i): PartTimeRow => {
    const { w } = pay.days[i];
    return w
      ? {
          key: weekday,
          label: dayLabel(weekday),
          start: w.startTime,
          end: w.endTime,
          restStart: w.breakStartTime ?? "-",
          restEnd: w.breakEndTime ?? "-",
          hours: hoursText(pay.days[i].hours),
          wage,
          amount: won(pay.days[i].amount),
        }
      : { key: weekday, label: dayLabel(weekday), start: "-", end: "-", restStart: "-", restEnd: "-", amount: "-" };
  });
  return [
    ...dayRows,
    { key: "work", label: "소계", hours: hoursText(pay.workHours), amount: won(pay.workPay) },
    { key: "holiday", label: "주휴수당", hours: hoursText(pay.holidayHours), amount: won(pay.holidayPay) },
    { key: "weekly", label: "주급", amount: won(pay.weekly) },
    { key: "monthly", label: "월급여", amount: won(pay.monthly) },
  ];
}
