"use client";

import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/format";
import { INDUSTRY_OTHER, LEAD_UNKNOWN, leadInputProblems, type LeadProblems, type LeadResult } from "@/lib/leads";
import { CHECKBOX, INPUT, INPUT_BOX, LABEL, SUBMIT } from "../guest-form";
import { SAMPLE_ROUTES } from "../guest-routes";
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

// 칸 아래 한 줄 — 도움말(회색)과 오류(빨강)가 같은 자리 · 같은 크기다. 오류가 있으면 도움말 대신 오류를 보인다
// (회원가입 RequiredField 와 같은 14px #e93737, 2026-11-06 사용자 지정).
function Below({ help, error, errorId }: { help?: string; error?: string; errorId?: string }) {
  if (error)
    return (
      <span id={errorId} className="-mt-[2px] text-[14px] leading-[1.5] text-[#e93737]">
        {error}
      </span>
    );
  return help ? <span className="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">{help}</span> : null;
}

// 도움말 · 오류는 label 밖에 둔다 — label 안이면 칸 이름에 섞여 읽히고, aria-describedby 로 한 번 더 읽힌다(리뷰 반영).
// 칸마다 role="alert" 을 두지 않는다 — 빈 폼이면 알림이 한꺼번에 읽힌다. aria-invalid · aria-describedby · 첫 칸 커서 이동으로 알린다.
function Field({ label, required = false, help, error, errorId, children }: { label: string; required?: boolean; help?: string; error?: string; errorId?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[10px]">
      <label className="flex flex-col gap-[10px]">
        <span className={LABEL}>
          {label}
          {required && <Required />}
        </span>
        {children}
      </label>
      <Below help={help} error={error} errorId={errorId} />
    </div>
  );
}

// 입력칸과 같은 껍데기에 오른쪽 화살표. 처음엔 숨긴 빈 선택지가 「선택해 주세요」를 보인다.
// 펼친 목록 생김새는 globals.css 의 select.guest-select 가 맡고, 열리면 화살표가 뒤집힌다.
// select 는 칸의 여백까지 덮어 56px 칸 어디를 눌러도 열린다. 화살표는 그 위에 겹치고 클릭을 통과시킨다.
function Select({ name, options, required = false, invalid = false, describedBy, onChange }: { name: string; options: LeadOption[]; required?: boolean; invalid?: boolean; describedBy?: string; onChange?: (value: string) => void }) {
  return (
    <span className={`${INPUT_BOX} relative [&:has(select:open)_svg]:rotate-180`}>
      <select name={name} required={required} aria-invalid={invalid || undefined} aria-describedby={invalid ? describedBy : undefined} defaultValue="" onChange={(e) => onChange?.(e.target.value)} className={`guest-select ${INPUT} -mx-[16px] cursor-pointer appearance-none self-stretch pr-[42px] pl-[16px] has-[option[value='']:checked]:text-[#999]`}>
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

// 하나 이상 고르는 체크 상자 묶음. 하나도 안 골랐는지는 [문의 접수하기] 때 leadInputProblems 가 보고, 오류는 도움말 자리에 보인다.
function CheckGroup({ label, name, options, help, error, errorId }: { label: string; name: string; options: LeadOption[]; help: string; error?: string; errorId?: string }) {
  return (
    <fieldset aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className="flex flex-col gap-[10px]">
      <legend className={`${LABEL} mb-[10px]`}>
        {label}
        <Required />
      </legend>
      <div className="flex min-h-[56px] flex-wrap items-center gap-x-[32px] gap-y-[12px] text-[16px] leading-[1.5]">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-[8px] text-guest-ink">
            <input type="checkbox" name={name} value={o.value} className={CHECKBOX} />
            {o.label}
          </label>
        ))}
      </div>
      <Below help={help} error={error} errorId={errorId} />
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
        <p className="text-[16px] leading-[1.5]">웨일ERP 도입을 고민하고 계신가요? 문의를 남겨주시면 담당자가 확인 후 안내해 드리겠습니다.</p>
      </div>
      {children}
    </section>
  );
}

// 확인 창의 연락처 — 숫자만 적어도 하이픈을 넣어 보인다(010-7262-0000). 대표번호 8자리는 1588-1234, 그 밖 모양은 적은 그대로.
function phoneLabel(raw: string) {
  const digits = raw.replace(/[\s-]/g, "");
  if (/^1[568][0-9]{6}$/.test(digits)) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return formatPhone(digits);
}

// 업종을 바꾸면 업종 직접 입력칸 오류도 함께 내린다 — 그 칸이 닫히거나 새로 열린다.
const CLEARS: Record<string, (keyof LeadProblems)[]> = { industryCode: ["industryCode", "industryDetail"] };

// 샘플은 접수 요청을 보내지 않고 늘 성공한다.
const sampleSubmit = async (): Promise<LeadResult> => ({ ok: true });

/**
 * 도입문의(#297 · #298). 받는 항목은 okf/home.md 도입문의(이름·업종·전화번호·이메일·관심 서비스·도입 예정 시기·문의 내용)를 따른다.
 * [문의 접수하기] → 모든 칸 검사(leadInputProblems) → 확인 창(접수 대상 · 연락 일정) → 접수. 성공하면 완료 창을 띄우고 폼을 비우며, 완료 창을 닫으면 메인 화면으로 간다.
 * 실패하면 적은 내용을 그대로 두고 오류와 다시 하는 방법을 버튼 위에 보인다 — 서버 액션을 form action 이 아니라 직접 불러 폼이 초기화되지 않는다.
 * 검사에 걸린 칸은 모두 그 칸 아래에 빨간 문구로 보이고 첫 칸으로 커서를 옮긴다. 문구는 그 칸을 고치면 내린다(공통 정책 PL-SPGSWC, 2026-11-06 사용자 지정 —
 * 전엔 브라우저 검사 말풍선으로 첫 칸 하나만 보였다).
 */
export function LeadForm({ options, submit = sampleSubmit, homeHref = SAMPLE_ROUTES.home }: { options: LeadOptions; submit?: (form: FormData) => Promise<LeadResult>; homeHref?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  // 성공하면 key 를 바꿔 폼을 새로 그린다 — 체크 상자 상태 · 열린 직접 입력칸까지 처음으로 돌아간다.
  const [formKey, setFormKey] = useState(0);
  const [otherIndustry, setOtherIndustry] = useState(false);
  const [confirming, setConfirming] = useState<{ phone: string; email: string } | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<LeadProblems>({});
  const errorIdBase = useId();
  const idOf = (name: keyof LeadProblems) => `${errorIdBase}-${name}`;
  const [pending, startTransition] = useTransition();
  // [접수하기]를 빠르게 두 번 눌러도 한 번만 보낸다 — pending 은 다음 렌더에야 바뀌어 두 번째 클릭을 막지 못한다.
  const sendingRef = useRef(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const found = leadInputProblems(form);
    setProblems(found);
    const first = Object.keys(found)[0];
    if (first) {
      // 같은 이름이 여럿인 체크 상자(관심 서비스)는 첫 상자로 간다.
      const field = formEl.elements.namedItem(first);
      const target = (field instanceof RadioNodeList ? field[0] : field) as HTMLElement | null;
      target?.focus();
      return;
    }
    setConfirming({ phone: String(form.get("phone")).trim(), email: String(form.get("email")).trim() });
  }

  // 칸을 고치면 그 칸의 오류 문구를 내린다 — 글자는 input, 고르는 칸 · 체크 상자는 change 로 올라온다.
  function handleChange(e: FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    const keys = CLEARS[name] ?? [name as keyof LeadProblems];
    setProblems((prev) => (keys.some((k) => k in prev) ? Object.fromEntries(Object.entries(prev).filter(([k]) => !keys.includes(k as keyof LeadProblems))) : prev));
  }

  // 완료 창이 닫히면([확인] · Esc 모두 dialog close 이벤트를 거친다) 메인 화면으로 간다(2026-11-06 사용자 지정 — 전엔 비운 폼에 머물렀다).
  // [확인]은 창만 닫는다 — 여기서도 이동하면 close 이벤트와 겹쳐 두 번 이동한다(리뷰 반영).
  function handleDoneClose() {
    setDone(false);
    router.push(homeHref);
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
        setProblems({});
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
      <form key={formKey} ref={formRef} noValidate className="flex flex-col gap-[40px]" onSubmit={handleSubmit} onInput={handleChange} onChange={handleChange}>
        <Section
          title="문의자 정보"
          note={
            <>
              (<span className="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)
            </>
          }
        >
          <div className="grid grid-cols-2 gap-[16px]">
            <Field label="이름" required error={problems.contactName} errorId={idOf("contactName")}>
              <span className={INPUT_BOX}>
                <input name="contactName" required aria-invalid={problems.contactName ? true : undefined} aria-describedby={problems.contactName ? idOf("contactName") : undefined} maxLength={50} autoComplete="name" placeholder="홍길동" className={INPUT} />
              </span>
            </Field>
            <Field label="전화번호" required help="연락받으실 수 있는 전화번호를 입력해 주세요." error={problems.phone} errorId={idOf("phone")}>
              <span className={INPUT_BOX}>
                <input name="phone" type="tel" required aria-invalid={problems.phone ? true : undefined} aria-describedby={problems.phone ? idOf("phone") : undefined} inputMode="numeric" autoComplete="tel" placeholder="02-1234-5678" className={INPUT} />
              </span>
            </Field>
            <Field label="업종" required error={problems.industryCode} errorId={idOf("industryCode")}>
              <Select name="industryCode" options={options.industries} required invalid={!!problems.industryCode} describedBy={idOf("industryCode")} onChange={(v) => setOtherIndustry(v === INDUSTRY_OTHER)} />
            </Field>
            <Field label="이메일" required help="문의접수 확인 및 답변이 발송됩니다." error={problems.email} errorId={idOf("email")}>
              <span className={INPUT_BOX}>
                <input name="email" type="email" required aria-invalid={problems.email ? true : undefined} aria-describedby={problems.email ? idOf("email") : undefined} autoComplete="email" placeholder="example@company.com" className={INPUT} />
              </span>
            </Field>
            {/* 업종이 기타일 때만 업종 아래에 연다(LEAD-1). 다른 업종으로 바꾸면 칸이 사라지며 적은 값도 버린다. */}
            {otherIndustry && (
              <div className="col-start-1">
                <Field label="업종 직접 입력" required error={problems.industryDetail} errorId={idOf("industryDetail")}>
                  <span className={INPUT_BOX}>
                    <input name="industryDetail" required aria-invalid={problems.industryDetail ? true : undefined} aria-describedby={problems.industryDetail ? idOf("industryDetail") : undefined} autoFocus maxLength={50} placeholder="업종을 직접 입력해 주세요." className={INPUT} />
                  </span>
                </Field>
              </div>
            )}
          </div>
        </Section>
        <Section title="도입 문의 내용">
          <CheckGroup label="관심 서비스" name="interests" options={options.interests} help="관심 있는 서비스를 모두 선택해 주세요." error={problems.interests} errorId={idOf("interests")} />
          <div className="grid grid-cols-2 gap-[16px]">
            <Field label="도입 예정 시기">
              <Select name="planPeriodCode" options={options.periods} />
            </Field>
          </div>
          <Field label="어떤 점이 궁금하신가요" required error={problems.body} errorId={idOf("body")}>
            <textarea
              name="body"
              aria-invalid={problems.body ? true : undefined}
              aria-describedby={problems.body ? idOf("body") : undefined}
              rows={6}
              required
              maxLength={2000}
              placeholder="도입을 고민하시는 이유나 궁금한 점을 자유롭게 작성해 주세요. (2,000자까지)"
              className={`min-h-[180px] w-full resize-none rounded-[6px] border border-[#ebebeb] bg-white p-[16px] text-[15px] leading-[1.6] text-guest-ink outline-none! placeholder:text-[#999] focus:border-guest-navy ${HOVER}`}
            />
          </Field>
        </Section>
        <Section title="개인정보 수집 및 이용 동의">
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
              <input type="checkbox" name="privacyAgreed" required aria-invalid={problems.privacyAgreed ? true : undefined} aria-describedby={problems.privacyAgreed ? idOf("privacyAgreed") : undefined} className={CHECKBOX} />
              개인정보 수집 및 이용에 동의합니다. (필수)
            </label>
            {/* 동의 오류는 동의 줄 바로 아래 — 다른 칸 오류와 같은 14px 빨강(2026-11-06 사용자 지정) */}
            {problems.privacyAgreed && (
              <span id={idOf("privacyAgreed")} className="-mt-[8px] text-[14px] leading-[1.5] text-[#e93737]">
                {problems.privacyAgreed}
              </span>
            )}
            <label className="flex items-center gap-[8px] text-guest-ink">
              <input type="checkbox" name="marketingAgreed" className={CHECKBOX} />
              마케팅 정보 수신에 동의합니다. (선택)
            </label>
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
        title="도입 문의를 접수하시겠습니까?"
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
        {/* 안내 한 문장 → 연락처 · 이메일 상자 → 확인 요청(2026-11-06 사용자 지정 — 전엔 계정 문의 안내 + 문장 안에 연락처 · 이메일) */}
        <p>문의 접수 후 담당자가 영업일 기준 1~2일 이내에 입력하신 연락처 또는 이메일로 연락드리겠습니다.</p>
        <dl className="mt-[8px] grid grid-cols-[max-content_1fr] gap-x-[24px] gap-y-[8px] rounded-[6px] bg-guest-card px-[24px] py-[16px]">
          <dt>연락처</dt>
          <dd className="font-semibold break-all text-guest-ink">{phoneLabel(confirming?.phone ?? "")}</dd>
          <dt>이메일</dt>
          <dd className="font-semibold break-all text-guest-ink">{confirming?.email}</dd>
        </dl>
        <p className="mt-[8px]">입력하신 연락처와 이메일을 확인해 주세요.</p>
      </LeadDialog>
      <LeadDialog
        open={done}
        title="도입 문의가 접수되었습니다."
        onClose={handleDoneClose}
        actions={
          <GuestButton tone="navy" onClick={() => setDone(false)}>
            확인
          </GuestButton>
        }
      >
        <p>담당자가 문의 내용을 확인한 후 영업일 기준 1~2일 이내에 입력하신 연락처 또는 이메일로 연락드리겠습니다.</p>
      </LeadDialog>
    </>
  );
}
