import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, DetailTable, type Column } from "@/components/common";
import { labelOf, type EnumValue } from "@/lib/enums";
import { FixList, ProxyButton } from "./attendance-fix-list";
import { FixPeriod } from "./attendance-fix-period";
import { BackdropInert } from "./backdrop-inert";
import { addDays, dayLabel, hoursLabel, lateMinutes, monthDayLabel, type DayRow, type FixRow, type WeekSummary } from "./attendance-query";

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

/** fill — 본문 아래 남는 높이를 채운다. 빈 표(DataTable fillEmpty)가 그 높이까지 늘어난다(보정이 필요한 기록, 2026-11-04 사용자 지정) */
function Section({ title, right, fill = false, children }: { title: string; right?: ReactNode; fill?: boolean; children: ReactNode }) {
  return (
    <section className={`flex min-w-0 flex-col gap-[12px] ${fill ? "flex-1" : ""}`}>
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
            // 퇴근을 더 기다리지 않는 날만 api 가 퇴근 미등록으로 준다 — 밤샘 근무의 어제 출근은 오늘까지 「근무 중」이다
      cell: (r) => <Stack lines={r.pairs.map((p, i) => (p.checkOut ? p.checkOut.time : <Sub key={i}>{r.status === "MISSING_CHECK_OUT" || r.status === "MISSING_CHECK_IN" ? "미기록" : "근무 중"}</Sub>))} />,
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
    // 표 틀을 옆 근태 요약 아래 끝까지 늘려 두 칸의 아래 선을 맞춘다(2026-11-04 사용자 지정 — 직원이 적으면 표가 짧게 끝나 아래가 비어 보였다).
    // 줄은 위에서부터 쌓이고 남는 높이는 틀 안 빈칸이다. 비었으면 안내가 그 가운데(fillEmpty)
    <Section title="일별 출퇴근" fill right={<StepNav label={dayLabel(date)} unit="날" prev={hrefOfDate(addDays(date, -1))} next={hrefOfDate(addDays(date, 1))} />}>
      {rows.length ? (
        <div className="flex min-h-0 flex-1 flex-col border-x border-b border-erp-thead-line [&>table]:-mb-px [&>table]:border-x-0">
          <DataTable columns={columns} rows={rows} rowKey={(r) => `${r.staffMemberId}-${r.date}`} />
        </div>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(r) => `${r.staffMemberId}-${r.date}`} empty="출·퇴근 기록이 없습니다." fillEmpty />
      )}
    </Section>
  );
}

/** 근태 요약 줄 앞 14px 색 칸 — 표 상태 꼬리표와 같은 뜻(정상 파랑 · 지각 노랑 · 미기록 빨강), 근무스케줄 범례(CoverLegend)와 같은 모양(옅은 바탕 + 같은 계열 테두리).
 * 노랑은 토큰이 없어 급여명세서 경고 바탕(#fff6e5) · #e8a33d 를 적는다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 8px 진한 점) */
const DOT = { ok: "bg-erp-on-bg border-erp-on/40", warn: "bg-[#fff6e5] border-[#e8a33d]/50", risk: "bg-erp-off-bg border-erp-off/40" } as const;

// 막대 채움도 앞 색 칸과 같은 계열의 진한 색(정상 상태 파랑 · 지각 노랑 · 미기록 상태 빨강, 2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 셋 다 회청)
const BAR = { ok: "bg-erp-on", warn: "bg-[#e8a33d]", risk: "bg-erp-off" } as const;

function Rate({ label, count, total, dot }: { label: string; count: number; total: number; dot: keyof typeof DOT }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  // 색 칸 시작선을 아래 근로시간 표(DetailTable — 선 1px + 칸 여백 12px)의 라벨과 맞춘다(2026-11-04 사용자 지정 — 전엔 칸 왼쪽 끝에 붙어 시작선이 둘이었다)
  return (
    <div className="flex h-[34px] items-center gap-[12px] pl-[13px] text-[14px]">
      {/* 색 칸(14)은 들여쓰기 13px 에서 시작해 아래 근로시간 표 라벨(「총 근로시간」 · 「연장 근로」)과 같은 세로줄에 서고, 간격 6 뒤에 글자가 온다(범례와 같다).
          라벨 칸 98 — 13 + 98 + 간격 12 = 123px 에서 막대가 시작해 표 값과 같은 세로줄에 선다. 라벨 글자는 표 라벨과 같은 14px 500 회색, 색만으로 말하지 않게 글자는 그대로 둔다
          (2026-11-04 · 05 사용자 지정 — 줄맞춤. 전엔 점이 칸 왼쪽 끝, 글자가 표 라벨 줄이었다) */}
      <span className="flex w-[98px] shrink-0 items-center gap-[6px] text-[14px] font-medium text-erp-label">
        <span aria-hidden="true" className={`size-[14px] shrink-0 rounded-[2px] border ${DOT[dot]}`} />
        {label}
      </span>
      <span className="block h-[6px] w-[200px] overflow-hidden rounded-[2px] bg-erp-subtle" role="img" aria-label={`${label} ${pct}%`}>
        <span className={`block h-full ${BAR[dot]}`} style={{ width: `${pct}%` }} />
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
    <Section title="근태 요약" right={<StepNav label={`${monthDayLabel(week)} ~ ${monthDayLabel(addDays(week, 6))}`} unit="주" prev={hrefOfWeek(addDays(week, -7))} next={hrefOfWeek(addDays(week, 7))} />}>
      <div className="flex flex-col gap-[12px]">
        <div className="flex flex-col">
          <Rate label="정상 출근" count={summary.normal} total={total} dot="ok" />
          <Rate label="지각" count={summary.late} total={total} dot="warn" />
          <Rate label="미기록" count={summary.missing} total={total} dot="risk" />
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
  query: { fixFrom: string; fixTo: string; fixAll: boolean };
  today: string;
  /** api 점포 조건(대신 등록 직원 선택지) */
  stores: string;
  /** 보정 · 대신 등록할 수 있는 첫 날 — 최근 3개월 */
  editableFrom: string;
  reasonLabels: EnumValue[];
}) {
  return (
    <Section
      // 급여명세서에서 와 그 직원의 기간 기록을 모두 보일 때는 보정 대상만이 아니라서 이름을 바꾼다(WHALEERP-664)
      title={query.fixAll ? "기간 출·퇴근 기록" : "보정이 필요한 기록"}
      fill
      right={
        <span className="flex items-center gap-[6px]">
          <BackdropInert>
            <FixPeriod from={query.fixFrom} to={query.fixTo} today={today} />
          </BackdropInert>
          <ProxyButton stores={stores} today={today} editableFrom={editableFrom} />
        </span>
      }
    >
      <FixList rows={rows} reasonLabels={reasonLabels} editableFrom={editableFrom} empty={query.fixAll ? "기간 안 출·퇴근 기록이 없습니다." : undefined} />
    </Section>
  );
}
