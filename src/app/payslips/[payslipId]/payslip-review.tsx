"use client";

import { useState, type ReactNode } from "react";
import { Button, ConfirmDialog, DetailTable, Field, FormGroup, FormRow, TextField, Toggle } from "@/components/common";
import { useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";
import { formatAmount, isItemShown, itemAmount, parseAmount, payslipTotals, type PayslipDetail, type PayslipItem } from "@/lib/payslips";
import { earningHelp } from "../payslip-row";

// 급여명세서 검토의 머리(목록 · 임시저장 · 확정)와 왼쪽 「지급 내역」. 데모 docs/demo/staff/payrolls-detail.html(원본
// src/pages/staff/payrolls-detail.mjs)과 목업 docs/mockup/staff/payrolls-detail.html 의 3.3% 원천징수 칸을 옮겼다.
// 데이터는 GET /payslips/:id 이고, 저장 · 확정 · 다시 계산 · 불러오기 api 는 아직 없어 확인창만 열고 닫는다. 금액 칸 · 두 스위치는
// 이 화면 안에서만 바뀌고(새로고침하면 처음 값), 합계와 빨간 띠가 따라 바뀐다. 추가 공제 붙이기는 급여 항목 api 가 없어 「준비 중」이다.
// 고칠 수 있는 것은 작성 중 · 검토 중이고 수정 권한이 있을 때뿐이다 — 확정 · 발송 완료는 읽기만 하고 「확정 취소」만 둔다(okf/staff.md 급여).

type Dialog = "save" | "confirm" | "cancel" | "recalculate" | "load" | "preview";

const HELP = "text-[12px] leading-[1.5] text-erp-muted";
const textOf = (amount: number | null) => (amount === null ? "" : formatAmount(amount));

/** 도움말이 있는 칸(데모 fieldH). 도움말 유무가 섞인 줄에서도 칸 위쪽이 맞게 위로 붙인다. */
function AmountField({ label, value, help, readOnly, onChange }: { label: string; value: string; help: string; readOnly: boolean; onChange: (text: string) => void }) {
  const invalid = Number.isNaN(parseAmount(value));
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[8px]">
      <Field label={label}>
        <TextField
          value={value}
          inputMode="numeric"
          placeholder={readOnly ? undefined : "직접 입력"}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          // 다 친 뒤에 쉼표를 넣는다 — 치는 중에 넣으면 커서가 끝으로 튄다
          onBlur={(e) => {
            const amount = parseAmount(e.target.value);
            if (amount !== null && !Number.isNaN(amount)) onChange(formatAmount(amount));
          }}
        />
      </Field>
      {help && <span className={HELP}>{help}</span>}
    </div>
  );
}

/** 두 칸씩 한 줄. 홀수면 빈 칸으로 반을 채워 마지막 칸이 줄 전체로 늘지 않게 한다. */
function Rows({ children, per = 2 }: { children: ReactNode[]; per?: number }) {
  const rows: ReactNode[][] = [];
  for (let i = 0; i < children.length; i += per) rows.push(children.slice(i, i + per));
  return rows.map((row, i) => (
    <FormRow key={i}>
      {row}
      {Array.from({ length: per - row.length }, (_, j) => (
        <div key={`empty-${j}`} className="min-w-px flex-1" />
      ))}
    </FormRow>
  ));
}

/** 경고 띠(데모 band). risk 면 빨강 바탕. */
export function Band({ title, desc, actions, risk }: { title: string; desc?: string; actions?: ReactNode; risk?: boolean }) {
  return (
    <div
      role={risk ? "alert" : undefined}
      className={`flex min-h-[46px] items-center gap-[12px] rounded-[2px] border px-[16px] py-[12px] ${risk ? "border-erp-off-bg bg-erp-off-bg" : "border-erp-panel-line bg-erp-thead-bg"}`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
        <p className={`text-[14px] font-semibold ${risk ? "text-erp-off" : "text-erp-ink"}`}>{title}</p>
        {desc && <p className="text-[14px] leading-[1.6] text-erp-ink">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-[6px]">{actions}</div>}
    </div>
  );
}

/** 묶음 제목 줄(데모 sectionHead). */
export function SectionHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-end gap-[6px]">
      <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{title}</h2>
      {children}
    </div>
  );
}

export function PayslipReview({
  payslip,
  band,
  listHref,
  aside,
}: {
  payslip: PayslipDetail;
  /** 위쪽 경고 띠(reviewBand). 없으면 null */
  band: { title: string; desc: string } | null;
  listHref: string;
  /** 오른쪽 단(검토 사유 · 참조한 것 · 처리 이력) */
  aside: ReactNode;
}) {
  const canUpdate = useMenuRole(MENU_CODE.payslips, "update");
  const editable = canUpdate && (payslip.status === "DRAFTING" || payslip.status === "REVIEWING");
  const isPartTime = payslip.employmentType === "PART_TIME";
  const month = payslip.periodStartDate.slice(0, 7);

  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const [premium, setPremium] = useState(payslip.isPremiumApplied);
  const [withholding, setWithholding] = useState(payslip.isWithholdingApplied);
  const { items } = payslip;
  const [texts, setTexts] = useState(() => new Map(payslip.items.map((i) => [i.payslipItemId, textOf(itemAmount(i))])));
  const setText = (id: number, text: string) => setTexts((m) => new Map(m).set(id, text));

  const totals = payslipTotals(items, new Map(items.map((i) => [i.payslipItemId, parseAmount(texts.get(i.payslipItemId) ?? "")])), withholding);
  const shown = items.filter((i) => isItemShown(i, withholding));
  const field = (item: PayslipItem, help: string) => (
    <AmountField
      key={item.payslipItemId}
      label={item.itemName}
      value={texts.get(item.payslipItemId) ?? ""}
      help={help}
      readOnly={!editable}
      onChange={(text) => setText(item.payslipItemId, text)}
    />
  );
  const earnings = shown.filter((i) => i.itemCategory === "EARNING");
  const deductionHelp = (item: PayslipItem) =>
    item.itemCategory === "WITHHOLDING" ? "3.3% 원천징수 · 식대 같은 비과세를 포함한 지급 총액에 매긴다" : "직접 입력";

  const togglePremium = (on: boolean) => {
    setPremium(on);
    // 끄면 연장수당을 계산하지 않는다(PAY-05). 켜면 처음 값으로 돌린다 — 다시 계산은 api 가 한다.
    const overtime = items.find((i) => i.itemCode === "OVERTIME_PAY");
    if (overtime) setText(overtime.payslipItemId, on ? textOf(itemAmount(overtime)) : "0");
  };
  return (
    <>
      <div className="flex flex-col gap-[12px]">
        <SectionHead
          title={
            <>
              {payslip.staffName}
              <span className="pl-[6px] text-[14px] font-normal text-erp-label">
                {month} · {payslip.storeName}
              </span>
            </>
          }
        >
          <Button variant="off" href={listHref}>
            목록
          </Button>
          {editable && (
            <>
              <Button variant="soft" onClick={() => setDialog("save")}>
                임시저장
              </Button>
              <Button onClick={() => setDialog("confirm")}>확정</Button>
            </>
          )}
          {canUpdate && (payslip.status === "CONFIRMED" || payslip.status === "SENT") && (
            <Button variant="soft" onClick={() => setDialog("cancel")}>
              확정 취소
            </Button>
          )}
        </SectionHead>
        {band && (
          <Band
            title={band.title}
            desc={band.desc}
            actions={
              <Button variant="soft" disabled title="준비 중입니다.">
                출퇴근 보정
              </Button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
        <section className="flex min-w-0 flex-col gap-[12px]">
          <SectionHead title="지급 내역">
            <span className="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-[14px] font-medium whitespace-nowrap text-erp-ink">
              {payslip.periodStartDate} ~ {payslip.periodEndDate.slice(5)}
            </span>
            {editable && (
              <Button variant="soft" className="ml-[6px]" onClick={() => setDialog("recalculate")}>
                출퇴근으로 다시 계산
              </Button>
            )}
          </SectionHead>
          <div className="flex flex-col gap-[8px]">
            <Toggle label="연장·야간·휴일 가산 적용" checked={premium} disabled={!editable} onChange={(e) => togglePremium(e.target.checked)} />
            {/* 파트타이머 명세서에만 선다(PAY-03). 켜면 공제가 4대보험 넷과 3.3% 가 되고 소득세 · 지방소득세는 빠진다 */}
            {isPartTime && (
              <>
                <Toggle label="3.3% 원천징수 적용" checked={withholding} disabled={!editable} onChange={(e) => setWithholding(e.target.checked)} />
                <span className={HELP}>
                  켜면 공제가 4대보험 네 줄과 3.3% 가 되고 소득세·지방소득세는 빠집니다. 노무·세무 확인 중입니다(STAFF-18).
                </span>
              </>
            )}
          </div>
          <FormGroup title="지급">
            <Rows>{earnings.filter((i) => !i.isTaxFree).map((i) => field(i, earningHelp(i, premium)))}</Rows>
          </FormGroup>
          <FormGroup title="지급 · 비과세">
            <Rows per={3}>{earnings.filter((i) => i.isTaxFree).map((i) => field(i, earningHelp(i, premium)))}</Rows>
          </FormGroup>
          <FormGroup title="공제 · 기본">
            {editable && (
              <div className="flex justify-end">
                <Button variant="soft" onClick={() => setDialog("load")}>
                  지난 명세서에서 불러오기
                </Button>
              </div>
            )}
            <Rows>{shown.filter((i) => i.itemCategory === "BASIC" || i.itemCategory === "WITHHOLDING").map((i) => field(i, deductionHelp(i)))}</Rows>
          </FormGroup>
          <FormGroup title="공제 · 추가">
            {editable && (
              <div className="flex justify-end">
                {/* 붙일 추가 공제 항목을 고를 급여 항목 api 가 아직 없다 */}
                <Button variant="soft" disabled title="준비 중입니다.">
                  항목 추가
                </Button>
              </div>
            )}
            <Rows>{shown.filter((i) => i.itemCategory === "ADDITIONAL").map((i) => field(i, deductionHelp(i)))}</Rows>
          </FormGroup>
          <div className="flex h-[46px] items-center border-y border-erp-thead-line px-[12px]">
            <span className="flex-1 text-[16px] font-semibold text-erp-ink">실지급액</span>
            <span className="text-[22px] font-semibold text-erp-ink">₩{formatAmount(totals.net)}</span>
          </div>
          {totals.blankDeductions > 0 && (
            <Band
              risk
              title={`공제 ${totals.blankDeductions}칸이 아직 비어 있습니다`}
              desc={`${totals.deduction === 0 ? "지금 실지급액은 지급 총액과 같습니다. " : ""}기본 공제나 붙인 추가 공제가 비어 있으면 확정할 수 없습니다. 공제 대상이 아닌 항목에는 0 을 넣으세요.`}
            />
          )}
          <div className="flex justify-end">
            <Button variant="off" onClick={() => setDialog("preview")}>
              미리보기
            </Button>
          </div>
        </section>
        <div className="flex min-w-0 flex-col gap-[24px]">{aside}</div>
      </div>

      <ConfirmDialog open={dialog === "save"} title="급여명세서를 임시저장하시겠습니까?" confirmLabel="임시저장" onConfirm={close} onCancel={close}>
        {null}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "confirm"}
        title="급여명세서를 확정하시겠습니까?"
        confirmLabel="확정"
        confirmDisabled={totals.blankDeductions > 0}
        onConfirm={close}
        onCancel={close}
      >
        {totals.blankDeductions > 0
          ? "비어 있는 공제 칸이 있어 확정할 수 없습니다. 공제 대상이 아닌 항목에는 0 을 넣으세요."
          : "확정하면 수정할 수 없습니다. 확정 취소하면 검토 중으로 돌아옵니다. 발송은 급여명세서 목록에서 확정 건을 모아 보냅니다."}
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "cancel"} title="급여명세서 확정을 취소하시겠습니까?" confirmLabel="확정 취소" onConfirm={close} onCancel={close}>
        검토 중으로 돌아옵니다. 발송한 뒤에도 취소할 수 있습니다.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "recalculate"} title="출퇴근 기록으로 다시 계산하시겠습니까?" confirmLabel="다시 계산" onConfirm={close} onCancel={close}>
        {payslip.attendanceStartDate} ~ {payslip.attendanceEndDate.slice(5)} 출퇴근 기록으로 기본급·주휴수당·연장수당을 다시 계산합니다.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "load"} title="지난 명세서의 공제 값을 불러오시겠습니까?" confirmLabel="불러오기" onConfirm={close} onCancel={close}>
        지난달 명세서의 기본 공제 값을 불러옵니다.
      </ConfirmDialog>
      {/* 데모는 「닫기」 하나다. 공통 확인창은 버튼이 늘 둘이라 둘 다 닫기만 한다 */}
      <ConfirmDialog open={dialog === "preview"} title="직원에게 보이는 급여명세서" confirmLabel="확인" cancelLabel="닫기" onConfirm={close} onCancel={close}>
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
