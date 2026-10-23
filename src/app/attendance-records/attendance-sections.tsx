import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, DetailTable, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { FixList, ProxyButton } from "./attendance-fix-list";
import { FixPeriod } from "./attendance-fix-period";
import { addDays, dayLabel, hoursLabel, lateMinutes, shortDay, type DayRow, type FixRow, type WeekSummary } from "./attendance-query";

// 출·퇴근 현황 본문 세 묶음(데모 staff-sections.mjs today · summary · fixList). 묶음 머리는 데모 sectionHead(18px 제목 + 오른쪽 이동),
// 날 · 주 이동은 데모 weekNav(‹ 라벨 ›)를 링크로 옮겼다 — 화면 상태는 주소에만 둔다.

// 상태 꼬리표 색 — 데모 mark 의 ok · warn · risk · subtle. 지각 · 미등록의 노랑은 Figma 에 한 번만 나와 토큰이 없다.
const TONE = {
  ok: "bg-erp-on-bg text-erp-on",
  warn: "bg-[#fff6e5] text-[#956013]",
  risk: "bg-erp-off-bg text-erp-off",
  subtle: "bg-erp-thead-bg text-erp-sub",
  info: "bg-erp-on-bg text-erp-on",
};
const STATUS_TONE: Record<string, keyof typeof TONE> = {
  NORMAL: "ok",
  LATE: "warn",
  MISSING_CHECK_OUT: "warn",
  MISSING_CHECK_IN: "warn",
  ABSENT: "risk",
  OFF: "subtle",
};
const Mark = ({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) => (
  <span className={`inline-block rounded-[2px] px-[4px] py-px text-[14px] font-medium whitespace-nowrap ${TONE[tone]}`}>{children}</span>
);
const Sub = ({ children }: { children: ReactNode }) => <span className="text-erp-label">{children}</span>;
const Stack = ({ lines }: { lines: ReactNode[] }) =>
  lines.length ? (
    <span className="inline-flex flex-col leading-[1.4]">
      {lines.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </span>
  ) : (
    <span>-</span>
  );

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-[12px]">
      <div className="flex items-end gap-[6px]">
        <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const STEP =
  "grid size-[34px] place-items-center rounded-[2px] border border-erp-button-line bg-white transition-[border-color] duration-150 ease-out hover:border-erp-brand";
function StepNav({ label, unit, prev, next }: { label: string; unit: string; prev: string; next: string }) {
  return (
    <span className="flex items-center gap-[6px]">
      <Link href={prev} aria-label={`이전 ${unit}`} className={STEP} scroll={false}>
        <Image src="/icons/prev.svg" alt="" width={14} height={14} />
      </Link>
      <span className="flex h-[34px] min-w-[190px] items-center justify-center rounded-[2px] border border-erp-button-line bg-white px-[12px] text-[14px] font-semibold text-erp-ink">
        {label}
      </span>
      <Link href={next} aria-label={`다음 ${unit}`} className={STEP} scroll={false}>
        <Image src="/icons/next.svg" alt="" width={14} height={14} />
      </Link>
    </span>
  );
}

/** 직원 칸 — 이름. 점포가 둘 이상 섞이면 같은 이름이 갈리지 않아 점포 이름을 옅게 붙인다(데모는 점포 하나 예시라 없다) */
const staffCell = (r: DayRow, manyStores: boolean) =>
  manyStores ? (
    <>
      {r.name} <Sub>{r.storeName}</Sub>
    </>
  ) : (
    r.name
  );

/** 일별 출퇴근(데모 today) — 직원 · 예정 · 출근 · 퇴근 · 비고. 하루씩 넘긴다(2026-10-02 재영) */
export function DaySection({
  rows,
  date,
  today,
  hrefOfDate,
  statusLabels,
  reasonLabels,
}: {
  rows: DayRow[];
  date: string;
  today: string;
  hrefOfDate: (date: string) => string;
  statusLabels: EnumValue[];
  reasonLabels: EnumValue[];
}) {
  const manyStores = new Set(rows.map((r) => r.storeId)).size > 1;
  const columns: Column<DayRow>[] = [
    { header: "직원", cell: (r) => staffCell(r, manyStores) },
    { header: "예정", cell: (r) => (r.schedules.length ? <Stack lines={r.schedules.map((s, i) => <Sub key={i}>{s.startTime}</Sub>)} /> : <Sub>-</Sub>) },
    {
      header: "출근",
      // 미출근은 출근 칸에 「미기록」(데모 today)
      cell: (r) => (r.status === "ABSENT" ? <Sub>미기록</Sub> : <Stack lines={r.pairs.map((p, i) => (p.checkIn ? p.checkIn.time : <Sub key={i}>미기록</Sub>))} />),
    },
    {
      header: "퇴근",
      cell: (r) => <Stack lines={r.pairs.map((p, i) => (p.checkOut ? p.checkOut.time : <Sub key={i}>{date === today ? "근무 중" : "미기록"}</Sub>))} />,
    },
    {
      header: "비고",
      // 지각은 늦은 분까지(목업 「지각 18분」). 확인 필요 사유가 남은 기록은 「확인 필요 · 사유」 꼬리표를 덧붙인다(데모에 없음 — 2026-10-23 재영
      // 「비고의 확인 필요 · 사유 꼬리표만 남긴다」)
      cell: (r) => {
        const reasons = [...new Set(r.pairs.flatMap((p) => [p.checkIn?.reviewReason, p.checkOut?.reviewReason]).filter((x): x is NonNullable<typeof x> => !!x))];
        if (!r.status && !reasons.length) return <Sub>-</Sub>;
        return (
          <span className="inline-flex flex-wrap items-center gap-[4px]">
            {r.status && (
              <Mark tone={STATUS_TONE[r.status]}>{r.status === "LATE" && lateMinutes(r) ? `지각 ${lateMinutes(r)}분` : labelOf(statusLabels, r.status)}</Mark>
            )}
            {reasons.map((reason) => (
              <Mark key={reason} tone="risk">
                확인 필요 · {labelOf(reasonLabels, reason)}
              </Mark>
            ))}
          </span>
        );
      },
    },
  ];
  return (
    <Section title="일별 출퇴근" right={<StepNav label={dayLabel(date)} unit="날" prev={hrefOfDate(addDays(date, -1))} next={hrefOfDate(addDays(date, 1))} />}>
      <DataTable columns={columns} rows={rows} rowKey={(r) => `${r.staffMemberId}-${r.date}`} empty="이 날의 출퇴근 기록이 없습니다." />
    </Section>
  );
}

function Rate({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex h-[34px] items-center gap-[12px] text-[14px]">
      <span className="w-[80px] shrink-0 text-erp-label">{label}</span>
      <span className="block h-[6px] w-[200px] overflow-hidden rounded-[2px] bg-erp-subtle" role="img" aria-label={`${label} ${pct}%`}>
        <span className="block h-full bg-erp-brand" style={{ width: `${pct}%` }} />
      </span>
      <span>{count}회</span>
    </div>
  );
}

/**
 * 근태 요약(데모 summary) — 한 주씩. 정상 출근 · 지각 · 미기록(미출근 · 출근 미등록 · 퇴근 미등록) 횟수와 근로시간(총 · 연장 · 야간 ·
 * 주휴 대상). 근무 · 연장 · 주휴 대상은 api 가 급여 계산(WHALEERP-227)과 같은 규칙으로 낸 직원별 값이다(attendance-query.ts weekSummary).
 */
export function SummarySection({ summary, week, hrefOfWeek }: { summary: WeekSummary; week: string; hrefOfWeek: (week: string) => string }) {
  const total = summary.normal + summary.late + summary.missing;
  return (
    <Section title="근태 요약" right={<StepNav label={`${shortDay(week)} ~ ${shortDay(addDays(week, 6))}`} unit="주" prev={hrefOfWeek(addDays(week, -7))} next={hrefOfWeek(addDays(week, 7))} />}>
      <div className="flex flex-col gap-[12px]">
        <div className="flex flex-col">
          <Rate label="정상 출근" count={summary.normal} total={total} />
          <Rate label="지각" count={summary.late} total={total} />
          <Rate label="미기록" count={summary.missing} total={total} />
        </div>
        <DetailTable
          title="근로시간"
          rows={[
            { label: "총 근로시간", value: hoursLabel(summary.workedMinutes) },
            { label: "연장 근로", value: hoursLabel(summary.overtimeMinutes) },
            { label: "야간 근로", value: hoursLabel(summary.nightMinutes) },
            { label: "주휴 대상", value: `${summary.weeklyHolidayStaff}명` },
          ]}
        />
      </div>
    </Section>
  );
}

/**
 * 보정이 필요한 기록(데모 fixList) — 기간 지정 조회는 이 목록에만, 최근 3개월 안에서 고른다(STAFF-31). 머리에 기간과 「출퇴근 대신 등록」,
 * 줄마다 보정 · 「이상 없음」 · 이력(attendance-fix-list.tsx, WHALEERP-220).
 */
export function FixSection({
  rows,
  query,
  today,
  stores,
  editableFrom,
  reasonLabels,
}: {
  rows: FixRow[];
  query: { fixFrom: string; fixTo: string };
  today: string;
  /** api 점포 조건(대신 등록 직원 선택지) */
  stores: string;
  /** 보정 · 대신 등록할 수 있는 첫 날 — 최근 3개월 */
  editableFrom: string;
  reasonLabels: EnumValue[];
}) {
  return (
    <Section
      title="보정이 필요한 기록"
      right={
        <span className="flex items-center gap-[6px]">
          <FixPeriod from={query.fixFrom} to={query.fixTo} today={today} />
          <ProxyButton stores={stores} today={today} editableFrom={editableFrom} />
        </span>
      }
    >
      <FixList rows={rows} reasonLabels={reasonLabels} editableFrom={editableFrom} />
    </Section>
  );
}
