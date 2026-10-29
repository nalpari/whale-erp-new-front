"use client";

import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState, useTransition } from "react";
import { INDUSTRY_OTHER, LEAD_UNKNOWN, leadInputProblem, type LeadResult } from "@/lib/leads";
import { CHECKBOX, INPUT, INPUT_BOX, LABEL, SUBMIT } from "../guest-form";
import { GuestButton } from "../guest-ui";
import { HOVER } from "../theme";

export type LeadOption = { value: string; label: string };
/** 업종(공통코드 INDUSTRY) · 관심 서비스(enum LeadInterest) · 도입 예정 시기(공통코드 PLAN_PERIOD). 실제 화면은 api 에서, 샘플은 예시로 받는다. */
export type LeadOptions = { industries: LeadOption[]; interests: LeadOption[]; periods: LeadOption[] };

function Required() {
  return (
    <>
      <span aria-hidden className="text-[#e93737]">
        {" *"}
      </span>
      <span className="sr-only">(필수)</span>
    </>
  );
}

function Field({ label, required = false, help, children }: { label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>
        {label}
        {required && <Required />}
      </span>
      {children}
      {help && <span className="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">{help}</span>}
    </label>
  );
}

// 입력칸과 같은 껍데기에 오른쪽 화살표. 처음엔 숨긴 빈 선택지가 「선택해 주세요」를 보인다.
// 펼친 목록 생김새는 globals.css 의 select.guest-select 가 맡고, 열리면 화살표가 뒤집힌다.
// select 는 칸의 여백까지 덮어 56px 칸 어디를 눌러도 열린다. 화살표는 그 위에 겹치고 클릭을 통과시킨다.
function Select({ name, options, required = false, onChange }: { name: string; options: LeadOption[]; required?: boolean; onChange?: (value: string) => void }) {
  return (
    <span className={`${INPUT_BOX} relative [&:has(select:open)_svg]:rotate-180`}>
      <select name={name} required={required} defaultValue="" onChange={(e) => onChange?.(e.target.value)} className={`guest-select ${INPUT} -mx-[16px] cursor-pointer appearance-none self-stretch pr-[42px] pl-[16px] has-[option[value='']:checked]:text-[#999]`}>
        <option value="" hidden>
          선택해 주세요
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-guest-ink">
            {o.label}
          </option>
        ))}
      </select>
      <svg aria-hidden className="pointer-events-none absolute right-[16px] size-[16px] text-[#767676] transition-[rotate] duration-150 motion-reduce:transition-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m4 6 4 4 4-4" />
      </svg>
    </span>
  );
}

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-[24px] border-t border-[#ebebeb] pt-[32px]">
      <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">
        {title}
        {note && <span className="ml-[10px] text-[15px] font-normal text-[#767676]">{note}</span>}
      </h2>
      {children}
    </section>
  );
}

// 하나 이상 고르는 체크 상자 묶음. 하나도 안 골랐으면 첫 상자에 검사 오류를 걸어 브라우저가 제출을 막게 한다.
function CheckGroup({ label, name, options, message }: { label: string; name: string; options: LeadOption[]; message: string }) {
  const [checked, setChecked] = useState<string[]>([]);
  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstRef.current?.setCustomValidity(checked.length ? "" : message);
  }, [checked, message]);

  return (
    <fieldset className="flex flex-col gap-[10px]">
      <legend className={`${LABEL} mb-[10px]`}>
        {label}
        <Required />
      </legend>
      <div className="flex min-h-[56px] flex-wrap items-center gap-x-[32px] gap-y-[12px] text-[16px] leading-[1.5]">
        {options.map((o, i) => (
          <label key={o.value} className="flex items-center gap-[8px] text-guest-ink">
            <input
              ref={i === 0 ? firstRef : undefined}
              type="checkbox"
              name={name}
              value={o.value}
              checked={checked.includes(o.value)}
              onChange={(e) => setChecked((prev) => (e.target.checked ? [...prev, o.value] : prev.filter((v) => v !== o.value)))}
              className={CHECKBOX}
            />
            {o.label}
          </label>
        ))}
      </div>
      <span className="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">하나 이상 고릅니다. 여러 개 골라도 됩니다.</span>
    </fieldset>
  );
}

// 접수 확인 · 완료 창. 네이티브 <dialog> 라 Esc 닫기와 바깥 포커스 막기는 브라우저가 맡는다(signup/terms-dialog.tsx 와 같은 틀).
function LeadDialog({ open, title, onClose, actions, children }: { open: boolean; title: string; onClose: () => void; actions: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog ref={ref} aria-labelledby={titleId} onClose={onClose} className="m-auto w-[520px] max-w-[calc(100vw-32px)] rounded-[6px] bg-white p-[32px] text-guest-ink backdrop:bg-black/40">
      <h2 id={titleId} className="text-[22px] leading-[1.4] font-bold">
        {title}
      </h2>
      <div className="mt-[12px] flex flex-col gap-[8px] text-[16px] leading-[1.6] text-guest-sub">{children}</div>
      <div className="mt-[24px] flex justify-end gap-[8px]">{actions}</div>
    </dialog>
  );
}

// 도입문의 화면 머리 + 본문(폼, 또는 선택지를 못 받았을 때의 안내). 실제 화면((site)/leads)과 샘플이 함께 쓴다.
export function LeadScreen({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto flex w-[800px] flex-col gap-[40px] pt-[80px] text-guest-ink">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[28px] leading-[1.2] font-bold">도입문의</h1>
        <p className="text-[16px] leading-[1.5]">가입하지 않아도 남기실 수 있습니다. 담당자가 확인한 뒤 알려주신 전화번호나 이메일로 회신합니다.</p>
      </div>
      {children}
    </section>
  );
}

// leadInputProblem 이 검사 오류를 거는 칸.
const CHECKED_FIELDS = new Set(["contactName", "phone", "email", "industryDetail", "body"]);

// 샘플은 접수 요청을 보내지 않고 늘 성공한다.
const sampleSubmit = async (): Promise<LeadResult> => ({ ok: true });

/**
 * 도입문의(#297 · #298). 받는 항목은 okf/home.md 도입문의(이름·업종·전화번호·이메일·관심 서비스·도입 예정 시기·문의 내용)를 따른다.
 * [문의 접수하기] → 브라우저 검사 → 확인 창(접수 대상 · 연락 일정) → 접수. 성공하면 완료 창을 띄우고 폼을 비운다.
 * 실패하면 적은 내용을 그대로 두고 오류와 다시 하는 방법을 버튼 위에 보인다 — 서버 액션을 form action 이 아니라 직접 불러 폼이 초기화되지 않는다.
 * 브라우저 검사가 놓치는 빈칸만 적은 칸 · 전화번호 · 이메일 형식(leadInputProblem)은 확인 창을 띄우기 전에 그 칸에 검사 오류로 건다.
 */
export function LeadForm({ options, submit = sampleSubmit }: { options: LeadOptions; submit?: (form: FormData) => Promise<LeadResult> }) {
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  // 성공하면 key 를 바꿔 폼을 새로 그린다 — 체크 상자 상태 · 열린 직접 입력칸까지 처음으로 돌아간다.
  const [formKey, setFormKey] = useState(0);
  const [otherIndustry, setOtherIndustry] = useState(false);
  const [confirming, setConfirming] = useState<{ phone: string; email: string } | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // [접수하기]를 빠르게 두 번 눌러도 한 번만 보낸다 — pending 은 다음 렌더에야 바뀌어 두 번째 클릭을 막지 못한다.
  const sendingRef = useRef(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const problem = leadInputProblem(form);
    if (problem) {
      const field = formEl.elements.namedItem(problem.name) as HTMLInputElement | HTMLTextAreaElement | null;
      field?.setCustomValidity(problem.message);
      field?.reportValidity();
      return;
    }
    setConfirming({ phone: String(form.get("phone")).trim(), email: String(form.get("email")).trim() });
  }

  // leadInputProblem 이 건 검사 오류는 그 칸을 고치기 시작하면 푼다 — 남아 있으면 브라우저가 다음 제출을 막는다.
  function handleInput(e: FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (CHECKED_FIELDS.has(target.name)) target.setCustomValidity("");
  }

  // 완료 창을 닫으면 새로 그린 폼의 접수 버튼으로 커서를 돌린다 — 성공 때 폼을 새로 그려 앞서 누른 버튼이 없어졌다.
  function handleDoneClose() {
    setDone(false);
    formRef.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
  }

  function handleConfirm() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setConfirming(null);
    if (!formRef.current) {
      sendingRef.current = false;
      return;
    }
    const data = new FormData(formRef.current);
    setError(null);
    startTransition(async () => {
      let result: LeadResult;
      // 서버 액션 전송 자체가 실패(연결 끊김 · 배포로 action 이 바뀜)해도 폼을 지키고 안내한다.
      try {
        result = await submit(data);
      } catch (err) {
        // 요청이 api 까지 갔는지 알 수 없다 — 이미 접수됐을 수 있다고 안내한다.
        console.error("도입문의 접수 요청의 응답을 받지 못했습니다", err);
        result = { ok: false, error: LEAD_UNKNOWN };
      }
      sendingRef.current = false;
      if (result.ok) {
        setFormKey((k) => k + 1);
        setOtherIndustry(false);
        setDone(true);
        return;
      }
      setError(result.error);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }));
    });
  }

  return (
    <>
      <form key={formKey} ref={formRef} className="flex flex-col gap-[40px]" onSubmit={handleSubmit} onInput={handleInput}>
        <Section
          title="문의자 정보"
          note={
            <>
              (<span className="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)
            </>
          }
        >
          <div className="grid grid-cols-2 gap-[16px]">
            <Field label="이름" required>
              <span className={INPUT_BOX}>
                <input name="contactName" required maxLength={50} autoComplete="name" placeholder="홍길동" className={INPUT} />
              </span>
            </Field>
            <Field label="전화번호" required help="점포 번호를 적어도 됩니다. 중복 접수는 이 번호와 이메일로 가립니다.">
              <span className={INPUT_BOX}>
                <input name="phone" type="tel" required inputMode="numeric" autoComplete="tel" placeholder="02-1234-5678" className={INPUT} />
              </span>
            </Field>
            <Field label="업종" required>
              <Select name="industryCode" options={options.industries} required onChange={(v) => setOtherIndustry(v === INDUSTRY_OTHER)} />
            </Field>
            <Field label="이메일" required help="접수 확인 메일을 이 주소로 보냅니다.">
              <span className={INPUT_BOX}>
                <input name="email" type="email" required autoComplete="email" placeholder="example@company.com" className={INPUT} />
              </span>
            </Field>
            {/* 업종이 기타일 때만 업종 아래에 연다(LEAD-1). 다른 업종으로 바꾸면 칸이 사라지며 적은 값도 버린다. */}
            {otherIndustry && (
              <div className="col-start-1">
                <Field label="업종 직접 입력" required>
                  <span className={INPUT_BOX}>
                    <input name="industryDetail" required autoFocus maxLength={50} placeholder="업종을 직접 입력해 주세요." className={INPUT} />
                  </span>
                </Field>
              </div>
            )}
          </div>
        </Section>
        <Section title="도입 문의 내용">
          <CheckGroup label="관심 서비스" name="interests" options={options.interests} message="관심 서비스를 하나 이상 골라 주세요." />
          <div className="grid grid-cols-2 gap-[16px]">
            <Field label="도입 예정 시기">
              <Select name="planPeriodCode" options={options.periods} />
            </Field>
          </div>
          <Field label="어떤 점이 궁금하신가요" required>
            <textarea
              name="body"
              rows={6}
              required
              maxLength={2000}
              placeholder="지금 쓰고 계신 방식과 불편한 점을 적어 주시면 그에 맞춰 안내해 드립니다. (2,000자까지)"
              className={`min-h-[180px] w-full resize-none rounded-[6px] border border-[#ebebeb] bg-white p-[16px] text-[15px] leading-[1.6] text-guest-ink outline-none! placeholder:text-[#999] focus:border-guest-navy ${HOVER}`}
            />
          </Field>
        </Section>
        <Section title="개인정보 수집·이용 동의">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-[24px] gap-y-[8px] rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.6] text-guest-navy">
            <dt className="font-semibold">수집 항목</dt>
            <dd>이름 · 업종 · 전화번호 · 이메일 · 관심 서비스 · 도입 예정 시기 · 문의 내용</dd>
            <dt className="font-semibold">이용 목적</dt>
            <dd>도입 문의 확인과 상담 회신</dd>
            <dt className="font-semibold">보유 기간</dt>
            <dd>상담이 끝난 날로부터 1년간 보관한 뒤 파기</dd>
          </dl>
          <div className="flex flex-col gap-[16px] text-[16px] leading-[1.5]">
            <label className="flex items-center gap-[8px] text-guest-ink">
              <input type="checkbox" name="privacyAgreed" required className={CHECKBOX} />
              개인정보 수집·이용에 동의합니다 (필수)
            </label>
            <label className="flex items-center gap-[8px] text-guest-ink">
              <input type="checkbox" name="marketingAgreed" className={CHECKBOX} />
              마케팅 정보 수신에 동의합니다 (선택)
            </label>
            <p className="text-[15px] leading-[1.5] text-[#767676]">개인정보 수집·이용에 동의하지 않으시면 문의를 접수할 수 없습니다.</p>
          </div>
        </Section>
        <div className="flex flex-col gap-[16px]">
          {error && (
            <p ref={errorRef} role="alert" className="text-center text-[15px] leading-[1.5] text-[#e93737]">
              {error}
            </p>
          )}
          <button type="submit" disabled={pending} className={`${SUBMIT} disabled:pointer-events-none disabled:opacity-60`}>
            {pending ? "접수하는 중…" : "문의 접수하기"}
          </button>
        </div>
      </form>
      <LeadDialog
        open={confirming !== null}
        title="도입문의를 접수할까요?"
        onClose={() => setConfirming(null)}
        actions={
          <>
            <GuestButton tone="outline" onClick={() => setConfirming(null)}>
              취소
            </GuestButton>
            <GuestButton tone="navy" onClick={handleConfirm}>
              접수하기
            </GuestButton>
          </>
        }
      >
        <p>웨일ERP 도입을 알아보시는 분의 문의를 받습니다. 이미 쓰고 계신 계정의 문의는 로그인한 뒤 고객지원의 문의하기로 남겨 주세요.</p>
        <p>
          접수하면 담당자가 영업일 기준 1~2일 안에 <strong className="font-semibold text-guest-ink">{confirming?.phone}</strong> 또는{" "}
          <strong className="font-semibold text-guest-ink">{confirming?.email}</strong>(으)로 연락드립니다.
        </p>
      </LeadDialog>
      <LeadDialog
        open={done}
        title="문의가 접수되었습니다."
        onClose={handleDoneClose}
        actions={
          <GuestButton tone="navy" onClick={handleDoneClose}>
            확인
          </GuestButton>
        }
      >
        <p>담당자가 영업일 기준 1~2일 안에 알려주신 전화번호나 이메일로 연락드립니다.</p>
      </LeadDialog>
    </>
  );
}
