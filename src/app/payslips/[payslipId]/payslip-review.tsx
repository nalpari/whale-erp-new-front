"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Button, ConfirmDialog, DetailTable, Field, FormGroup, FormRow, Select, TextField, Toggle, useToast } from "@/components/common";
import { useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";
import {
  formatAmount,
  isItemShown,
  itemAmount,
  parseAmount,
  payslipTotals,
  type PayslipAdditionalItem,
  type PayslipDetail,
  type PayslipItem,
} from "@/lib/payslips";
import { earningHelp } from "../payslip-row";
import {
  cancelPayslipConfirmation,
  confirmPayslip,
  getAdditionalItems,
  getPreviousValues,
  resendPayslip,
  savePayslip,
  sendPayslip,
  type EditFailure,
} from "./actions";
import { addAdditionalLine, applyPrevious, removeLine, saveItems } from "./payslip-edit";

// 급여명세서 검토의 머리(목록 · 임시저장 · 확정)와 왼쪽 「지급 내역」. 데모 docs/demo/staff/payrolls-detail.html(원본
// src/pages/staff/payrolls-detail.mjs)과 목업 docs/mockup/staff/payrolls-detail.html 의 3.3% 원천징수 칸을 옮겼다.
// 데이터는 GET /payslips/:id 이고, 임시저장 · 지난 명세서 불러오기 · 항목 추가(WHALEERP-228)와 확정 · 확정 취소(WHALEERP-230)는
// server action(actions.ts)으로 api 를 부른다. 확정이면 「발송」, 발송 완료면 「재발송」(확인창을 거친다, WHALEERP-231 · 237). 금액 칸 · 두 스위치 · 붙인 추가 공제는 임시저장해야 남고, 합계와 빨간 띠가 따라 바뀐다.
// 성공하면 router.refresh() 로 상세를 다시 받는다 — page 가 updatedAt 을 key 로 줘 화면 상태도 새 값으로 다시 선다.
// 「출퇴근으로 다시 계산」은 출퇴근 집계(WHALEERP-227)가 없어 「준비 중」이다.
// 고칠 수 있는 것은 작성 중 · 검토 중이고 수정 권한이 있을 때뿐이다 — 확정 · 발송 완료는 읽기만 하고 「확정 취소」만 둔다(okf/staff.md 급여).

type Dialog = "save" | "confirm" | "cancel" | "send" | "resend" | "load" | "add" | "preview";

const HELP = "text-[12px] leading-[1.5] text-erp-muted";
const textOf = (amount: number | null) => (amount === null ? "" : formatAmount(amount));

/** 도움말이 있는 칸(데모 fieldH). 도움말 유무가 섞인 줄에서도 칸 위쪽이 맞게 위로 붙인다. */
function AmountField({
  label,
  value,
  help,
  readOnly,
  onChange,
  onRemove,
}: {
  label: string;
  value: string;
  help: string;
  readOnly: boolean;
  onChange: (text: string) => void;
  /** 붙인 추가 공제를 뗀다(고칠 수 있을 때만) */
  onRemove?: () => void;
}) {
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
      {(help || onRemove) && (
        <span className={`flex gap-[6px] ${HELP}`}>
          <span className="flex-1">{help}</span>
          {onRemove && (
            <button type="button" className="cursor-pointer text-erp-link hover:underline" onClick={onRemove}>
              빼기
            </button>
          )}
        </span>
      )}
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
  const router = useRouter();
  const toast = useToast();
  const canUpdate = useMenuRole(MENU_CODE.payslips, "update");
  const editable = canUpdate && (payslip.status === "DRAFTING" || payslip.status === "REVIEWING");
  const isPartTime = payslip.employmentType === "PART_TIME";
  const month = payslip.periodStartDate.slice(0, 7);

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
  // 저장하지 않은 바뀜 — 확정은 저장된 값으로 하므로 먼저 임시저장하게 한다
  const snapshot = (lines: PayslipItem[], values: Map<number, string>, p: boolean, w: boolean) =>
    JSON.stringify([p, w, saveItems(lines, values).items]);
  const [saved] = useState(() => snapshot(items, texts, premium, withholding));
  const dirty = snapshot(items, texts, premium, withholding) !== saved;

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
      onRemove={editable && item.itemCategory === "ADDITIONAL" ? () => setItems((l) => removeLine(l, item.payslipItemId)) : undefined}
    />
  );
  const earnings = shown.filter((i) => i.itemCategory === "EARNING");
  const deductionHelp = (item: PayslipItem) =>
    item.itemCategory === "WITHHOLDING" ? `3.3% 원천징수 · 비과세를 포함한 지급 총액 ${formatAmount(totals.gross)}원에 매긴다` : "직접 입력";

  const togglePremium = (on: boolean) => {
    setPremium(on);
    // 끄면 연장수당을 계산하지 않는다(PAY-05). 켜면 처음 값으로 돌린다 — 다시 계산은 api 가 한다.
    const overtime = items.find((i) => i.itemCode === "OVERTIME_PAY");
    if (overtime) setText(overtime.payslipItemId, on ? textOf(itemAmount(overtime)) : "0");
  };

  /** api 를 부르고, 성공하면 확인창을 닫고 알린 뒤 상세를 다시 받는다. 실패하면 확인창에 남긴다. */
  const run = (call: () => Promise<{ ok: true } | EditFailure>, done: string) =>
    startBusy(async () => {
      const result = await call();
      if (!result.ok) return setFailure(result);
      setDialog(null);
      setNotice(null);
      toast(done);
      router.refresh();
    });
  const save = () => {
    const { items: amounts, invalid } = saveItems(items, texts);
    if (invalid.length > 0) return setFailure({ ok: false, message: `숫자만 넣어 주세요: ${invalid.join(", ")}` });
    run(
      () =>
        savePayslip(payslip.payslipId, {
          updatedAt: payslip.updatedAt,
          isPremiumApplied: premium,
          isWithholdingApplied: isPartTime && withholding,
          items: amounts,
        }),
      "saved",
    );
  };

  const load = () =>
    startBusy(async () => {
      const result = await getPreviousValues(payslip.payslipId);
      if (!result.ok) return setFailure(result);
      if (!result.previous) return setFailure({ ok: false, message: "불러올 지난 명세서가 없습니다." });
      const next = applyPrevious(items, texts, result.previous);
      setItems(next.lines);
      setTexts(next.texts);
      setDialog(null);
      setNotice(`${result.previous.periodStartDate.slice(0, 7)} 명세서의 값 ${next.filled}칸을 불러왔습니다. 임시저장해야 남습니다.`);
    });

  const [addable, setAddable] = useState<PayslipAdditionalItem[] | null>(null);
  const [adding, setAdding] = useState("");
  const remaining = (addable ?? []).filter((a) => !items.some((i) => i.payslipItemMasterId === a.payslipItemMasterId));
  const openAdd = () => {
    open("add");
    setAdding("");
    if (addable) return;
    startBusy(async () => {
      const result = await getAdditionalItems();
      if (!result.ok) return setFailure(result);
      setAddable(result.items);
    });
  };
  const add = () => {
    const master = remaining.find((a) => String(a.payslipItemMasterId) === adding);
    if (!master) return;
    setItems((l) => addAdditionalLine(l, master));
    setDialog(null);
  };

  const failureText = failure && (
    <p role="alert" className="mt-[8px] font-semibold text-erp-off">
      {failure.message}
    </p>
  );

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
              <Button variant="soft" onClick={() => open("save")}>
                임시저장
              </Button>
              <Button onClick={() => open("confirm")}>확정</Button>
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
        {notice && <Band title={notice} />}
      </div>

      <div className="grid grid-cols-[7fr_5fr] items-start gap-[24px]">
        <section className="flex min-w-0 flex-col gap-[12px]">
          <SectionHead title="지급 내역">
            <span className="inline-block rounded-[2px] bg-erp-subtle px-[4px] py-[2px] text-[14px] font-medium whitespace-nowrap text-erp-ink">
              {payslip.periodStartDate} ~ {payslip.periodEndDate.slice(5)}
            </span>
            {editable && (
              // 출퇴근 집계 · 계산(WHALEERP-227)이 아직 없다
              <Button variant="soft" className="ml-[6px]" disabled title="준비 중입니다.">
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
                <Button variant="soft" onClick={() => open("load")}>
                  지난 명세서에서 불러오기
                </Button>
              </div>
            )}
            <Rows>{shown.filter((i) => i.itemCategory === "BASIC" || i.itemCategory === "WITHHOLDING").map((i) => field(i, deductionHelp(i)))}</Rows>
          </FormGroup>
          <FormGroup title="공제 · 추가">
            {editable && (
              <div className="flex justify-end">
                <Button variant="soft" onClick={openAdd}>
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
            <Button variant="off" onClick={() => open("preview")}>
              미리보기
            </Button>
          </div>
        </section>
        <div className="flex min-w-0 flex-col gap-[24px]">{aside}</div>
      </div>

      <ConfirmDialog open={dialog === "save"} title="급여명세서를 임시저장하시겠습니까?" confirmLabel="임시저장" busy={busy} onConfirm={save} onCancel={close}>
        상태는 그대로이고, 바꾼 내용은 처리 이력에 남습니다.
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "confirm"}
        title="급여명세서를 확정하시겠습니까?"
        confirmLabel="확정"
        busy={busy}
        confirmDisabled={dirty || totals.blankDeductions > 0}
        onConfirm={() => run(() => confirmPayslip(payslip.payslipId, payslip.updatedAt), "확정되었습니다.")}
        onCancel={close}
      >
        {dirty
          ? "저장하지 않은 바뀐 내용이 있습니다. 임시저장한 뒤 확정해 주세요."
          : totals.blankDeductions > 0
            ? "비어 있는 공제 칸이 있어 확정할 수 없습니다. 공제 대상이 아닌 항목에는 0 을 넣으세요."
            : `확정하면 수정할 수 없습니다. 확정 취소하면 검토 중으로 돌아옵니다. 발송은 급여명세서 목록에서 확정 건을 모아 보냅니다.${
                band ? " 검토 사유는 확인한 것으로 남습니다." : ""
              }`}
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "cancel"}
        title="급여명세서 확정을 취소하시겠습니까?"
        confirmLabel="확정 취소"
        busy={busy}
        onConfirm={() => run(() => cancelPayslipConfirmation(payslip.payslipId, payslip.updatedAt), "확정을 취소했습니다.")}
        onCancel={close}
      >
        {payslip.status === "SENT"
          ? "검토 중으로 돌아옵니다. 이미 보낸 명세서라 직원 근무 앱에서는 다시 보낼 때까지 이 명세서가 보이지 않습니다. 고친 뒤 다시 확정해 보내면 「다시 발송」 문구로 갑니다."
          : "검토 중으로 돌아옵니다. 발송한 뒤에도 취소할 수 있습니다."}
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "send"}
        title="급여명세서를 발송하시겠습니까?"
        confirmLabel="발송"
        busy={busy}
        onConfirm={() => run(() => sendPayslip(payslip.payslipId, payslip.updatedAt), "발송했습니다.")}
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
        onConfirm={() => run(() => resendPayslip(payslip.payslipId, payslip.updatedAt), "다시 발송했습니다.")}
        onCancel={close}
      >
        {payslip.staffName} 님에게 「다시 발송되었습니다 · 금액이 바뀌었을 수 있습니다」 문구로 지금 값을 다시 보냅니다.
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "load"} title="지난 명세서의 값을 불러오시겠습니까?" confirmLabel="불러오기" busy={busy} onConfirm={load} onCancel={close}>
        같은 직원의 지난 명세서에서 공제와 직접 넣는 지급 항목 값을 칸에 채웁니다. 임시저장해야 남습니다.
        {failureText}
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "add"}
        title="추가 공제 항목을 붙이시겠습니까?"
        confirmLabel="붙이기"
        busy={busy}
        confirmDisabled={!adding}
        onConfirm={add}
        onCancel={close}
      >
        <Select aria-label="추가 공제 항목" value={adding} onChange={(e) => setAdding(e.target.value)} disabled={!addable}>
          <option value="">{addable ? (remaining.length > 0 ? "항목을 고르세요" : "붙일 항목이 없습니다") : "불러오는 중"}</option>
          {remaining.map((a) => (
            <option key={a.payslipItemMasterId} value={a.payslipItemMasterId}>
              {a.name}
            </option>
          ))}
        </Select>
        {failureText}
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
