"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { INPUT, INPUT_BOX, SUBMIT } from "@/app/design/guest/guest-form";
import { HOVER } from "@/app/design/guest/theme";
import { PasswordField } from "./password-field";
import { PhoneField } from "./phone-field";
import { RequiredField } from "./required-field";
import { BUSY_MESSAGE, CHECK_FAILED_MESSAGE, UNKNOWN_RESULT_MESSAGE } from "./api-failure";
import { bizNoticeField, bizSubmitBlock } from "./biz-verification";
import {
  agreeErrorMessage,
  normalizeLoginId,
  validateEmail,
  validateLoginId,
  validateName,
  validatePassword,
  validatePasswordConfirm,
  validatePhone,
  validateTradeName,
} from "./validators";
import { checkEmailAvailability, checkLoginIdAvailability, createSignup, type AvailabilityResult } from "./actions";
import { AGREE_INITIAL, AgreeSection, type AgreeValue } from "./agree-section";
import { BIZ_AUTH_INITIAL, BizAuthSection, type BizAuthValue } from "./biz-auth-section";
import { SIGNUP_DONE_PATH } from "./signup-done-cookie";

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

// 결과 불명 잠금을 새로고침에도 남긴다 — sessionStorage 가 없으면(서버 렌더 · 막힌 브라우저) 그냥 안 남는다.
// useSyncExternalStore 로 읽는다 — 서버 렌더는 늘 false(getServerSnapshot)이고, 탭 안에서 setUncertain 이
// 쓴 값은 구독자에게 직접 알려 다시 읽게 한다(sessionStorage 는 같은 탭에 변화 이벤트를 주지 않는다).
const UNCERTAIN_KEY = "whale-erp-front:v1:signup-uncertain";
const uncertainListeners = new Set<() => void>();
function subscribeUncertain(onChange: () => void) {
  uncertainListeners.add(onChange);
  return () => uncertainListeners.delete(onChange);
}
function readUncertain(): boolean {
  try {
    return sessionStorage.getItem(UNCERTAIN_KEY) === "1";
  } catch {
    return false;
  }
}
function writeUncertain(value: boolean) {
  try {
    if (value) sessionStorage.setItem(UNCERTAIN_KEY, "1");
    else sessionStorage.removeItem(UNCERTAIN_KEY);
  } catch {
    // 세션 저장소를 못 쓰는 환경(시크릿 모드 등)에서도 이번 화면 안에서는 구독자가 그대로 알림을 받는다.
  }
  uncertainListeners.forEach((listener) => listener());
}

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

// Values 의 phone1~3 은 한 오류(phone)를 같이 쓴다 — 그 셋을 고치면 phone 오류를 지운다.
const ERROR_KEY_FOR: Record<keyof Values, ErrorKey> = {
  loginId: "loginId",
  password: "password",
  passwordConfirm: "passwordConfirm",
  name: "name",
  phone1: "phone",
  phone2: "phone",
  phone3: "phone",
  email: "email",
  tradeName: "tradeName",
};

// 중복 확인을 하는 두 칸. 형식이 맞을 때만 api 에 묻는다.
type AvailabilityKey = "loginId" | "email";

const AVAILABILITY: Record<
  AvailabilityKey,
  { validate: (value: string) => string | undefined; request: (value: string) => Promise<AvailabilityResult>; takenMessage: string }
> = {
  // 이메일은 "이미 가입하셨다면 로그인해 주세요" 를 덧붙인다(아이디는 2026-10-28 사용자 지정으로 관리자 등록 화면과 같은 「다른 아이디를 입력해 주세요」) — 결과 불명(uncertain) 제출 뒤 다시 냈을 때 이 문구만 보면
  // 남이 쓰는 아이디·이메일로 오해해 값을 바꿔 다시 낼 수 있다(BP 중복 생성, 2026-10-15 코드리뷰 3차).
  loginId: { validate: validateLoginId, request: checkLoginIdAvailability, takenMessage: "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요." },
  email: { validate: validateEmail, request: checkEmailAvailability, takenMessage: "이미 사용 중인 이메일입니다. 이미 가입하셨다면 로그인해 주세요." },
};

// 아이디 중복확인 중 · 확인 실패 안내 — 관리자 등록 세 화면(플랫폼 · BP 관리자 · BP 마스터, platform-admins/admin-parts.tsx 의
// LOGIN_ID_CHECK_TEXT)과 같은 문구다(2026-10-28 사용자 지정). 공개 화면이라 ERP 조각을 가져오지 않고 문구만 맞춘다.
const LOGIN_ID_CHECK_TEXT = {
  checking: "아이디를 확인하는 중입니다.",
  // 확인 요청 자체가 실패(429 · 5xx · 연결)했을 때. 칸을 벗어날 때는 막지 않고, 가입하기를 누르면 다시 확인해 그때 실패하면 칸 오류로 막는다.
  failed: "아이디를 확인하지 못했습니다. 저장 시 다시 확인합니다.",
} as const;

// 체크 표시는 1팀 비로그인 폼의 확인 색(#5e8ce9) — design/guest/sign-up 의 CheckedInput 과 같다(2026-10-14).
const CHECK_CIRCLE = (
  <svg viewBox="0 0 20 20" className="size-[16px] shrink-0" aria-hidden>
    <circle cx="10" cy="10" r="9" fill="currentColor" />
    <path d="M6 10.3l2.6 2.6L14 7.3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// 회원가입 폼 전체. 1~4단계(기본정보·사업자정보 인증·약관동의·제출)를 한 컴포넌트가 들고 있다 —
// 제출 때 모든 섹션 값이 한 번에 필요해서, 섹션마다 흩어져 있던 상태를 여기로 모았다.
// 모양은 1팀 비로그인 폼 규격(guest-form.ts)을 쓴다 — docs/demo/src/pages/auth/signup.mjs 가
// design/guest/sign-up(기획 시안 + Figma 폼 규격)을 기준으로 삼기로 하면서 맞췄다(2026-10-14).
// 아이디·이메일 중복 확인, 사업자정보 인증, 약관 동의, 제출은 디자인 샘플과 달리 전부 실제로 동작한다.
export function SignupForm({ loggedInHomeHref }: { loggedInHomeHref?: string }) {
  const router = useRouter();
  const ids = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [biz, setBiz] = useState<BizAuthValue>(BIZ_AUTH_INITIAL);
  // 사업자정보 진위확인 중에는 제출을 막는다 — 토큰을 받기 전에 가입되면 입력한 사업자정보가 조용히 빠진다.
  const [bizVerifying, setBizVerifying] = useState(false);
  const [agree, setAgree] = useState<AgreeValue>(AGREE_INITIAL);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [explicitSubmitError, setSubmitError] = useState<string>();
  // 제출 결과를 모르는 채로 끝나면(시간 초과·응답 파싱 실패·5xx) 켠다 — 이미 가입됐을 수 있다. 그대로 다시
  // 내면 방금 만든 자기 계정과 아이디·이메일이 겹쳐 409 가 오고, 그 칸이 "이미 사용 중"으로 바뀌어 남이 쓰는
  // 줄 알고 값을 바꿔 다시 내면 BP 가 두 개 생긴다(되돌릴 수 없다). 칸 편집으로는 풀지 않는다 — 상관없는
  // 칸(이름 등)을 고치거나 같은 값으로 되돌려도 중복 확인 없이 그대로 다시 낼 수 있게 돼 버린다
  // (2026-10-15 코드리뷰 2차). 「처음부터 다시 쓰기」(handleStartOver)만 끈다. sessionStorage 에서
  // useSyncExternalStore 로 읽어 새로고침에도 남는다 — 서버 렌더는 늘 false(getServerSnapshot).
  const uncertain = useSyncExternalStore(subscribeUncertain, readUncertain, () => false);
  const setUncertain = writeUncertain;
  // 잠겨 있는 동안은 저장된 오류 문구와 상관없이 늘 이 안내를 보인다 — 새로고침 직후(explicitSubmitError 가
  // 비어 있을 때)에도 문구가 사라지지 않는다.
  const submitError = uncertain ? UNKNOWN_RESULT_MESSAGE : explicitSubmitError;
  const [pending, setPending] = useState(false);
  // 아이디·이메일은 버튼 없이 칸을 벗어날 때(blur) api 로 중복까지 확인하고, 쓸 수 있을 때만 "사용가능합니다."를
  // 띄운다. 값을 고치면 다시 확인해야 하므로 끈다(2026-10-12 피드백). 제출할 때 확인을 못 마친 칸은 한 번 더
  // 확인해 그 칸에서 막는다 — 가입 요청이 중복으로 거절되는 일이 없게 한다.
  // 제출 중(pending)에는 폼 전체가 <fieldset disabled> 로 잠긴다(아래 return 참고). 포커스가 있던 칸이
  // disabled 가 되는 순간 브라우저가 자동으로 blur 를 보낸다 — 그 blur 가 onBlur 를 다시 불러 제출이
  // 기다리던 확인(run id)을 "오래된 응답"으로 만들어 버리면, 유효한 첫 제출이 아무 오류도 없이 조용히
  // 멈춘 것처럼 보인다. onBlur 에 !pending 을 걸어 disabled 로 인한 blur 가 새 확인을 더 만들지 않게
  // 막는다(2026-10-14 코드리뷰, silent-failure-hunter).
  const [available, setAvailable] = useState<Record<AvailabilityKey, boolean>>({ loginId: false, email: false });
  // 확인 응답이 오기 전에 값을 고치거나 다시 확인하면 앞선 응답은 버린다.
  const availabilityRun = useRef<Record<AvailabilityKey, number>>({ loginId: 0, email: 0 });
  // 아이디 확인 중 · 확인 실패 안내(2026-10-28 사용자 지정). 쓸 수 있음은 위 available, 오류는 errors.loginId 가 맡는다.
  const [loginIdCheck, setLoginIdCheck] = useState<"idle" | keyof typeof LOGIN_ID_CHECK_TEXT>("idle");

  // formatError 를 미리 알고 있으면(제출 때 ALL_KEYS 검사에서 이미 계산됨) 형식 검사를 다시 돌리지 않는다.
  // softFail 은 칸을 벗어날 때의 확인이다 — 아이디 확인 요청 자체가 실패(429 · 5xx · 연결)하면 칸 오류 대신 회색 안내만 둔다.
  // 쓸 수 있다고 확인된 것은 아니라(available 은 false) 가입하기를 누르면 다시 확인하고, 그때도 실패하면 칸 오류로 막는다.
  async function verifyAvailability(
    key: AvailabilityKey,
    value: string,
    formatError: string | undefined = AVAILABILITY[key].validate(value),
    softFail = false,
  ): Promise<boolean> {
    const run = ++availabilityRun.current[key];
    const { request, takenMessage } = AVAILABILITY[key];
    let message = formatError;
    let requestFailed = false;
    if (!message) {
      if (key === "loginId") setLoginIdCheck("checking");
      const result = await request(value).catch((e) => {
        // 서버 액션 자체가 실패했을 때만 여기로 온다 — request 는 자기 실패를 {ok:false} 로 돌려준다.
        console.error("[signup] availability request failed", key, e);
        return null;
      });
      if (run !== availabilityRun.current[key]) return false;
      if (!result) message = CHECK_FAILED_MESSAGE;
      else if (!result.ok) message = result.message;
      else if (!result.available) message = takenMessage;
      // 400(형식)만 api 문구를 그대로 받는다 — 나머지 실패는 actions.ts 가 이 두 문구로 바꿔 준다(api-failure.ts)
      requestFailed = message === CHECK_FAILED_MESSAGE || message === BUSY_MESSAGE;
    }
    const soft = key === "loginId" && softFail && requestFailed;
    if (key === "loginId") setLoginIdCheck(soft ? "failed" : "idle");
    setErrors((e) => ({ ...e, [key]: soft ? undefined : message }));
    setAvailable((a) => ({ ...a, [key]: !message }));
    return !message;
  }

  function handleAvailabilityChange(key: AvailabilityKey, value: string) {
    set(key, value);
    availabilityRun.current[key]++;
    setAvailable((a) => ({ ...a, [key]: false }));
    if (key === "loginId") setLoginIdCheck("idle");
  }

  // 한 번 제출을 시도한 뒤로는 체크박스를 누를 때마다(아직 안 된 것만 이름을 들어) 바로 따라 바뀐다.
  const agreeError = triedSubmit ? agreeErrorMessage(agree.useAgreed, agree.privacyAgreed) : undefined;

  // 칸 오류 문구의 id — 입력칸이 aria-describedby 로 가리킨다(admin-form-panel.tsx 와 같은 짝, 2026-10-14 코드리뷰).
  const messageId = (key: ErrorKey) => `${ids}-${key}`;
  const invalid = (key: ErrorKey) => (errors[key] ? true : undefined);
  const describe = (key: ErrorKey) => (errors[key] ? messageId(key) : undefined);
  // 오류가 생기면 첫 오류 칸으로 커서를 옮긴다 — 아래 칸 오류는 스크롤해야 보일 수 있다.
  const focusFirstError = () =>
    requestAnimationFrame(() => (formRef.current?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
  // 사업자정보 인증을 풀고 그 묶음에 문구를 보인다. 가입 버튼 아래가 아니라 위쪽 묶음이라 그리로 스크롤한다.
  const rejectBiz = (notice: string) => {
    setBiz((b) => ({ ...b, verification: null, notice, noticeField: bizNoticeField(notice) }));
    requestAnimationFrame(() => formRef.current?.querySelector("[data-biz-auth]")?.scrollIntoView({ block: "center" }));
  };

  // 칸을 고치면 그 칸의 오류는 바로 지운다 — 중복 오류("이미 사용 중인 아이디입니다")를 보고 다시
  // 타이핑해도 blur 전까지 오류가 그대로 남아 있던 문제를 고쳤다(2026-10-14 코드리뷰).
  const clearError = (key: ErrorKey) => setErrors((e) => (key in e ? { ...e, [key]: undefined } : e));
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    clearError(ERROR_KEY_FOR[key]);
  };
  const check = (key: ErrorKey, next: Values = values) => setErrors((e) => ({ ...e, [key]: validateField(key, next) }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // 결과를 모르는 채로 끝난 제출 뒤에는 그대로 다시 내지 않는다 — 「처음부터 다시 쓰기」(handleStartOver)만 푼다.
    if (uncertain) return;
    setSubmitError(undefined);
    setTriedSubmit(true);

    const fieldErrors: Errors = {};
    for (const key of ALL_KEYS) fieldErrors[key] = validateField(key, values);
    setErrors(fieldErrors);

    const hasFieldError = Object.values(fieldErrors).some(Boolean);
    const agreedRequired = agree.useAgreed && agree.privacyAgreed;

    if (hasFieldError) return focusFirstError();
    if (!agreedRequired) return;
    if (bizVerifying) return;
    // 10분이 지난 토큰은 보내 봐야 400 이고, 인증 없이 채워진 칸은 조용히 빠진다 — 보내지 않고 사업자정보 묶음에서 막는다.
    const bizBlock = bizSubmitBlock(biz, Date.now());
    if (bizBlock) return rejectBiz(bizBlock);

    setPending(true);
    try {
      // 형식은 위 fieldErrors 에서 이미 확인했다 — 다시 검사하지 않고 그 결과를 넘긴다.
      // 중복 확인을 아직 통과하지 못한 칸만 여기서 api 로 묻고, 걸리면 그 칸에 오류를 띄운다.
      const unchecked = (["loginId", "email"] as const).filter((key) => !available[key]);
      const checks = await Promise.all(unchecked.map((key) => verifyAvailability(key, values[key], fieldErrors[key])));
      if (checks.includes(false)) {
        setPending(false);
        return focusFirstError();
      }

      const result = await createSignup({
        loginId: values.loginId,
        password: values.password,
        name: values.name,
        phone: `${values.phone1}${values.phone2}${values.phone3}`,
        email: values.email,
        tradeName: values.tradeName,
        ...(biz.verification ? { bizVerificationToken: biz.verification.token } : {}),
        agreeTermsOfUse: agree.useAgreed,
        agreePrivacy: agree.privacyAgreed,
      });

      if (!result.ok) {
        if (result.bizRejected) {
          // 토큰 만료 400 · 인증 뒤 다른 BP 가 같은 번호로 가입한 409. 같은 토큰으로는 다시 내도 거절되니 인증을 푼다.
          rejectBiz(result.message);
          setPending(false);
          return;
        }
        setSubmitError(result.message);
        if (result.message === UNKNOWN_RESULT_MESSAGE) setUncertain(true);
        if (result.conflict) {
          // 409 — 확인과 제출 사이에 누가 먼저 가입했다. 「사용가능합니다」를 그대로 두면 칸을 고치기 전까지 같은
          // 제출이 409 만 되풀이한다. 두 칸을 다시 확인해 걸린 칸에 오류를 띄운다. 다시 확인하는 동안은 폼을 잠가 둔다 —
          // 먼저 풀면 그사이 다시 낸 제출이 확인을 새로 시작해 이 확인 응답이 「오래된 응답」으로 버려진다.
          setAvailable({ loginId: false, email: false });
          await Promise.all((["loginId", "email"] as const).map((key) => verifyAvailability(key, values[key])));
          setPending(false);
          focusFirstError();
          return;
        }
        setPending(false);
        return;
      }

      // 로그인 세션이 아직 없어 완료 화면에 보여줄 값은 createSignup 이 이미 httpOnly 쿠키로 심어 뒀다
      // (signup-done-cookie.ts 참고) — URL 쿼리로 넘기지 않는다. 쿼리로 넘기면 서버 로그·브라우저 기록에
      // 남고, 아무 값이나 지어 넣은 주소도 진짜 완료 화면처럼 보일 수 있었다(2026-10-14 ip-code-review-claude).
      router.push(SIGNUP_DONE_PATH);
      // pending 을 여기서 풀지 않는다 — 화면이 옮겨 가는 동안 버튼이 다시 눌릴 수 있는 틈을 없앤다
      // (이전엔 finally 가 성공 때도 풀어, 옮겨 가는 찰나에 다시 눌러 같은 요청을 한 번 더 보낼 수 있었다 — 2026-10-14 코드리뷰).
    } catch (e) {
      // 서버 액션 호출 자체가 실패한 경우(네트워크 끊김, 배포로 액션 ID 가 바뀜 등). 버튼이 "처리 중..."에 멈추지 않게 한다.
      // 요청이 서버에 닿아 가입이 이미 됐을 수 있다 — 「보내지 못했다」 대신 로그인을 먼저 해 보라고 안내한다.
      console.error("[signup] handleSubmit failed", e);
      setSubmitError(UNKNOWN_RESULT_MESSAGE);
      setUncertain(true);
      setPending(false);
    }
  }

  // 결과 불명 잠금을 푸는 유일한 길. 값·확인 상태를 전부 지워 처음부터 다시 쓰게 한다 — 일부만 지우면
  // 중복 확인을 건너뛴 채 다시 낼 수 있는 틈이 남는다.
  function handleStartOver() {
    setValues(INITIAL);
    setErrors({});
    setBiz(BIZ_AUTH_INITIAL);
    setAgree(AGREE_INITIAL);
    setTriedSubmit(false);
    setSubmitError(undefined);
    setAvailable({ loginId: false, email: false });
    setLoginIdCheck("idle");
    setUncertain(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-[40px]">
      {/* 제출 중(pending)에는 폼 전체를 잠근다 — 아이디·이메일만 잠그면 나머지 칸은 계속 고칠 수 있는데,
          handleSubmit 은 이미 클로저로 캡처한 제출 시점 값을 보내고 있어서 고친 값이 조용히 버려진다
          (가입은 되돌릴 수 없다 — 2026-10-14 ip-code-review-claude 블로커#1). fieldset 하나로 안의 모든
          입력·버튼·체크박스를 한 번에 잠근다. className="contents" 로 레이아웃(gap-[40px])에 끼어들지 않는다. */}
      <fieldset disabled={pending} className="contents">
        <section className="flex flex-col gap-[24px]">
          <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">
            기본정보
            <span className="ml-[10px] text-[15px] font-normal text-[#767676]">
              (<span className="text-[#e93737]">*</span> 표시는 필수 기재 항목입니다.)
            </span>
          </h2>
          <div className="grid grid-cols-2 gap-x-[16px] gap-y-[24px]">
            <RequiredField label="아이디" error={errors.loginId} errorId={messageId("loginId")}>
              <span className={INPUT_BOX}>
                <input
                  value={values.loginId}
                  onChange={(e) => {
                    // 소문자로 바꾸면 React 가 값을 다시 써 커서가 끝으로 간다 — 아이디는 ASCII 라 길이가 그대로이니 자리를 되살린다.
                    const { selectionStart, selectionEnd } = e.target;
                    const input = e.target;
                    handleAvailabilityChange("loginId", normalizeLoginId(input.value));
                    requestAnimationFrame(() => input.setSelectionRange(selectionStart, selectionEnd));
                  }}
                  onBlur={() =>
                    !pending && !available.loginId && verifyAvailability("loginId", values.loginId, undefined, true).catch((e) => console.error("[signup] blur check failed", "loginId", e))
                  }
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요."
                  aria-invalid={invalid("loginId")}
                  aria-describedby={describe("loginId")}
                  aria-busy={loginIdCheck === "checking" || undefined}
                  className={INPUT}
                />
              </span>
              {errors.loginId ? null : available.loginId ? (
                <span className="-mt-[2px] flex items-center gap-[4px] text-[14px] leading-[1.5] text-[#5e8ce9]">{CHECK_CIRCLE} 사용가능합니다.</span>
              ) : loginIdCheck !== "idle" ? (
                // 확인 중 · 확인 실패는 막는 오류가 아니라 사용가능 줄과 같은 자리 · 크기에 이 화면의 보조 글자색(#767676)으로 둔다
                <span className="-mt-[2px] text-[14px] leading-[1.5] text-[#767676]">{LOGIN_ID_CHECK_TEXT[loginIdCheck]}</span>
              ) : null}
            </RequiredField>
            <RequiredField label="이름" error={errors.name} errorId={messageId("name")}>
              <span className={INPUT_BOX}>
                <input
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={() => check("name")}
                  placeholder="한글 또는 영문 2~20자로 입력해 주세요."
                  aria-invalid={invalid("name")}
                  aria-describedby={describe("name")}
                  className={INPUT}
                />
              </span>
            </RequiredField>

            <PasswordField
              label="비밀번호"
              value={values.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => check("password")}
              autoComplete="new-password"
              placeholder="영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요."
              error={errors.password}
              errorId={messageId("password")}
              aria-invalid={invalid("password")}
              aria-describedby={describe("password")}
            />
            <PasswordField
              label="비밀번호 확인"
              value={values.passwordConfirm}
              onChange={(e) => set("passwordConfirm", e.target.value)}
              onBlur={() => check("passwordConfirm")}
              autoComplete="new-password"
              placeholder="비밀번호를 한 번 더 입력해 주세요."
              error={errors.passwordConfirm}
              errorId={messageId("passwordConfirm")}
              aria-invalid={invalid("passwordConfirm")}
              aria-describedby={describe("passwordConfirm")}
            />

            <RequiredField label="이메일" error={errors.email} errorId={messageId("email")}>
              <span className={INPUT_BOX}>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => handleAvailabilityChange("email", e.target.value)}
                  onBlur={() =>
                    !pending && !available.email && verifyAvailability("email", values.email).catch((e) => console.error("[signup] blur check failed", "email", e))
                  }
                  placeholder="example@company.com"
                  aria-invalid={invalid("email")}
                  aria-describedby={describe("email")}
                  className={INPUT}
                />
              </span>
              {available.email && !errors.email ? (
                <span className="-mt-[2px] flex items-center gap-[4px] text-[14px] leading-[1.5] text-[#5e8ce9]">{CHECK_CIRCLE} 사용가능합니다.</span>
              ) : null}
            </RequiredField>
            <RequiredField label="연락처" error={errors.phone} errorId={messageId("phone")}>
              <PhoneField
                values={[values.phone1, values.phone2, values.phone3]}
                onChange={(i, v) => set((["phone1", "phone2", "phone3"] as const)[i], v)}
                onBlur={() => check("phone")}
                invalid={invalid("phone")}
                describedBy={describe("phone")}
              />
            </RequiredField>

            <RequiredField label="상호명" error={errors.tradeName} errorId={messageId("tradeName")}>
              <span className={INPUT_BOX}>
                <input
                  value={values.tradeName}
                  onChange={(e) => set("tradeName", e.target.value)}
                  onBlur={() => check("tradeName")}
                  placeholder="50자 이내로 입력해 주세요."
                  aria-invalid={invalid("tradeName")}
                  aria-describedby={describe("tradeName")}
                  className={INPUT}
                />
              </span>
            </RequiredField>
          </div>
        </section>

        <BizAuthSection value={biz} onChange={setBiz} onVerifyingChange={setBizVerifying} />

        <AgreeSection value={agree} onChange={setAgree} />
      </fieldset>

      <div className="flex flex-col gap-[16px]">
        {agreeError ? (
          <span role="alert" className="text-[15px] text-[#e93737]">
            {agreeError}
          </span>
        ) : null}
        <button type="submit" disabled={pending || uncertain || bizVerifying} className={SUBMIT}>
          {pending ? "처리 중..." : "회원가입"}
        </button>
        {submitError ? (
          <p role="alert" className="text-center text-[15px] text-[#e93737]">
            {submitError}
          </p>
        ) : null}
        {uncertain ? (
          <button
            type="button"
            onClick={handleStartOver}
            className={`self-center font-semibold text-guest-ink underline underline-offset-[3px] hover:text-guest-navy ${HOVER}`}
          >
            처음부터 다시 쓰기
          </button>
        ) : null}
        <p className="flex justify-center gap-[10px] text-[16px] leading-[1.5] text-[#767676]">
          {loggedInHomeHref ? "이미 로그인한 계정이 있어요." : "이미 계정이 있나요?"}
          <Link href={loggedInHomeHref ?? "/login"} className={`font-semibold text-guest-ink hover:text-guest-navy ${HOVER}`}>
            {loggedInHomeHref ? "홈으로" : "로그인"}
          </Link>
        </p>
      </div>
    </form>
  );
}
