// 근로계약 상세의 칸 표기. 테스트: node --test "src/app/contracts/[contractId]/detail-format.test.ts"
import type { ContractDetail } from "../new/contract-form-model";

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

/** 이력 시각. 한국 시간 YYYY-MM-DD HH:mm (서버가 UTC 로 그려도 같게) */
export function kstDateTime(iso: string): string {
  const k = new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString();
  return `${k.slice(0, 10)} ${k.slice(11, 16)}`;
}
