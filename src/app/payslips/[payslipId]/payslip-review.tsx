"use client";

import { unstable_rethrow, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { Button, HelpTip, SummaryStrip, Checkbox, ConfirmDialog, DetailTable, Field, TextField, Toggle, useAction, useToast } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import {
  formatAmount,
  isItemShown,
  monthLabel,
  itemAmount,
  parseAmount,
  payslipTotals,
  type PayslipAdditionalItem,
  type PayslipDetail,
  type PayslipItem,
} from "@/lib/payslips";
import { earningHelp, retirementCell, sortDeductions, STATUS_STYLE } from "../payslip-row";
import {
  cancelPayslipConfirmation,
  recalculatePayslip,
  confirmPayslip,
  getAdditionalItems,
  getPreviousValues,
  resendPayslip,
  savePayslip,
  sendPayslip,
  type EditFailure,
} from "./actions";
import {
  addAdditionalLine,
  applyPrevious,
  blockedRecheck,
  confirmBlockedUntil,
  editSnapshot,
  hasHours,
  HOURS_INPUT,
  hoursTextOf,
  loadedHoursAmount,
  nextRecheckMs,
  overHours,
  RECHECK_FIRST_MS,
  removeLine,
  saveItems,
} from "./payslip-edit";
import { StoreNameWithType } from "@/components/site/store-type-tag";
import { CellView } from "../../staff-members/staff-table";

// 급여명세서 검토의 머리(임시저장 · 확정 · 발송 · 목록)와 왼쪽 「지급 내역」. 데모 docs/demo/staff/payrolls-detail.html(원본
// src/pages/staff/payrolls-detail.mjs)과 목업 docs/mockup/staff/payrolls-detail.html 의 3.3% 원천징수 칸을 옮겼다.
// 데이터는 GET /payslips/:id 이고, 임시저장 · 지난 명세서 불러오기 · 항목 추가(WHALEERP-228)와 확정 · 확정 취소(WHALEERP-230)는
// server action(actions.ts)으로 api 를 부른다. 확정이면 「발송」, 발송 완료면 「재발송」(확인창을 거친다, WHALEERP-231 · 237). 금액 칸 · 두 스위치 · 붙인 추가 공제는 임시저장해야 남고, 합계와 빨간 띠가 따라 바뀐다.
// 성공하면 router.refresh() 로 상세를 다시 받는다 — page 가 updatedAt 을 key 로 줘 화면 상태도 새 값으로 다시 선다.
// 기본급 · 주휴수당 · 연장수당은 api 가 근로계약 · 출퇴근 기록으로 계산한다(WHALEERP-227). 「출퇴근 다시 불러오기」는 확인창을 거쳐
// POST /payslips/:id/recalculate 를 부르고(고친 값은 버린다), 가산 스위치는 임시저장 때 api 가 그 값으로 다시 계산한다.
// 경고 띠의 「출퇴근 기록 확인」은 출·퇴근 현황 조회(보정이 필요한 기록)를 그 점포 · 직원 · 급여 기간으로 연다.
// 고칠 수 있는 것은 작성 중 · 검토 중이고 수정 권한이 있을 때뿐이다 — 확정 · 발송 완료는 읽기만 하고 「확정 취소」와 「발송」 · 「재발송」만 둔다(okf/staff.md 급여).

type Dialog = "save" | "confirm" | "cancel" | "send" | "resend" | "load" | "add" | "preview" | "recalc";

const HELP = "text-[12px] leading-[1.5] text-erp-muted";
const textOf = (amount: number | null) => (amount === null ? "" : formatAmount(amount));

/** 도움말이 있는 칸(데모 fieldH). 도움말 유무가 섞인 줄에서도 칸 위쪽이 맞게 위로 붙인다. */
function AmountField({
  label,
  value,
  help,
  formula: isFormula = false,
  hours,
  readOnly,
  onChange,
  onRemove,
}: {
  label: string;
  value: string;
  help: string;
  /** 도움말이 api 의 계산식(calculationText)이다(WHALEERP-755) */
  formula?: boolean;
  /** 금액 옆 근무시간 칸(시간 글자) — 야간 · 휴일근무수당(WHALEERP-755) */
  hours?: { value: string; onChange: (text: string) => void };
  readOnly: boolean;
  onChange: (text: string) => void;
  /** 붙인 추가 공제를 뗀다(고칠 수 있을 때만) */
  onRemove?: () => void;
}) {
  const invalid = Number.isNaN(parseAmount(value));
  // 칸 아래 글자 정리(2026-11-19 사용자 지정) — 「직접 입력」은 칸 안 안내와, 「비과세」는 묶음 제목 「지급 · 비과세」와 같은 말이라 두지 않는다.
  // 계산값(출퇴근 기록으로 api 가 셈한 값)과 api 의 한 줄 계산식은 근로계약서 작성의 계산식처럼 둥근 꺾은선 · 황토 글자(#956013)로 보인다
  const shownHelp = help === "직접 입력" || help === "비과세" ? "" : help;
  const formula = isFormula || shownHelp.includes("계산값");
  const amountField = (
    <Field label={label}>
      <TextField
        value={value}
        inputMode="numeric"
        placeholder={readOnly ? undefined : "직접 입력"}
        readOnly={readOnly}
        aria-invalid={invalid || undefined}
        // 숫자와 쉼표만 받는다(화면 설계 공통 기준 1번 — 저장 때 칸 오류가 생기지 않게, WHALEERP-633). 붙여 넣은 「원」 · 「₩」 · 공백은 떼고, 그 밖의
        // 글자가 섞인 입력은 통째로 받지 않는다 — 글자만 지우면 「1,000.50」이 「100050」처럼 다른 금액이 된다
        onChange={(e) => {
          const text = e.target.value.replace(/[\s원₩]/g, "");
          if (/^[\d,]*$/.test(text)) onChange(text);
        }}
        // 다 친 뒤에 쉼표를 넣는다 — 치는 중에 넣으면 커서가 끝으로 튄다
        onBlur={(e) => {
          const amount = parseAmount(e.target.value);
          if (amount !== null && !Number.isNaN(amount)) onChange(formatAmount(amount));
        }}
      />
    </Field>
  );
  return (
    // 칸 아래 글자가 있는 칸과 없는 칸이 한 줄에 서도 칸 위쪽이 맞게 위로 붙인다(self-start)
    // [빼기]가 있으면 이름 줄 오른쪽에 그만큼 비운다 — 긴 항목 이름(연말(중도)정산 소득세)이 버튼 밑으로 들어갔다(코드 리뷰)
    <div className={`relative flex min-w-px flex-1 flex-col gap-[8px] self-start ${onRemove ? "[&>label>span:first-child]:pr-[40px]" : ""}`}>
      {/* 붙인 추가 공제의 [빼기]는 항목 이름 줄 오른쪽 끝 — 칸 아래 오른쪽에 있으니 아래 칸 이름처럼 보여 어느 칸 것인지 애매했다(2026-11-19 사용자 지정).
          label 밖에 둬서 누르면 입력칸으로 포커스가 가지 않는다 */}
      {onRemove && (
        <button
          type="button"
          aria-label={`${label} 빼기`}
          className="absolute top-0 right-0 cursor-pointer text-[13px] leading-[21px] font-medium text-erp-link hover:underline"
          onClick={onRemove}
        >
          빼기
        </button>
      )}
      {/* 야간 · 휴일근무수당은 금액 옆에 근무시간 칸(64px, 뒤에 단위 「h」, 0.5시간 단위) — 임금명세서에 시간 수를 함께 적어야 한다(WHALEERP-755).
          저장 때 분으로 보낸다. 금액이 있는데 비우면 api 가 막는다. 감싸는 div 는 근무시간 칸이 있는 줄에만 둔다 — 다른 줄은 금액 칸(label)이
          바깥 div 의 바로 아래 자식이어야 [빼기] 자리 선택자(&>label>span:first-child)가 먹는다. display: contents 는 상자만 없애고 DOM 계층은
          그대로라, 모든 줄을 감쌌을 때 긴 추가 공제 이름이 버튼 밑으로 들어갔다(PR #336 재검사). 다른 줄의 DOM 은 감싸기 전과 같다 */}
      {hours ? (
        <div className="flex items-end gap-[6px]">
          {amountField}
          <label className="flex shrink-0 items-center gap-[4px]">
            <span className="w-[64px]">
              <TextField
                value={hours.value}
                inputMode="decimal"
                placeholder={readOnly ? undefined : "시간"}
                readOnly={readOnly}
                aria-label={`${label} 근무시간(시간)`}
                onChange={(e) => {
                  const text = e.target.value.trim();
                  if (HOURS_INPUT.test(text)) hours.onChange(text);
                }}
              />
            </span>
            <span aria-hidden className="text-[14px] text-erp-label">
              h
            </span>
          </label>
        </div>
      ) : (
        amountField
      )}
      {shownHelp && (
        <span className={`flex gap-[6px] ${HELP}`}>
          {formula ? (
            <span className="flex flex-1 items-start gap-[4px] text-[#956013]">
              <span aria-hidden className="mt-[2px] ml-[4px] size-[7px] shrink-0 rounded-bl-[4px] border-b border-l border-[#956013]" />
              {shownHelp}
            </span>
          ) : (
            <span className="flex-1">{shownHelp}</span>
          )}
        </span>
      )}
    </div>
  );
}

/** 두 칸씩 한 줄. 홀수면 빈 칸으로 반을 채워 마지막 칸이 줄 전체로 늘지 않게 한다. */
function Rows({ children }: { children: ReactNode[] }) {
  // 모든 묶음을 한 줄 세 칸 · 칸 사이 24px 로 — 두 칸이면 금액 칸이 너무 길었고, 칸 사이 6px 이면 붙인 공제의 [빼기]가 옆 칸 이름에 붙어 보였다
  // (2026-11-19 사용자 지정). 세로 길이도 줄어 지급부터 공제까지 한눈에 들어온다
  if (!children.length) return null;
  return <div className="grid grid-cols-3 gap-x-[24px] gap-y-[16px]">{children}</div>;
}

/** 경고 띠(데모 band). risk 면 빨강 바탕, warn(검토가 필요한 띠)이면 연한 노랑 바탕 · 황토 글자 — 게시일 꼬리표 · 근태 지각과 같은 노랑(2026-11-23 사용자 지정, 전엔 회색 바탕). */
export function Band({
  title,
  desc,
  actions,
  risk,
  warn,
  inline,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
  risk?: boolean;
  /** 제목 앞에 경고 삼각형 — 검토가 필요한 띠(2026-11-19 사용자 지정) */
  warn?: boolean;
  /** 본문이 할 일 한 문장뿐이면 제목 뒤에 이어 한 줄로(2026-11-19 사용자 지정) */
  inline?: boolean;
}) {
  return (
    <div
      role={risk ? "alert" : undefined}
      className={`flex min-h-[46px] items-center gap-[12px] rounded-[2px] border px-[16px] py-[12px] ${risk ? "border-erp-off bg-erp-off-bg" : warn ? "border-[#e8a33d]/50 bg-[#fff6e5]" : "border-erp-panel-line bg-erp-thead-bg"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <p className={`flex items-center gap-[6px] text-[14px] font-semibold ${risk ? "text-erp-off" : warn ? "text-[#956013]" : "text-erp-ink"}`}>
          {warn && (
            // 삼각형 느낌표 — 지각과 같은 노랑(#e8a33d, 토큰 없음 · 근태 요약 막대와 같은 값). 막는 것이 아니라 살펴보라는 뜻이라 빨강 대신 노랑
            <svg aria-hidden viewBox="0 0 20 20" className="size-[18px] shrink-0">
              <path d="M10 2.5 18.5 17h-17L10 2.5Z" fill="#e8a33d" stroke="#e8a33d" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M10 8v4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="10" cy="14.4" r="1" fill="#fff" />
            </svg>
          )}
          {title}
          {inline && desc && <span className="font-normal">{desc}</span>}
        </p>
        {!inline && desc && <p className={`text-[14px] leading-[1.6] ${risk ? "text-erp-off" : warn ? "text-[#956013]" : "text-erp-ink"}`}>{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-[6px]">{actions}</div>}
    </div>
  );
}

/** 합계 띠 칸 사이 세로선 위에 얹는 셈 기호(−, =) — 22px 흰 동그라미 */
function Operator({ sign }: { sign: string }) {
  return (
    <span
      aria-hidden
      className="absolute top-1/2 left-0 grid size-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-erp-thead-line bg-white text-[14px] leading-none text-erp-label"
    >
      {sign}
    </span>
  );
}

/**
 * 지급 내역의 묶음 상자 — 회색 제목 줄(42px)에는 이름(15px 600)과 오른쪽 끝 합계만 둔다. 스위치 · 버튼은 몸통 맨 위 도구 줄(왼쪽 설정 · 오른쪽 outline 버튼,
 * 아래 옅은 선)로 내렸다 — 제목 줄에 산정기간 · 스위치 · 합계 · 버튼이 모두 있으니 빽빽했다(2026-11-19 사용자 지정). 산정기간은 오른쪽 「급여 산정 기준」에 있어 뺐다.
 */
function GroupBox({
  id,
  title,
  total,
  tools,
  action,
  children,
}: {
  /** 「검토 사유」의 「공제 칸으로 이동」이 가리키는 자리 */
  id?: string;
  title: string;
  /** 묶음 합계 — 제목 줄 오른쪽 끝 「합계 1,600,000원」 */
  total?: number;
  /** 도구 줄 왼쪽 — 계산 설정 스위치 */
  tools?: ReactNode;
  /** 도구 줄 오른쪽 — 불러오기 버튼 */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-[24px]">
      <div className="flex h-[42px] items-center gap-[10px] rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px]">
        <h3 className="flex-1 text-[15px] font-semibold text-erp-ink">{title}</h3>
        {total !== undefined && (
          <span className="flex items-baseline gap-[6px]">
            <span className="text-[13px] font-medium text-erp-label">합계</span>
            <span className="text-[15px] font-semibold text-erp-ink tabular-nums">{formatAmount(total)}원</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-[16px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[18px]">
        {(tools || action) && (
          <div className="flex min-h-[34px] items-center gap-[10px] border-b border-erp-divider pb-[16px]">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[16px]">{tools}</div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

/** 묶음 제목 줄(데모 sectionHead). */
export function SectionHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-[6px]">
      <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{title}</h2>
      {children}
    </div>
  );
}

export function PayslipReview({
  payslip,
  band,
  listHref,
  today,
  statusLabel,
  employmentTypeLabel,
  aside,
}: {
  payslip: PayslipDetail;
  /** 위쪽 경고 띠(reviewBand). 없으면 null */
  band: { title: string; desc: string; inline: boolean } | null;
  listHref: string;
  /** 오늘(한국 날짜) — 서버가 정해 넘긴다. 화면에서 다시 재면 서버 렌더와 날짜가 어긋날 수 있다 */
  today: string;
  /** 상태 한글(GET /enums PayslipStatus) — 제목 아래 줄의 상태 배지 */
  statusLabel: string;
  /** 고용형태 한글(GET /enums EmploymentType) — 제목 아래 줄 */
  employmentTypeLabel: string;
  /** 오른쪽 단(검토 대상 항목 · 급여 산정 기준 · 처리 이력) */
  aside: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const saveDraft = useAction(savePayslip, { overlay: false });
  const loadPrevious = useAction(getPreviousValues, { overlay: false });
  const loadAdditionalItems = useAction(getAdditionalItems, { overlay: false });
  const confirmOne = useAction(confirmPayslip, { overlay: false });
  const recalculate = useAction(recalculatePayslip, { overlay: false });
  const cancelConfirmation = useAction(cancelPayslipConfirmation, { overlay: false });
  const sendOne = useAction(sendPayslip, { overlay: false });
  const resendOne = useAction(resendPayslip, { overlay: false });
  const canUpdate = usePagePermission().update;
  const editable = canUpdate && (payslip.status === "DRAFTING" || payslip.status === "REVIEWING");
  const isPartTime = payslip.employmentType === "PART_TIME";
  const month = payslip.periodStartDate.slice(0, 7);
  // 급여 기간이 끝나기 전(퇴직 · 계약 종료면 그다음 날 전)에는 [확정]을 막고 그날을 알린다(WHALEERP-690)
  const blockedUntil = confirmBlockedUntil(payslip.confirmableFrom, today);
  const retirement = retirementCell(payslip.retiredDate, today);

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [failure, setFailure] = useState<EditFailure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, startBusy] = useTransition();
  const open = (next: Dialog) => {
    setFailure(null);
    setDialog(next);
  };
  const close = () => {
    if (!busy) setDialog(null);
  };
  const [premium, setPremium] = useState(payslip.isPremiumApplied);
  const [withholding, setWithholding] = useState(payslip.isWithholdingApplied);
  const [items, setItems] = useState(payslip.items);
  const [texts, setTexts] = useState(() => new Map(payslip.items.map((i) => [i.payslipItemId, textOf(itemAmount(i))])));
  const setText = (id: number, text: string) => setTexts((m) => new Map(m).set(id, text));
  // 야간 · 휴일근무수당의 근무시간 칸(시간 글자, WHALEERP-755)
  const [hours, setHours] = useState(() => new Map(payslip.items.filter(hasHours).map((i) => [i.payslipItemId, hoursTextOf(i.workMinutes)])));
  // 저장하지 않은 바뀜 — 확정은 저장된 값으로 하므로 먼저 임시저장하게 한다
  const snapshot = (lines: PayslipItem[], values: Map<number, string>, p: boolean, w: boolean, h: Map<number, string>) =>
    editSnapshot(lines, values, h, p, w);
  const [saved] = useState(() => snapshot(items, texts, premium, withholding, hours));
  const dirty = snapshot(items, texts, premium, withholding, hours) !== saved;
  // [확정]이 막혀 있으면 확정 가능일이 된 뒤 화면을 새로 받아 서버가 새 날짜(today)로 다시 판정하게 한다 — 열어 둔 채 그날이 와도 풀리게(WHALEERP-690).
  // 브라우저의 한국 날짜가 확정 가능일에 닿았을 때만 새로 받는다(그 전 자정에는 받지 않는다, blockedRecheck). 받았는데도 막혀 있으면(PC 시계가 빠름)
  // 1분에서 두 배씩 늘려 30분 간격까지 다시 본다 — 시계가 며칠 빨라도 자주 받지 않게. 풀리면 blockedUntil 이 null 이 되어 멈춘다.
  // 화면 · 창으로 돌아왔을 때는 볼 때가 지났으면(잠자기로 타이머가 밀림) 바로 본다 — 이벤트가 둘 와도 한 번, 간격은 그대로. 처음 열 때는 바로 받지 않는다.
  // 저장하지 않은 입력이 있으면 미룬다 — 그사이 다른 사람이 저장했으면 새로 받을 때 입력이 사라질 수 있다(확정도 어차피 저장 뒤에만 된다).
  useEffect(() => {
    if (blockedUntil === null || dirty) return;
    let timer: ReturnType<typeof setTimeout>;
    let retryMs = RECHECK_FIRST_MS;
    let dueAt = 0;
    const schedule = (delayMs: number) => {
      clearTimeout(timer);
      dueAt = Date.now() + delayMs;
      timer = setTimeout(check, delayMs);
    };
    const check = () => {
      const plan = blockedRecheck(blockedUntil, new Date(), retryMs);
      if (plan.refresh) {
        router.refresh();
        retryMs = nextRecheckMs(retryMs);
      } else retryMs = RECHECK_FIRST_MS;
      schedule(plan.delayMs);
    };
    const handleReturn = () => {
      if (document.visibilityState === "visible" && Date.now() >= dueAt) check();
    };
    // 방금 서버가 그린 화면이라 처음에는 받지 않고 다음 볼 때를 잡는다
    const first = blockedRecheck(blockedUntil, new Date(), retryMs);
    schedule(first.refresh ? retryMs : first.delayMs);
    document.addEventListener("visibilitychange", handleReturn);
    window.addEventListener("focus", handleReturn);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleReturn);
      window.removeEventListener("focus", handleReturn);
    };
  }, [blockedUntil, dirty, router]);

  const totals = payslipTotals(items, new Map(items.map((i) => [i.payslipItemId, parseAmount(texts.get(i.payslipItemId) ?? "")])), withholding);
  const shown = items.filter((i) => isItemShown(i, withholding));
  // 묶음마다 합계(제목 줄 오른쪽) — 빈 칸 · 잘못 친 값은 0 으로 센다(실지급액 계산 payslipTotals 와 같은 기준, 2026-11-19 사용자 지정)
  const sumOf = (list: readonly PayslipItem[]) =>
    list.reduce((total, i) => {
      const amount = parseAmount(texts.get(i.payslipItemId) ?? "");
      return total + (amount === null || Number.isNaN(amount) ? 0 : amount);
    }, 0);
  const field = (item: PayslipItem, help: string) => (
    <AmountField
      key={item.payslipItemId}
      label={item.itemName}
      value={texts.get(item.payslipItemId) ?? ""}
      help={help}
      formula={item.calculationText !== null && help.includes(item.calculationText)}
      hours={
        hasHours(item)
          ? { value: hours.get(item.payslipItemId) ?? "", onChange: (text) => setHours((m) => new Map(m).set(item.payslipItemId, text)) }
          : undefined
      }
      readOnly={!editable}
      onChange={(text) => setText(item.payslipItemId, text)}
      onRemove={editable && item.itemCategory === "ADDITIONAL" ? () => setItems((l) => removeLine(l, item.payslipItemId)) : undefined}
    />
  );
  const earnings = shown.filter((i) => i.itemCategory === "EARNING");
  // 공제(4대보험 · 세금)는 4대보험 다음 세금 순서(sortDeductions)
  const basicDeductions = sortDeductions(shown.filter((i) => i.itemCategory === "BASIC" || i.itemCategory === "WITHHOLDING"));
  const deductionHelp = (item: PayslipItem) =>
    // 3.3% = 사업소득세 3% + 지방소득세 0.3%. 사업소득에는 비과세가 없어 식대 등 비과세 수당까지 더한 지급 합계에 매긴다 — 칸마다 셈식으로 보인다
    // (2026-11-19 사용자 지정, 전엔 두 칸 모두 「3.3% 원천징수 · 비과세를 포함한 지급 총액 N원에 매긴다.」라 뜻을 알기 어려웠다)
    item.itemCategory === "WITHHOLDING"
      ? `지급 합계(비과세 포함) ${formatAmount(totals.gross)}원 × ${item.itemCode === "BUSINESS_LOCAL_INCOME_TAX" ? "0.3%" : "3%"}`
      : "직접 입력";

  // 끄면 연장수당을 가산 없이 1배로 계산한다(PAY-05). 금액은 임시저장 때 api 가 그 값으로 다시 계산한다 — 칸을 고치지 않았으면 새 계산값을 따르고,
  // 앞서 직접 고쳐 둔 연장수당은 그대로 두고 계산값만 바꾼다(PR #159 리뷰). 저장하기 전에는 칸이 저장된 가산 값의 금액이다. 도움말은 지금
  // 스위치를 따른다 — 저장된 연장수당 식(「× 1.5배」)은 맞지 않아 보이지 않고 「가산수당 미적용 …」을 쓴다(PR #336 리뷰). 다시 계산은 토스트로 알린다.
  // 바꾼 뒤 무엇이 바뀌는지는 토스트로 알린다 — 지급 상자 안에 안내 줄을 띄우니 스위치를 누를 때마다 틀이 들썩였다(2026-11-19 사용자 지정).
  // 저장된 값으로 되돌린 경우는 알리지 않는다
  const togglePremium = (on: boolean) => {
    setPremium(on);
    if (on === payslip.isPremiumApplied) return;
    const times = on ? "1.5배" : "가산 없이 1배";
    toast(
      keptOvertime !== null
        ? `임시저장하면 연장수당 계산값을 ${times}로 다시 계산합니다. 직접 고친 연장수당(${formatAmount(keptOvertime)}원)은 그대로 둡니다.`
        : `임시저장하면 연장수당을 ${times}로 다시 계산합니다.`,
    );
  };
  // 가산을 바꿔도 지키는 연장수당 — api 와 같은 기준: 지금 칸 값이 저장된 금액과 다르거나(이번에 고침) 앞서 고쳐 둔 값이 있다. 저장된 값만 보면
  // 저장 전에 칸을 고쳤을 때 안내와 결과가 어긋난다(PR #137 리뷰)
  const overtimeItem = payslip.items.find((i) => i.itemCode === "OVERTIME_PAY");
  const overtimeText = overtimeItem ? parseAmount(texts.get(overtimeItem.payslipItemId) ?? "") : null;
  const keptOvertime =
    overtimeItem && overtimeText !== null && !Number.isNaN(overtimeText) && (overtimeText !== itemAmount(overtimeItem) || overtimeItem.adjustedAmount !== null)
      ? overtimeText
      : null;

  /** api 를 부르고, 성공하면 확인창을 닫고 알린 뒤 상세를 다시 받는다. 실패하면 확인창에 남기고, 결과를 모르면 상세도 다시 받는다. */
  const run = (call: () => Promise<{ ok: true } | EditFailure>, done: string) =>
    startBusy(async () => {
      const result = await callAction(call);
      if (!result.ok) {
        setFailure(result);
        if (result.unknown) router.refresh();
        return;
      }
      setDialog(null);
      setNotice(null);
      toast(done);
      router.refresh();
    });
  const save = () => {
    const { items: amounts, invalid } = saveItems(items, texts, hours);
    if (invalid.length > 0) return setFailure({ ok: false, message: `숫자만 넣어 주세요: ${invalid.join(", ")}` });
    const over = overHours(items, hours);
    if (over.length > 0) return setFailure({ ok: false, message: `근무시간은 744시간까지 넣을 수 있습니다: ${over.join(", ")}` });
    run(
      () =>
        saveDraft(payslip.payslipId, {
          updatedAt: payslip.updatedAt,
          isPremiumApplied: premium,
          isWithholdingApplied: isPartTime && withholding,
          items: amounts,
        }),
      "임시저장했습니다.",
    );
  };

  const load = () =>
    startBusy(async () => {
      const result = await callAction(() => loadPrevious(payslip.payslipId));
      if (!result.ok) return setFailure(result);
      // 없으면 확인창을 닫고 토스트로 알린다(WHALEERP-689) — 창 안에 남기면 할 수 있는 일이 없다
      if (!result.previous) {
        setDialog(null);
        return toast("불러올 지난 명세서가 없습니다.");
      }
      const next = applyPrevious(items, texts, result.previous);
      setItems(next.lines);
      setTexts(next.texts);
      setDialog(null);
      setNotice(
        `${result.previous.periodStartDate.slice(0, 7)} 명세서의 값 ${next.filled}칸을 불러왔습니다. 임시저장해야 남습니다.` +
          (loadedHoursAmount(result.previous) ? " 야간 · 휴일근무수당 시간은 이 달 값을 넣어 주세요." : ""),
      );
    });

  const [addable, setAddable] = useState<PayslipAdditionalItem[] | null>(null);
  // 체크한 항목 id — 드롭다운으로 하나씩 고르던 것을 체크 목록으로 바꿔 한 번에 여러 개를 붙인다(2026-11-19 사용자 지정, 브라우저 기본 드롭다운
  // 목록이 팝업 밖으로 튀어나와 어색했다)
  const [adding, setAdding] = useState<number[]>([]);
  const remaining = (addable ?? []).filter((a) => !items.some((i) => i.payslipItemMasterId === a.payslipItemMasterId));
  const openAdd = () => {
    open("add");
    setAdding([]);
    if (addable) return;
    startBusy(async () => {
      const result = await callAction(loadAdditionalItems);
      if (!result.ok) return setFailure(result);
      setAddable(result.items);
    });
  };
  const add = () => {
    const masters = remaining.filter((a) => adding.includes(a.payslipItemMasterId));
    if (!masters.length) return;
    setItems((l) => masters.reduce((list, master) => addAdditionalLine(list, master), l));
    setAdding([]);
  };

  const failureText = failure && (
    <p role="alert" className="mt-[8px] font-semibold text-erp-off">
      {failure.message}
    </p>
  );

  return (
    <>
      <div className="flex flex-col gap-[12px]">
        {/* 제목 줄은 「급여명세서 상세」와 버튼만. 직원 · 고용형태 · 급여월 · 근무지 · 상태는 아래 둥근 띠(8px · #c9d1de, 오른쪽 상자와 같은 테두리)에
            칸마다 이름(13px 회색) 위 · 값(15px 600) 아래로 나란히 둔다 — 한 줄 글자로는 강조가 약했다(2026-11-19 사용자 지정) */}
        <SectionHead
          title="급여명세서 상세"
        >
          {/* 버튼은 한 덩어리로 모은다 — 전엔 임시저장과 확정 사이에 회색 글자가 끼어 버튼이 떨어져 보였다(2026-11-19 사용자 지정). 확정을 막는 이유는
              요약 띠 「상태」 칸에 둔다 — 버튼 묶음 안에 두니 제목이 버튼보다 내려앉고 글자가 요약 띠에 겹쳤다 */}
          <span className="flex gap-[6px]">
              {editable && (
                <>
                  <Button variant="soft" onClick={() => open("save")}>
                    임시저장
                  </Button>
                  <Button disabled={blockedUntil !== null} onClick={() => open("confirm")}>
                    확정
                  </Button>
                </>
              )}
              {canUpdate && (payslip.status === "CONFIRMED" || payslip.status === "SENT") && (
                <>
                  <Button variant="soft" onClick={() => open("cancel")}>
                    확정 취소
                  </Button>
                  {payslip.status === "CONFIRMED" ? (
                    <Button onClick={() => open("send")}>발송</Button>
                  ) : (
                    <Button onClick={() => open("resend")}>재발송</Button>
                  )}
                </>
              )}
              <Button href={listHref}>
                목록
              </Button>
          </span>
        </SectionHead>
        <SummaryStrip cells={[
            // 세무사 사무실 급여명세서의 인적사항 줄처럼 「성명」(2026-11-19 사용자 지정, 통상시급은 오른쪽 「급여 산정 기준」에 둔다). 근로일수 · 근로시간(법정 기재 사항, 근로기준법 시행령
            // 제27조의2)은 api 가 아직 주지 않아 칸을 두지 않는다 — 3팀 요청
            // 퇴직일이 있으면 이름 옆에 「퇴직 YYYY-MM-DD」 · 「퇴직 예정 YYYY-MM-DD」 — 퇴직한 달 마지막 급여(14일 안 청산)인지 가른다(WHALEERP-764)
            {
              label: "성명",
              value: (
                <span className="flex items-center gap-[8px]">
                  <span className="text-[15px] font-semibold text-erp-ink">{payslip.staffName}</span>
                  {retirement && <CellView cell={retirement} />}
                </span>
              ),
            },
            // 고용형태 — 정직원 · 파트타이머에 따라 계산 · 공제(3.3%)가 달라 머리에 함께 보인다
            { label: "고용형태", value: <span className="text-[15px] font-semibold text-erp-ink">{employmentTypeLabel}</span> },
            { label: "급여월", value: <span className="text-[15px] font-semibold text-erp-ink">{monthLabel(month)}</span> },
            {
              label: "근무지",
              value: (
                <span className="text-[15px] font-semibold text-erp-ink">
                  <StoreNameWithType storeId={payslip.storeId} name={payslip.storeName} isHq={payslip.storeIsHq} />
                </span>
              ),
            },
            // 확정을 막는 날짜는 상태 칸에 배지와 함께 — 제목 줄 아래 따로 한 줄을 두니 버튼과 요약 띠 사이가 벌어지고 어디 말인지 떨어져 보였다(2026-11-19 사용자 지정)
            ...(payslip.status
              ? [
                  {
                    label: "상태",
                    value: (
                      <span className="flex items-center gap-[8px]">
                        <CellView cell={{ text: statusLabel, style: STATUS_STYLE[payslip.status] }} />
                        {editable && blockedUntil && <span className="text-[13px] font-medium text-erp-off">{blockedUntil}부터 확정할 수 있습니다.</span>}
                      </span>
                    ),
                  },
                ]
              : []),
          ]} />
        {band && (
          <Band
            warn
            inline={band.inline}
            title={band.title}
            desc={band.desc}
            // [출퇴근 기록 확인]은 뺐다 — 오른쪽 「검토 사유」 줄마다 할 일 링크(출퇴근 기록 보기 등)가 있다(2026-11-19 사용자 지정)
          />
        )}
        {notice && <Band title={notice} />}
      </div>

      <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
        {/* 상자 사이는 오른쪽 칸과 같은 24px(2026-11-19 사용자 지정) */}
        <section className="flex min-w-0 flex-col gap-[24px]">
          {/* 「지급」 상자 도구 줄에 가산수당 스위치와 오른쪽 끝 [출퇴근 다시 불러오기]를 모은다 — 위에 따로 도구 줄을 두니
              왼쪽 첫 상자가 오른쪽 「검토 대상 항목」보다 아래에서 시작했다(2026-11-19 사용자 지정, 두 칸 첫 상자 시작선을 맞춤) */}
          <GroupBox
            // 묶음 이름은 직원 근무 앱 급여명세서(「지급 항목」 · 「공제 항목」 · 「지급 합계」 · 「공제 합계」 · 「실지급액」)와 같은 말에, 일반 급여명세서처럼
            // 과세 · 비과세 / 기본 · 추가를 괄호로 가른다 — 사장님 화면과 직원이 받는 명세서가 같은 말이 되게(2026-11-19 사용자 지정)
            title="지급 항목"
            total={sumOf(earnings.filter((i) => !i.isTaxFree))}
            tools={
              // 법 용어 「가산수당」 + 켜는 때(근로기준법 제56조는 상시근로자 5인 이상 사업장에만 적용) — 「가산 적용」만으로는 무엇을 더하는지 알기 어려웠다
              // 도움말 상자를 스위치 왼쪽 끝에 맞춘다(alignGroup) — 아이콘에서 시작하면 오른쪽으로 치우쳤다(2026-11-19 사용자 지정)
              <span role="group" aria-label="가산수당 적용" className="flex items-center gap-[6px]">
                <Toggle label="연장·야간·휴일 가산수당 적용(5인 이상 사업장 필수)" checked={premium} disabled={!editable} onChange={(e) => togglePremium(e.target.checked)} />
                {/* 상시근로자 수 세는 법 — 5인 이상인지 사장님이 스스로 가를 수 있게(2026-11-19 사용자 지정) */}
                <HelpTip
                  floating
                  alignGroup
                  label="5인 이상 사업장 도움말"
                  // 뜻 덩어리마다 줄을 바꾸고 묶음 사이는 한 줄 띄운다(2026-11-19 사용자 지정) — HelpTip 은 글 안의 줄바꿈을 그대로 보인다
                  text={[
                    "상시근로자가 5명 이상인 사업장은",
                    "연장 · 야간 · 휴일 근무에 통상시급의 50%를 더해",
                    "지급해야 합니다.",
                    "",
                    "4명 이하인 사업장은 선택입니다.",
                    "단, 근로계약서에 가산수당을 지급하기로 했다면 켜 주세요.",
                    "",
                    "상시근로자 수는 대표자를 빼고",
                    "파트타이머 · 일용직을 포함한 지난 1개월 평균입니다.",
                  ].join("\n")}
                />
              </span>
            }
            action={
              editable && (
                <Button variant="outline" onClick={() => open("recalc")}>
                  출퇴근 다시 불러오기
                </Button>
              )
            }
          >
            <Rows>{earnings.filter((i) => !i.isTaxFree).map((i) => field(i, earningHelp(i, premium, payslip.isPremiumApplied)))}</Rows>
          </GroupBox>
          <GroupBox title="지급 항목(비과세)" total={sumOf(earnings.filter((i) => i.isTaxFree))}>
            <Rows>{earnings.filter((i) => i.isTaxFree).map((i) => field(i, earningHelp(i, premium, payslip.isPremiumApplied)))}</Rows>
          </GroupBox>
          <GroupBox
            id="deduction-basic"
            title="공제 항목(4대보험 · 세금)"
            total={sumOf(basicDeductions)}
            // 3.3% 는 지급이 아니라 떼는 돈이라 공제 제목 줄에 둔다 — 지급 제목 줄에 있으면 켰을 때 바뀌는 칸(공제)과 떨어져 있었다. 이름은 소득 구분이
            // 드러나게 「사업소득 3.3% 원천징수」(2026-11-19 사용자 지정). 파트타이머 명세서에만 선다(PAY-03)
            tools={
              isPartTime && (
                // 안내는 스위치 바로 아래에 둥근 꺾은선으로 잇는다 — 공제 칸 위에 따로 있으면 무엇을 켜는 안내인지 떨어져 보였다(2026-11-23 사용자 지정)
                <div className="flex flex-col gap-[6px]">
                  <Toggle label="3.3% 원천징수 적용" checked={withholding} disabled={!editable} onChange={(e) => setWithholding(e.target.checked)} />
                  <span className={`flex items-start gap-[4px] ${HELP}`}>
                    <span aria-hidden className="mt-[2px] ml-[4px] size-[7px] shrink-0 rounded-bl-[4px] border-b border-l border-current" />
                    <span>
                      3.3% 원천징수를 적용하면 [소득세]와 [지방소득세] 대신 [사업소득세 3%]와 [지방소득세 0.3%]가 공제됩니다.
                      <br />
                      4대보험 공제는 기존과 동일하게 유지됩니다.
                    </span>
                  </span>
                </div>
              )
            }
            action={
              editable && (
                <Button variant="outline" onClick={() => open("load")}>
                  지난 명세서에서 불러오기
                </Button>
              )
            }
          >
            <Rows>{basicDeductions.map((i) => field(i, deductionHelp(i)))}</Rows>
          </GroupBox>
          <GroupBox
            id="deduction-additional"
            title="공제 항목(추가)"
            total={sumOf(shown.filter((i) => i.itemCategory === "ADDITIONAL"))}
            action={
              editable && (
                <Button variant="outline" onClick={openAdd}>
                  항목 추가
                </Button>
              )
            }
          >
            <Rows>{shown.filter((i) => i.itemCategory === "ADDITIONAL").map((i) => field(i, deductionHelp(i)))}</Rows>
          </GroupBox>
          {/* 맨 아래 합계 띠 — 둥근 상자(8px)에 띠 전체를 회청 테두리(erp-brand)로 감싸 결론 줄로 도드라지게(2026-11-19 사용자 지정), 세 칸으로 나눠 이름(13px 회색) 위 · 금액 아래, 칸 사이에 「−」 · 「=」 동그라미.
              실지급액 칸만 옅은 바탕(erp-thead-bg) · 큰 금액(22px)으로 결론을 보인다(2026-11-19 사용자 지정 — 전엔 한 줄 글자라 눈에 덜 들어왔다) */}
          <div className="grid grid-cols-3 rounded-[8px] border border-erp-brand bg-white">
            {[
              { label: "지급 항목 합계", amount: totals.gross, op: null },
              { label: "공제 항목 합계", amount: totals.deduction, op: "−" },
            ].map((cell) => (
              <div key={cell.label} className={`relative flex flex-col justify-center gap-[4px] px-[24px] py-[14px] ${cell.op ? "border-l border-erp-thead-line" : ""}`}>
                {cell.op && <Operator sign={cell.op} />}
                <span className="text-[13px] font-medium text-erp-label">{cell.label}</span>
                <span className="text-[17px] font-semibold text-erp-ink tabular-nums">{formatAmount(cell.amount)}원</span>
              </div>
            ))}
            <div className="relative flex flex-col items-end justify-center gap-[4px] rounded-r-[8px] border-l border-erp-thead-line bg-erp-thead-bg px-[24px] py-[14px]">
              <Operator sign="=" />
              <span className="text-[13px] font-semibold text-erp-ink">실지급액</span>
              <span className="text-[22px] font-semibold text-erp-ink tabular-nums">{formatAmount(totals.net)}원</span>
            </div>
          </div>
          {totals.blankDeductions > 0 && (
            <Band
              risk
              title={`입력하지 않은 공제 항목이 ${totals.blankDeductions}개 있습니다.`}
              // 문구는 사용자 지정(2026-11-19)
              desc="공제 항목을 모두 입력해야 급여명세서를 확정할 수 있습니다. 공제 대상이 아닌 항목에는 0을 입력해 주세요."
            />
          )}
          <div className="flex justify-end">
            <Button variant="off" onClick={() => open("preview")}>
              미리보기
            </Button>
          </div>
        </section>
        <div className="flex min-w-0 flex-col gap-[24px]">{aside}</div>
      </div>

      <ConfirmDialog open={dialog === "save"} title="급여명세서를 임시저장하시겠습니까?" confirmLabel="임시저장" busy={busy} onConfirm={save} onCancel={close}>
        급여명세서의 상태는 변경되지 않으며, 수정한 내용은 처리내역에 기록됩니다.
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "confirm"}
        title="급여명세서를 확정하시겠습니까?"
        confirmLabel="확정"
        busy={busy}
        confirmDisabled={dirty || totals.blankDeductions > 0}
        onConfirm={() => run(() => confirmOne(payslip.payslipId, payslip.updatedAt), "확정되었습니다.")}
        onCancel={close}
      >
        {dirty
          ? "저장하지 않은 바뀐 내용이 있습니다. 임시저장한 뒤 확정해 주세요."
          : totals.blankDeductions > 0
            ? "입력하지 않은 공제 항목이 있어 확정할 수 없습니다. 공제 대상이 아닌 항목에는 0을 입력해 주세요."
            : `확정하면 수정할 수 없습니다. 확정 취소하면 검토 중으로 돌아옵니다. 발송은 이 화면의 「발송」이나 급여명세서 목록에서 확정 건을 모아 보냅니다.${
                band ? " 검토 사유는 확인한 것으로 남고, 확정 취소하면 다시 검토 대기가 됩니다." : ""
              }`}
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "recalc"}
        title="출퇴근 기록으로 다시 계산하시겠습니까?"
        confirmLabel="다시 계산"
        busy={busy}
        onConfirm={() => run(() => recalculate(payslip.payslipId, payslip.updatedAt), "출퇴근 기록으로 다시 계산했습니다.")}
        onCancel={close}
      >
        {/* 무엇을 하는지 · 무엇이 사라지는지를 문단으로 나눈다(2026-11-19 사용자 지정) */}
        <p>
          {payslip.periodStartDate} ~ {payslip.periodEndDate.slice(5)} 출퇴근 기록을 기준으로 기본급·주휴수당·연장수당을 다시 계산합니다.
        </p>
        <p className="mt-[6px]">직접 수정한 금액과 임시저장하지 않은 내용은 초기화됩니다.</p>
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "cancel"}
        title="급여명세서 확정을 취소하시겠습니까?"
        confirmLabel="확정 취소"
        busy={busy}
        onConfirm={() => run(() => cancelConfirmation(payslip.payslipId, payslip.updatedAt), "확정을 취소했습니다.")}
        onCancel={close}
      >
        {/* 다시 보내면 api 가 재발송 템플릿(EMAIL · PUSH_PAYSLIP_RESENT)을 쓴다 — 「처음 발송과 같은 문구」는 사실과 달라 고쳤다(2026-11-23 사용자 지정) */}
        {payslip.status === "SENT" ? (
          <>
            <p>확정을 취소하면 급여명세서가 검토 중 상태로 변경됩니다.</p>
            <p>다시 발송하기 전까지 직원 근무 앱에서는 금액 없이 「검토 중」으로 표시됩니다.</p>
            <p>수정 후 다시 확정하고 발송하면 직원에게 재발송 알림이 전송됩니다.</p>
          </>
        ) : (
          <>
            <p>확정을 취소하면 급여명세서가 검토 중 상태로 변경됩니다.</p>
            <p>수정 후 다시 확정해 주세요.</p>
          </>
        )}
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "send"}
        title="급여명세서를 발송하시겠습니까?"
        confirmLabel="발송"
        busy={busy}
        onConfirm={() => run(() => sendOne(payslip.payslipId, payslip.updatedAt), "발송했습니다.")}
        onCancel={close}
      >
        {payslip.staffName} 님의 직원 근무 앱 계정 이메일로 보내고 발송 완료로 바꿉니다. 앱 푸시 알림은 아직 보내지 않습니다.
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "resend"}
        title="급여명세서를 다시 발송하시겠습니까?"
        confirmLabel="재발송"
        busy={busy}
        onConfirm={() => run(() => resendOne(payslip.payslipId, payslip.updatedAt), "다시 발송했습니다.")}
        onCancel={close}
      >
        {/* 재발송은 재발송 템플릿(EMAIL · PUSH_PAYSLIP_RESENT)으로 간다 — 「문구는 처음 발송과 같습니다」는 사실과 달라 고쳤다(2026-11-23 사용자 지정) */}
        <p>{payslip.staffName} 님에게 급여명세서를 다시 발송합니다.</p>
        <p>직원에게 재발송 알림이 전송됩니다.</p>
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "load"} title="지난 명세서의 값을 불러오시겠습니까?" confirmLabel="불러오기" busy={busy} onConfirm={load} onCancel={close}>
        해당 직원의 지난 급여명세서에서 공제 내역과 직접 입력한 지급 항목 금액을 불러옵니다. 불러온 내용은 임시저장해야 최종 반영됩니다.
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "add"}
        title="공제 항목 추가"
        confirmLabel="추가"
        busy={busy}
        confirmDisabled={!adding.length}
        cancelLabel="닫기"
        onConfirm={add}
        onCancel={close}
      >
        <div className="flex w-[360px] max-w-full flex-col">
          {!addable ? (
            <p className="py-[12px] text-[14px] text-erp-muted">불러오는 중입니다.</p>
          ) : addable.length === 0 ? (
            <p className="py-[12px] text-[14px] text-erp-muted">추가할 수 있는 공제 항목이 없습니다.</p>
          ) : (
            <ul aria-label="추가 공제 항목" className="max-h-[420px] overflow-y-auto rounded-[2px] border border-erp-thead-line">
              {/* 팝업을 닫지 않고 이어 붙인다 — 붙인 항목은 목록에 남겨 체크 · 잠금 + 「추가됨」으로 보인다(2026-11-19 사용자 지정, 전엔 하나 붙일 때마다
                  팝업이 닫혔고, 그다음엔 붙인 이름을 아래 안내 한 줄로 늘어놓아 길면 두 줄로 꺾였다) */}
              {addable.map((a) => {
                const isAdded = !remaining.includes(a);
                return (
                  <li key={a.payslipItemMasterId} className="flex h-[42px] items-center justify-between gap-[8px] border-b border-erp-divider px-[12px] last:border-b-0">
                    <Checkbox
                      label={a.name}
                      checked={isAdded || adding.includes(a.payslipItemMasterId)}
                      disabled={isAdded}
                      onChange={(e) =>
                        setAdding((ids) => (e.target.checked ? [...ids, a.payslipItemMasterId] : ids.filter((id) => id !== a.payslipItemMasterId)))
                      }
                    />
                    {isAdded && <span className="shrink-0 text-[13px] font-medium text-erp-label">추가됨</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {failureText}
      </ConfirmDialog>
      {/* 보여 주기만 해서 확인 하나만 둔다 */}
      <ConfirmDialog open={dialog === "preview"} title="급여명세서 미리보기" confirmLabel="확인" cancelLabel={null} onConfirm={close} onCancel={close}>
        <DetailTable
          title={`${payslip.staffName} · ${month}`}
          rows={[
            { label: "지급 합계", value: formatAmount(totals.gross) },
            { label: "공제 합계", value: formatAmount(totals.deduction) },
            { label: "실지급액", value: formatAmount(totals.net) },
          ]}
        />
      </ConfirmDialog>
    </>
  );
}

/** server action 호출 자체가 끊기면(앞단 504 · 배포 중 재시작 · 네트워크) 오류 화면 대신 확인창에 결과 모름으로 남긴다 — 입력하던 값을 지키려고. */
async function callAction<T extends { ok: boolean }>(call: () => Promise<T>): Promise<T | EditFailure> {
  try {
    return await call();
  } catch (error) {
    unstable_rethrow(error); // redirect 같은 Next 제어 흐름은 그대로 넘긴다
    console.error("급여명세서 action 호출이 끊겼습니다", error);
    return { ok: false, unknown: true, message: "결과를 확인하지 못했습니다. 화면을 새로 고쳐 확인해 주세요." };
  }
}
