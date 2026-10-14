"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button, FormGroup, TextField } from "@/components/common";
import { Blank } from "../_components/blank";
import { LoginPendingLink } from "../_components/login-pending";
import { PasswordField } from "../_components/password-field";
import { PhoneField } from "../_components/phone-field";
import { RequiredField } from "../_components/required-field";
import { Row } from "../_components/row";
import {
  validateEmail,
  validateLoginId,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
  validateTradeName,
} from "../_components/validators";
import { checkEmailAvailability, checkLoginIdAvailability, createSignup, type AvailabilityResult } from "./actions";
import { AGREE_INITIAL, AgreeSection, type AgreeValue } from "./agree-section";
import { BIZ_AUTH_INITIAL, BizAuthSection, type BizAuthValue } from "./biz-auth-section";

type Values = {
  loginId: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone1: string;
  phone2: string;
  phone3: string;
  email: string;
  tradeName: string;
};

const INITIAL: Values = { loginId: "", password: "", passwordConfirm: "", name: "", phone1: "", phone2: "", phone3: "", email: "", tradeName: "" };

type ErrorKey = keyof Omit<Values, "phone1" | "phone2" | "phone3"> | "phone";
type Errors = Partial<Record<ErrorKey, string>>;

function validateField(key: ErrorKey, v: Values): string | undefined {
  switch (key) {
    case "loginId":
      return validateLoginId(v.loginId);
    case "password":
      return validatePassword(v.password);
    case "passwordConfirm":
      return validatePasswordConfirm(v.password, v.passwordConfirm);
    case "name":
      return validateName(v.name);
    case "phone":
      return validatePhone(v.phone1, v.phone2, v.phone3);
    case "email":
      return validateEmail(v.email);
    case "tradeName":
      return validateTradeName(v.tradeName);
  }
}

const ALL_KEYS: ErrorKey[] = ["loginId", "password", "passwordConfirm", "name", "phone", "email", "tradeName"];

// 중복 확인을 하는 두 칸. 형식이 맞을 때만 api 에 묻는다.
type AvailabilityKey = "loginId" | "email";

const AVAILABILITY: Record<
  AvailabilityKey,
  { validate: (value: string) => string | undefined; request: (value: string) => Promise<AvailabilityResult>; takenMessage: string }
> = {
  loginId: { validate: validateLoginId, request: checkLoginIdAvailability, takenMessage: "이미 사용 중인 아이디입니다." },
  email: { validate: validateEmail, request: checkEmailAvailability, takenMessage: "이미 사용 중인 이메일입니다." },
};

// 체크 표시는 운영 파랑(erp-on) — "사용 가능"도 상태라 상태색을 쓴다(2026-10-12).
const CHECK_CIRCLE = (
  <svg viewBox="0 0 20 20" className="size-[16px] shrink-0" aria-hidden>
    <circle cx="10" cy="10" r="9" fill="currentColor" />
    <path d="M6 10.3l2.6 2.6L14 7.3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// 둘 다 안 했으면 둘 다 말하고, 하나만 안 했으면 그 항목 이름만 말한다.
function agreeErrorMessage(useAgreed: boolean, privacyAgreed: boolean): string | undefined {
  if (useAgreed && privacyAgreed) return undefined;
  if (!useAgreed && !privacyAgreed) return "이용약관과 개인정보 수집·이용에 모두 동의해 주세요.";
  return !useAgreed ? "이용약관에 동의해 주세요." : "개인정보 수집·이용에 동의해 주세요.";
}

// 회원가입 폼 전체. 1~4단계(기본정보·사업자정보 인증·약관동의·제출)를 한 컴포넌트가 들고 있다 —
// 제출 때 모든 섹션 값이 한 번에 필요해서, 섹션마다 흩어져 있던 상태를 여기로 모았다.
export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [biz, setBiz] = useState<BizAuthValue>(BIZ_AUTH_INITIAL);
  const [agree, setAgree] = useState<AgreeValue>(AGREE_INITIAL);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [pending, setPending] = useState(false);
  // 아이디·이메일은 버튼 없이 칸을 벗어날 때(blur) api 로 중복까지 확인하고, 쓸 수 있을 때만 "사용가능합니다."를
  // 띄운다. 값을 고치면 다시 확인해야 하므로 끈다(2026-10-12 피드백). 제출할 때 확인을 못 마친 칸은 한 번 더
  // 확인해 그 칸에서 막는다 — 가입 요청이 중복으로 거절되는 일이 없게 한다.
  // 제출 중(pending)에는 이 두 칸을 잠근다 — 안 잠그면 제출이 건 확인이 진행 중일 때 값을 고쳐서 그
  // 확인 결과가 조용히 버려지고, 오류도 없이 "처리 중..."에서 그냥 멈춘 것처럼 보일 수 있다(2026-10-12 코드리뷰).
  const [available, setAvailable] = useState<Record<AvailabilityKey, boolean>>({ loginId: false, email: false });
  // 확인 응답이 오기 전에 값을 고치거나 다시 확인하면 앞선 응답은 버린다.
  const availabilityRun = useRef<Record<AvailabilityKey, number>>({ loginId: 0, email: 0 });

  // formatError 를 미리 알고 있으면(제출 때 ALL_KEYS 검사에서 이미 계산됨) 형식 검사를 다시 돌리지 않는다.
  async function verifyAvailability(
    key: AvailabilityKey,
    value: string,
    formatError: string | undefined = AVAILABILITY[key].validate(value),
  ): Promise<boolean> {
    const run = ++availabilityRun.current[key];
    const { request, takenMessage } = AVAILABILITY[key];
    let message = formatError;
    if (!message) {
      const result = await request(value).catch((e) => {
        // 서버 액션 자체가 실패했을 때만 여기로 온다 — request 는 자기 실패를 {ok:false} 로 돌려준다.
        console.error("[signup] availability request failed", key, e);
        return null;
      });
      if (run !== availabilityRun.current[key]) return false;
      if (!result) message = "중복 확인을 하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      else if (!result.ok) message = result.message;
      else if (!result.available) message = takenMessage;
    }
    setErrors((e) => ({ ...e, [key]: message }));
    setAvailable((a) => ({ ...a, [key]: !message }));
    return !message;
  }

  function handleAvailabilityChange(key: AvailabilityKey, value: string) {
    set(key, value);
    availabilityRun.current[key]++;
    setAvailable((a) => ({ ...a, [key]: false }));
  }

  // 한 번 제출을 시도한 뒤로는 체크박스를 누를 때마다(아직 안 된 것만 이름을 들어) 바로 따라 바뀐다.
  const agreeError = triedSubmit ? agreeErrorMessage(agree.useAgreed, agree.privacyAgreed) : undefined;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));
  const check = (key: ErrorKey, next: Values = values) => setErrors((e) => ({ ...e, [key]: validateField(key, next) }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(undefined);
    setTriedSubmit(true);

    const fieldErrors: Errors = {};
    for (const key of ALL_KEYS) fieldErrors[key] = validateField(key, values);
    setErrors(fieldErrors);

    const hasFieldError = Object.values(fieldErrors).some(Boolean);
    const agreedRequired = agree.useAgreed && agree.privacyAgreed;

    if (hasFieldError || !agreedRequired) return;

    setPending(true);
    try {
      // 형식은 위 fieldErrors 에서 이미 확인했다 — 다시 검사하지 않고 그 결과를 넘긴다.
      // 중복 확인을 아직 통과하지 못한 칸만 여기서 api 로 묻고, 걸리면 그 칸에 오류를 띄운다.
      const unchecked = (["loginId", "email"] as const).filter((key) => !available[key]);
      const checks = await Promise.all(unchecked.map((key) => verifyAvailability(key, values[key], fieldErrors[key])));
      if (checks.includes(false)) return;

      const result = await createSignup({
        loginId: values.loginId,
        password: values.password,
        name: values.name,
        phone: `${values.phone1}${values.phone2}${values.phone3}`,
        email: values.email,
        tradeName: values.tradeName,
        agreeTermsOfUse: agree.useAgreed,
        agreePrivacy: agree.privacyAgreed,
      });

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      // 로그인 세션이 아직 없어 완료 화면에 보여줄 값을 쿼리로 들고 간다(signup-done/page.tsx 참고).
      const params = new URLSearchParams({ tradeName: result.tradeName, loginId: result.loginId, email: result.email });
      router.push(`/auth/signup-done?${params}`);
    } catch (e) {
      // 서버 액션 호출 자체가 실패한 경우(네트워크 끊김, 배포로 액션 ID 가 바뀜 등). 버튼이 "처리 중..."에 멈추지 않게 한다.
      console.error("[signup] handleSubmit failed", e);
      setSubmitError("회원가입 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[18px]">
      <FormGroup
        title={
          <>
            기본정보
            <span className="ml-[10px] text-[14px] font-normal text-erp-label">
              (<span className="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)
            </span>
          </>
        }
      >
        <Row>
          <RequiredField label="아이디" error={errors.loginId}>
            <TextField
              value={values.loginId}
              onChange={(e) => handleAvailabilityChange("loginId", e.target.value)}
              onBlur={() => !available.loginId && verifyAvailability("loginId", values.loginId)}
              autoComplete="username"
              placeholder="영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요."
              disabled={pending}
            />
            {available.loginId && !errors.loginId ? (
              <span className="flex items-center gap-[4px] text-[13px] text-erp-on">
                {CHECK_CIRCLE} 사용가능합니다.
              </span>
            ) : null}
          </RequiredField>
          <RequiredField label="이름" error={errors.name}>
            <TextField value={values.name} onChange={(e) => set("name", e.target.value)} onBlur={() => check("name")} placeholder="한글 또는 영문 2~20자로 입력해 주세요." />
          </RequiredField>
        </Row>

        <Row>
          <PasswordField
            label="비밀번호"
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            onBlur={() => check("password")}
            autoComplete="new-password"
            placeholder="영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요."
            error={errors.password}
          />
          <PasswordField
            label="비밀번호 확인"
            value={values.passwordConfirm}
            onChange={(e) => set("passwordConfirm", e.target.value)}
            onBlur={() => check("passwordConfirm")}
            autoComplete="new-password"
            error={errors.passwordConfirm}
          />
        </Row>

        <Row>
          <RequiredField label="이메일" error={errors.email}>
            <TextField
              type="email"
              value={values.email}
              onChange={(e) => handleAvailabilityChange("email", e.target.value)}
              onBlur={() => !available.email && verifyAvailability("email", values.email)}
              disabled={pending}
            />
            {available.email && !errors.email ? (
              <span className="flex items-center gap-[4px] text-[13px] text-erp-on">
                {CHECK_CIRCLE} 사용가능합니다.
              </span>
            ) : null}
          </RequiredField>
          <RequiredField label="연락처" error={errors.phone}>
            <PhoneField
              values={[values.phone1, values.phone2, values.phone3]}
              onChange={(i, v) => set((["phone1", "phone2", "phone3"] as const)[i], v)}
              onBlur={() => check("phone")}
            />
          </RequiredField>
        </Row>

        <Row>
          <RequiredField label="상호명" error={errors.tradeName}>
            <TextField value={values.tradeName} onChange={(e) => set("tradeName", e.target.value)} onBlur={() => check("tradeName")} placeholder="50자 이내로 입력해 주세요." />
          </RequiredField>
          <Blank />
        </Row>
      </FormGroup>

      <BizAuthSection value={biz} onChange={setBiz} />

      <AgreeSection value={agree} onChange={setAgree} />

      {agreeError ? (
        <span role="alert" className="text-[13px] text-[#e93737]">
          {agreeError}
        </span>
      ) : null}

      <div className="grid">
        <Button type="submit" disabled={pending}>
          {pending ? "처리 중..." : "회원가입"}
        </Button>
      </div>
      {submitError ? (
        <p role="alert" className="text-center text-[13px] text-[#e93737]">
          {submitError}
        </p>
      ) : null}

      <p className="flex justify-center gap-[10px] text-[14px]">
        <span className="text-erp-label">이미 계정이 있나요?</span>
        {/* 로그인 화면이 없고, 디자인 샘플로 보내면 돌아올 길이 없어 안내창으로 되돌린다(2026-10-14 피드백). */}
        <LoginPendingLink className="text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink">
          <b className="font-semibold text-erp-ink">로그인</b>
        </LoginPendingLink>
      </p>
    </form>
  );
}
