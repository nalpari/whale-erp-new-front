"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type FormEvent, type ReactNode, type Ref, useRef, useState } from "react";
import { CHECKBOX, FIELD_BUTTON, INPUT, INPUT_BOX, LABEL, SUBMIT } from "../guest-form";
import { HOVER } from "../theme";

const ICON_BUTTON = "flex size-[16px] items-center justify-center";

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

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>
        {label}
        {required && <Required />}
      </span>
      {children}
    </label>
  );
}

function PasswordField({ label, name, placeholder }: { label: string; name: string; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} required>
      <span className={INPUT_BOX}>
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={8}
          maxLength={20}
          autoComplete="new-password"
          placeholder={placeholder}
          className={INPUT}
        />
        <button
          type="button"
          aria-label={show ? `${label} 숨기기` : `${label} 보기`}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
          className={ICON_BUTTON}
        >
          <Image src={show ? "/guest/login/eye-off.svg" : "/guest/login/eye-on.svg"} alt="" width={16} height={16} />
        </button>
      </span>
    </Field>
  );
}

// ponytail: 중복 확인 API 가 아직 없어 샘플 목록으로 판정한다. 1팀 API 가 생기면 checkAvailable 만 요청으로 바꾼다.
const TAKEN = {
  loginId: ["admin", "whaleadmin", "hangang01"],
  email: ["help@interplug.co.kr", "hayoon@hangang.co.kr"],
};
type CheckKind = keyof typeof TAKEN;
const TAKEN_MESSAGE: Record<CheckKind, string> = { loginId: "이미 사용 중인 아이디입니다.", email: "이미 가입된 이메일입니다." };
function checkAvailable(kind: CheckKind, value: string) {
  return !TAKEN[kind].includes(value.trim().toLowerCase());
}

// 아이디·이메일 사용 가능 여부. 칸을 벗어날 때 형식이 맞으면 확인하고, 다시 고치면 표시를 지운다.
// 이미 쓰는 값이면 setCustomValidity 로 막아 회원가입을 눌러도 브라우저가 그 칸으로 돌려보낸다.
function CheckedInput({ kind, ...props }: { kind: CheckKind } & ComponentProps<"input">) {
  const [status, setStatus] = useState<"idle" | "ok" | "taken">("idle");
  return (
    <>
      <span className={INPUT_BOX}>
        <input
          {...props}
          name={kind}
          aria-describedby={`${kind}-status`}
          onChange={(e) => {
            e.currentTarget.setCustomValidity("");
            setStatus("idle");
          }}
          onBlur={(e) => {
            const input = e.currentTarget;
            if (!input.value || !input.checkValidity()) return;
            const ok = checkAvailable(kind, input.value);
            input.setCustomValidity(ok ? "" : TAKEN_MESSAGE[kind]);
            setStatus(ok ? "ok" : "taken");
          }}
          className={INPUT}
        />
      </span>
      <span id={`${kind}-status`} aria-live="polite" className="-mt-[2px] flex items-center gap-[4px] text-[14px] leading-[1.5] empty:hidden">
        {status === "ok" && (
          <span className="flex items-center gap-[4px] text-[#5e8ce9]">
            <span aria-hidden className="size-[12px] bg-current mask-[url(/icons/check.svg)] mask-contain mask-center mask-no-repeat" />
            사용 가능합니다.
          </span>
        )}
        {status === "taken" && <span className="text-[#e93737]">{TAKEN_MESSAGE[kind]}</span>}
      </span>
    </>
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

// 약관 내용 보기. 네이티브 dialog 라 Esc 닫기와 바깥 포커스 막기는 브라우저가 맡는다.
function TermsDialog({ title, ref, children }: { title: string; ref: Ref<HTMLDialogElement>; children: ReactNode }) {
  return (
    <dialog ref={ref} aria-label={title} className="m-auto w-[860px] max-w-[calc(100vw-32px)] rounded-[6px] bg-white p-[32px] text-guest-ink backdrop:bg-black/40">
      <h2 className="text-[22px] leading-[1.4] font-bold">{title}</h2>
      <p className="mt-[4px] text-[14px] text-[#767676]">v0.7 · 시행일 미정 (초안)</p>
      <div className="mt-[20px] flex max-h-[60dvh] flex-col gap-[16px] overflow-y-auto pr-[10px] text-[15px] leading-[1.6]">{children}</div>
      {/* 회원가입 form 안에 있어 method="dialog" form 을 겹칠 수 없다. 단추가 직접 닫는다. */}
      <div className="mt-[24px] flex justify-end">
        <button type="button" onClick={(e) => e.currentTarget.closest("dialog")?.close()} className={`w-[180px] ${SUBMIT}`}>
          확인
        </button>
      </div>
    </dialog>
  );
}

const PHONE_PARTS = ["앞자리", "가운데자리", "끝자리"];
const AGREEMENTS = [
  { key: "service", label: "이용약관 동의", title: "웨일ERP 서비스 이용약관" },
  { key: "privacy", label: "개인정보 수집·이용 동의", title: "[필수] 개인정보 수집·이용 동의" },
] as const;
type AgreementKey = (typeof AGREEMENTS)[number]["key"];

// 디자인 샘플이라 가입 요청, 아이디·이메일 중복 확인, 국세청 사업자 진위확인은 보내지 않는다.
// 입력 규칙은 브라우저 기본 검사(required·pattern·minLength)로 막고, 비밀번호 확인과 필수 약관만 따로 본다.
export function SignUpForm({ terms }: { terms: Record<AgreementKey, ReactNode> }) {
  const [agreed, setAgreed] = useState({ service: false, privacy: false });
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const dialogs = useRef<Partial<Record<AgreementKey, HTMLDialogElement | null>>>({});
  const businessRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const allAgreed = agreed.service && agreed.privacy;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("password") !== form.get("passwordConfirm")) return setError("비밀번호가 서로 다릅니다.");
    if (!allAgreed) return setError("이용약관과 개인정보 수집·이용에 모두 동의해 주세요.");
    setError("");
    // ponytail: 가입 API 가 없어 완료 화면에 보일 값을 주소로 넘긴다. API 가 생기면 서버가 가입 결과로 완료 화면을 그린다.
    const shown = new URLSearchParams({ companyName: String(form.get("companyName")), loginId: String(form.get("loginId")), email: String(form.get("email")) });
    router.push(`/design/guest/sign-up/complete?${shown}`);
  }

  // 사업자정보는 선택이라 회원가입 때는 검사하지 않고, 인증하기를 누를 때만 세 칸을 확인한다.
  // 인증되면 칸을 잠그고, 재인증하면 다시 연다.
  function handleVerify() {
    const inputs = [...(businessRef.current?.querySelectorAll("input") ?? [])];
    if (inputs.every((input) => input.value.trim() && input.checkValidity())) setVerified(true);
    else inputs.find((input) => !input.value.trim() || !input.checkValidity())?.focus();
  }

  function handleClearBusiness() {
    businessRef.current?.querySelectorAll("input").forEach((input) => (input.value = ""));
    setVerified(false);
  }

  return (
    <form className="flex flex-col gap-[40px]" onSubmit={handleSubmit}>
      <Section
        title="기본정보"
        note={
          <>
            (<span className="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-[16px] gap-y-[24px]">
          <Field label="아이디" required>
            <CheckedInput
              kind="loginId"
              required
              pattern="(?=.*[A-Za-z])[A-Za-z0-9]{4,20}"
              title="영문 또는 영문·숫자 조합 4~20자"
              autoComplete="username"
              placeholder="영문 또는 영문·숫자 조합 4~20자"
            />
          </Field>
          <Field label="이름" required>
            <span className={INPUT_BOX}>
              <input name="name" required minLength={2} maxLength={20} autoComplete="name" placeholder="한글 또는 영문 2~20자" className={INPUT} />
            </span>
          </Field>
          <PasswordField label="비밀번호" name="password" placeholder="영문·숫자·특수문자 조합 8~20자" />
          <PasswordField label="비밀번호 확인" name="passwordConfirm" placeholder="비밀번호를 한 번 더 입력해 주세요" />
          <Field label="이메일" required>
            <CheckedInput kind="email" type="email" required autoComplete="email" placeholder="example@company.com" />
          </Field>
          <div className="flex flex-col gap-[10px]">
            <span id="phone-label" className={LABEL}>
              연락처
              <Required />
            </span>
            <div role="group" aria-labelledby="phone-label" className="grid grid-cols-3 gap-[8px]">
              {PHONE_PARTS.map((part, i) => (
                <span key={part} className={INPUT_BOX}>
                  <input
                    name="phone"
                    aria-label={part}
                    required
                    inputMode="numeric"
                    pattern={i === 0 ? "[0-9]{2,3}" : "[0-9]{3,4}"}
                    maxLength={i === 0 ? 3 : 4}
                    placeholder={i === 0 ? "010" : "0000"}
                    className={INPUT}
                  />
                </span>
              ))}
            </div>
          </div>
          <Field label="상호명" required>
            <span className={INPUT_BOX}>
              <input name="companyName" required maxLength={50} autoComplete="organization" placeholder="50자 이내" className={INPUT} />
            </span>
          </Field>
        </div>
      </Section>

      <Section title="사업자정보 인증" note="(선택)">
        <div ref={businessRef} className="flex flex-col gap-[24px]">
          <p className="flex items-center gap-[8px] text-[16px] leading-[1.4] font-medium">
            사업자 번호 인증
            {verified && <span className="rounded-[4px] bg-guest-card px-[8px] py-[2px] text-[14px] text-guest-navy">인증완료</span>}
          </p>
          {/* 인증 버튼은 세 칸과 한 줄에 둬, 이 값들을 인증한다는 것이 바로 읽히게 한다(계정 찾기의 「인증번호 받기」와 같은 자리). */}
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-[16px]">
            <Field label="사업자등록번호">
              <span className={INPUT_BOX}>
                <input
                  name="bizRegistrationNumber"
                  disabled={verified}
                  inputMode="numeric"
                  pattern="[0-9]{3}-?[0-9]{2}-?[0-9]{5}"
                  placeholder="000-00-00000"
                  className={INPUT}
                />
              </span>
            </Field>
            <Field label="대표자명">
              <span className={INPUT_BOX}>
                <input name="bizCeoName" disabled={verified} placeholder="대표자 이름" className={INPUT} />
              </span>
            </Field>
            <Field label="개업일자">
              <span className={INPUT_BOX}>
                <input name="bizOpenDate" type="date" disabled={verified} className={INPUT} />
              </span>
            </Field>
            <div className="flex gap-[8px]">
              {verified ? (
                <>
                  <button type="button" onClick={() => setVerified(false)} className={FIELD_BUTTON}>
                    재인증
                  </button>
                  <button type="button" onClick={handleClearBusiness} className={FIELD_BUTTON}>
                    지우기
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleVerify} className={FIELD_BUTTON}>
                  인증하기
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="약관동의">
        <div className="flex flex-col gap-[18px] text-[16px] leading-[1.5] font-medium text-[#5e697b]">
          <label className="flex items-center gap-[8px] text-guest-ink">
            <input type="checkbox" checked={allAgreed} onChange={(e) => setAgreed({ service: e.target.checked, privacy: e.target.checked })} className={CHECKBOX} />
            모두 동의합니다.
          </label>
          <hr className="border-[#ebebeb]" />
          {AGREEMENTS.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <label className="flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  checked={agreed[item.key]}
                  onChange={(e) => setAgreed((v) => ({ ...v, [item.key]: e.target.checked }))}
                  className={CHECKBOX}
                />
                {item.label} (필수)
              </label>
              <button
                type="button"
                onClick={() => dialogs.current[item.key]?.showModal()}
                className={`text-[15px] text-guest-slate underline underline-offset-[3px] hover:text-guest-navy ${HOVER}`}
              >
                내용보기
              </button>
              <TermsDialog
                title={item.title}
                ref={(el) => {
                  dialogs.current[item.key] = el;
                }}
              >
                {terms[item.key]}
              </TermsDialog>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex flex-col gap-[16px]">
        {error && (
          <p role="alert" className="text-[15px] text-[#e93737]">
            {error}
          </p>
        )}
        <button type="submit" className={SUBMIT}>
          회원가입
        </button>
        <p className="flex justify-center gap-[10px] text-[16px] leading-[1.5] text-[#767676]">
          이미 계정이 있나요?
          <Link href="/design/guest/login" className={`font-semibold text-guest-ink hover:text-guest-navy ${HOVER}`}>
            로그인
          </Link>
        </p>
      </div>
    </form>
  );
}
