"use client";

import { useEffect, useId, useRef, useState, useTransition, type RefObject } from "react";
import { logout } from "@/app/actions";
import { Button, ConfirmDialog, Field, FormGroup, PasswordInput, Select, SlidePanel, Textarea } from "@/components/common";
import { withdrawFormField, withdrawWarningText, WITHDRAW_REASONS, type WithdrawEligibility, type WithdrawWarningBlock } from "@/lib/withdrawal-form";
import { createWithdrawalAction, getWithdrawEligibilityAction } from "./withdraw-actions";

type Step = "password" | "content" | "done";
type Form = { currentPassword: string; reasonCode: string; reasonDetail: string };
const EMPTY: Form = { currentPassword: "", reasonCode: "", reasonDetail: "" };

type FieldAt = "currentPassword" | "reasonDetail";

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}

function FailedBand({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      {message}
    </div>
  );
}

// 경고 상자 — bp-apply-dialog.tsx 와 같은 위험 띠 모양(테두리·바탕은 erp-thead, 제목만 #e93737, DESIGN.md 에
// 토큰이 없는 Figma 전용 색). head/text 블록은 head 를 굵게, text 는 \n 을 그대로 줄바꿈으로 보인다(whitespace-pre-line).
function WarningBlock({ block }: { block: WithdrawWarningBlock }) {
  if (typeof block === "string") return <p className="whitespace-pre-line">{block}</p>;
  return (
    <div>
      <p className="font-semibold">{block.head}</p>
      <p className="whitespace-pre-line">{block.text}</p>
    </div>
  );
}

function ConditionRow({ label, checked, note }: { label: string; checked: boolean | null; note: string }) {
  const mark = checked === null ? <span className="text-erp-label">–</span> : checked ? <span className="text-erp-link">✓</span> : <span className="text-erp-off">–</span>;
  return (
    <div className="flex items-start gap-[8px] text-[14px]">
      <span aria-hidden className="mt-[1px] w-[16px] shrink-0 text-center font-semibold">
        {mark}
      </span>
      <div>
        <p className="text-erp-ink">{label}</p>
        <p className="text-[13px] text-erp-muted">{note}</p>
      </div>
    </div>
  );
}

/** GNB 「회원 탈퇴」가 여는 슬라이드 패널(MY PAGE, S-JHQQNR). 1단계(비밀번호)는 api 를 부르지 않는다 — 별도
 * 비밀번호 확인 엔드포인트가 없고, 실제 확인은 최종 제출(POST /auth/admin/me/withdraw)에서만 일어난다(설계
 * 결정, Task 3 dispatch). 2단계(내용)에 들어가기 전부터 eligibility 를 미리 불러 둬 2단계 전환이 기다리지
 * 않게 한다. 성공하면 비밀번호 변경과 같은 패턴으로 패널을 닫지 않고 완료 화면으로 바꾼 뒤, 로그아웃은
 * 사용자가 "확인"을 눌러야 일어난다 — 탈퇴 안내 이메일을 보냈다는 문구를 반드시 보게 한다. */
export function WithdrawPanel({ id, open, onClose, trigger }: { id: string; open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null> }) {
  const ids = useId();
  const [step, setStep] = useState<Step>("password");
  const [form, setForm] = useState<Form>(EMPTY);
  const [eligibility, setEligibility] = useState<WithdrawEligibility | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ at: FieldAt; message: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  // password-change-panel.tsx 의 saveNumber 와 같은 패턴 — 패널을 닫았다 다시 열면 지난 요청의 응답이 늦게
  // 와도 새 세션에 적용되지 않게 막는다.
  const saveNumber = useRef(0);

  const [openedFor, setOpenedFor] = useState(open);
  const [fieldGeneration, setFieldGeneration] = useState(0);
  if (open !== openedFor) {
    setOpenedFor(open);
    setStep("password");
    setForm(EMPTY);
    setEligibility(null);
    setLoadError(null);
    setFieldError(null);
    setFailure(null);
    setConfirmOpen(false);
    setFieldGeneration((g) => g + 1);
  }

  // 열릴 때마다 eligibility 를 미리 받아 둔다 — 2단계는 비밀번호 칸을 지난 뒤에야 보이지만, 그 전환이
  // 기다리지 않도록 1단계에 있는 동안 백그라운드로 불러 둔다. saveNumber 로 지난 세션의 응답을 거른다.
  useEffect(() => {
    if (!open) return;
    saveNumber.current++;
    const mine = saveNumber.current;
    (async () => {
      const result = await getWithdrawEligibilityAction();
      if (mine !== saveNumber.current) return;
      if (result.ok) setEligibility(result.data);
      else setLoadError(result.message);
    })();
  }, [open]);

  const doneHeadingId = `${ids}-done`;
  useEffect(() => {
    if (step === "done") requestAnimationFrame(() => document.getElementById(doneHeadingId)?.focus());
  }, [step, doneHeadingId]);

  const currentPasswordMessageId = `${ids}-currentPassword`;
  const reasonDetailMessageId = `${ids}-reasonDetail`;

  // password-change-panel.tsx 의 handleClose 와 같은 이유 — 저장 중이거나 확인창이 떠 있을 때 닫으면
  // 제출 결과(성공한 완료 화면, 실패한 오류 문구)를 아무도 못 본다.
  const handleClose = () => {
    if (!saving && !confirmOpen) onClose();
  };

  const handleConfirm = () => {
    setFieldError(null);
    setFailure(null);
    const mine = saveNumber.current;
    startSaving(async () => {
      try {
        const result = await createWithdrawalAction({
          currentPassword: form.currentPassword,
          reasonCode: form.reasonCode,
          reasonDetail: form.reasonCode === "WD_INPUT" ? form.reasonDetail : undefined,
        });
        if (mine !== saveNumber.current) return; // 그사이 패널을 닫았다 다시 열었다 — 지난 응답은 버린다
        setConfirmOpen(false);
        if (!result.ok) {
          const field = withdrawFormField(result.status, result.message);
          if (field === "currentPassword") {
            setStep("password");
            setFieldError({ at: "currentPassword", message: result.message });
            return;
          }
          if (field === "reasonDetail") {
            setFieldError({ at: "reasonDetail", message: result.message });
            return;
          }
          setFailure(result.message); // 진행 중인 근로계약 등 특정 칸을 가리킬 수 없는 거절 — content 단계에 남긴다
          return;
        }
        setForm(EMPTY);
        setStep("done");
      } catch (error: unknown) {
        if (mine !== saveNumber.current) return;
        console.error("회원 탈퇴 처리 실패", error);
        setConfirmOpen(false);
        setFailure("회원 탈퇴 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <SlidePanel id={id} open={open} onClose={handleClose} label="회원 탈퇴" trigger={trigger} closeOnBackdrop>
      <h2 className="text-[18px] font-semibold text-erp-ink">회원 탈퇴</h2>

      {step === "password" && (
        <>
          <FormGroup title="본인 확인">
            <div className="flex flex-col gap-[8px]">
              <Field label="현재 비밀번호" required>
                <PasswordInput
                  key={fieldGeneration}
                  fieldLabel="현재 비밀번호"
                  autoComplete="current-password"
                  placeholder="지금 쓰고 있는 비밀번호를 입력해 주세요."
                  maxLength={100}
                  value={form.currentPassword}
                  onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  aria-invalid={fieldError?.at === "currentPassword" ? true : undefined}
                  aria-describedby={fieldError?.at === "currentPassword" ? currentPasswordMessageId : undefined}
                  aria-required
                />
              </Field>
              <FieldMessage id={currentPasswordMessageId} message={fieldError?.at === "currentPassword" ? fieldError.message : undefined} />
            </div>
          </FormGroup>

          <div className="flex justify-center gap-[6px]">
            <Button variant="off" onClick={handleClose}>
              닫기
            </Button>
            <Button onClick={() => setStep("content")} disabled={!form.currentPassword}>
              확인
            </Button>
          </div>
        </>
      )}

      {step === "content" && (
        <>
          {loadError ? (
            <>
              <FailedBand message={loadError} />
              <div className="flex justify-center gap-[6px]">
                <Button variant="off" onClick={handleClose}>
                  닫기
                </Button>
              </div>
            </>
          ) : !eligibility ? (
            <p className="py-[36px] text-center text-[14px] text-erp-muted">불러오는 중입니다.</p>
          ) : (
            <>
              <div className="flex flex-col gap-[8px]">
                <p className="font-semibold text-[#e93737]">탈퇴 전 꼭 확인해 주세요</p>
                <div className="flex flex-col gap-[12px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[16px] py-[14px] text-[14px] leading-[1.6]">
                  {withdrawWarningText(eligibility).map((block, i) => (
                    <WarningBlock key={i} block={block} />
                  ))}
                </div>
              </div>

              <FormGroup title="탈퇴 조건">
                <ConditionRow label="부가서비스 구독 해지" checked={null} note="1차 범위 밖 — 1차에서는 확인하지 않습니다." />
                <ConditionRow label="미정산 금액 없음" checked={null} note="1차 범위 밖 — 1차에서는 확인하지 않습니다." />
                <ConditionRow
                  label="진행 중인 근로계약 없음"
                  checked={!eligibility.hasInProgressContract}
                  note={eligibility.hasInProgressContract ? "진행 중인 근로계약이 있습니다." : "진행 중인 근로계약이 없습니다."}
                />
              </FormGroup>

              <FormGroup title="탈퇴 사유">
                <div className="flex flex-col gap-[8px]">
                  <Field label="탈퇴 사유" required>
                    <Select
                      value={form.reasonCode}
                      onChange={(e) => setForm((f) => ({ ...f, reasonCode: e.target.value }))}
                      aria-required
                    >
                      <option value="">탈퇴 사유를 선택하세요</option>
                      {WITHDRAW_REASONS.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {form.reasonCode === "WD_INPUT" && (
                  <div className="flex flex-col gap-[8px]">
                    <Field label="상세 사유" required>
                      <Textarea
                        maxLength={500}
                        value={form.reasonDetail}
                        onChange={(e) => setForm((f) => ({ ...f, reasonDetail: e.target.value }))}
                        aria-invalid={fieldError?.at === "reasonDetail" ? true : undefined}
                        aria-describedby={fieldError?.at === "reasonDetail" ? reasonDetailMessageId : undefined}
                        aria-required
                      />
                    </Field>
                    <FieldMessage id={reasonDetailMessageId} message={fieldError?.at === "reasonDetail" ? fieldError.message : undefined} />
                  </div>
                )}
              </FormGroup>

              {failure && <FailedBand message={failure} />}

              <div className="flex justify-center gap-[6px]">
                <Button variant="off" onClick={handleClose}>
                  닫기
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmOpen(true)}
                  disabled={eligibility.hasInProgressContract || !form.reasonCode || (form.reasonCode === "WD_INPUT" && !form.reasonDetail.trim())}
                >
                  회원 탈퇴
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {step === "done" && (
        <>
          <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center">
            <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="mb-[12px]">
              <circle cx="28" cy="28" r="28" className="fill-erp-on-bg" />
              <path d="M17 28.5l7.5 7.5L39.5 21" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-erp-on" />
            </svg>
            <p id={doneHeadingId} tabIndex={-1} className="text-[16px] font-semibold text-erp-ink outline-none!">
              회원 탈퇴가 완료되었습니다.
            </p>
            <p className="text-[14px] text-erp-muted">등록한 이메일로 탈퇴 완료 안내를 보냈습니다.</p>
          </div>
          {/* admin-header.tsx 의 UserPop 로그아웃 항목과 같은 호출 방식 — <form action={}> 으로 서버 액션을 부른다. */}
          <form action={logout} className="flex justify-center gap-[6px]">
            <Button type="submit">확인</Button>
          </form>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="회원 탈퇴"
        confirmLabel="회원 탈퇴"
        confirmVariant="danger"
        busy={saving}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (!saving) setConfirmOpen(false);
        }}
      >
        <p>정말로 탈퇴하시겠습니까? 회원 탈퇴 시 웨일ERP를 더 이상 이용할 수 없습니다.</p>
        <p className="text-erp-muted">필요한 순간에 다시 웨일ERP와 함께해 주세요.</p>
      </ConfirmDialog>
    </SlidePanel>
  );
}
