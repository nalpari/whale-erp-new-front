"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState, type FormEvent } from "react";
import { CHECKBOX, INPUT, INPUT_BOX, SUBMIT } from "@/app/design/guest/guest-form";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { HOVER } from "@/app/design/guest/theme";
import { clearLoginStorage } from "@/lib/browser-storage";
import { login, type LoginFormState } from "./actions";

// 아이디 저장은 이 브라우저에만 둔다(okf/auth.md — 로그인 유지 선택은 없다).
const SAVED_ID = "whale-erp:saved-login-id";

const ICON_BUTTON = "flex size-[16px] items-center justify-center";
// 칸 아래 오류 문구 — 회원가입(required-field.tsx)과 같은 모양.
const FIELD_ERROR = "text-[14px] leading-[1.5] text-[#e93737]";
// 빈칸 문구는 화면 정의(S-XJDKSI)대로다. 형식은 검사하지 않는다(okf/auth.md).
const EMPTY = { loginId: "아이디를 입력해주세요.", password: "비밀번호를 입력해주세요." } as const;
type EmptyField = keyof typeof EMPTY;

// 모양은 Figma 「로그인전_로그인」 샘플(design/guest/login/login-form.tsx)의 폼 규격(guest-form.ts)을 쓴다(2026-10-19).
// 샘플의 「로그인 상태 유지」 자리에는 아이디 저장을 둔다 — 로그인 유지 선택은 없다.
export function LoginForm() {
  const [state, action, pending] = useActionState<LoginFormState, FormData>(login, {});
  // 제어 입력 — 실패 뒤 React 가 비제어 폼을 비워도 아이디·체크가 남아야 다시 치지 않고, 다음 제출에서 저장값이 지워지지 않는다.
  const [loginId, setLoginId] = useState("");
  const [save, setSave] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [empty, setEmpty] = useState<Partial<Record<EmptyField, true>>>({});

  useEffect(() => {
    // 로그아웃·세션 만료로 왔다. 앞 로그인의 메뉴·점포·공통코드를 지운다(남아 있어도 login-key 가 달라 쓰이지 않지만 이 브라우저에 두지 않는다).
    clearLoginStorage();
    try {
      const saved = localStorage.getItem(SAVED_ID);
      if (saved) {
        // localStorage 는 클라이언트에만 있어 첫 렌더에 알 수 없다(초기값으로 읽으면 하이드레이션이 어긋난다).
        // 그새 사용자가 친 아이디가 있으면 덮지 않는다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoginId((typed) => typed || saved);
        setSave(true);
      }
    } catch {
      // 저장소를 못 쓰는 브라우저(사생활 보호 등)면 저장 없이 쓴다.
    }
  }, []);

  const remember = (form: FormData) => {
    try {
      if (save) localStorage.setItem(SAVED_ID, String(form.get("loginId") ?? "").trim());
      else localStorage.removeItem(SAVED_ID);
    } catch {}
    return action(form);
  };

  // 브라우저 말풍선 대신 빈칸마다 칸 아래에 문구를 둔다. 막을 때는 action 전에 멈춰야 친 비밀번호가 폼 초기화로 지워지지 않는다.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = new FormData(e.currentTarget);
    const next = {
      ...(String(form.get("loginId") ?? "").trim() ? {} : { loginId: true as const }),
      ...(String(form.get("password") ?? "") ? {} : { password: true as const }),
    };
    setEmpty(next);
    const first = (Object.keys(EMPTY) as EmptyField[]).find((key) => next[key]);
    if (!first) return;
    e.preventDefault();
    e.currentTarget.querySelector<HTMLInputElement>(`input[name="${first}"]`)?.focus();
  };
  const clearEmpty = (key: EmptyField) => empty[key] && setEmpty((current) => ({ ...current, [key]: undefined }));

  return (
    <form action={remember} onSubmit={handleSubmit} noValidate className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[10px]">
        <div className="flex flex-col gap-[6px]">
          <label className={INPUT_BOX}>
            <span className="sr-only">아이디</span>
            <input
              name="loginId"
              autoComplete="username"
              placeholder="User ID"
              value={loginId}
              onChange={(e) => {
                setLoginId(e.target.value);
                clearEmpty("loginId");
              }}
              required
              aria-invalid={empty.loginId}
              aria-describedby={empty.loginId ? "login-id-error" : undefined}
              maxLength={20}
              className={INPUT}
            />
            {loginId && (
              <button type="button" aria-label="아이디 지우기" onClick={() => setLoginId("")} className={ICON_BUTTON}>
                <Image src="/guest/login/clear.svg" alt="" width={16} height={16} />
              </button>
            )}
          </label>
          {empty.loginId && (
            <span id="login-id-error" role="alert" className={FIELD_ERROR}>
              {EMPTY.loginId}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-[6px]">
          <label className={INPUT_BOX}>
            <span className="sr-only">비밀번호</span>
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              onChange={() => clearEmpty("password")}
              required
              aria-invalid={empty.password}
              aria-describedby={empty.password ? "login-password-error" : undefined}
              maxLength={128}
              className={INPUT}
            />
            <button
              type="button"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
              className={ICON_BUTTON}
            >
              <Image src={showPassword ? "/guest/login/eye-off.svg" : "/guest/login/eye-on.svg"} alt="" width={16} height={16} />
            </button>
          </label>
          {empty.password && (
            <span id="login-password-error" role="alert" className={FIELD_ERROR}>
              {EMPTY.password}
            </span>
          )}
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-[15px] text-[#e93737]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={SUBMIT}>
        {pending ? "로그인 중" : "LOGIN"}
      </button>
      <div className="flex items-center justify-between text-[15px] leading-[1.5] font-medium text-[#5e697b]">
        <label className="flex items-center gap-[8px]">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} className={CHECKBOX} />
          아이디 저장
        </label>
        {/* 데모 auth/find.html 에 대응한다(/auth 접두 없음). 찾기 화면(/find)은 아이디 탭으로 열린다. */}
        <Link href={SITE_ROUTES.findAccount} className={`hover:text-guest-navy ${HOVER}`}>
          아이디/비밀번호 찾기
        </Link>
      </div>
    </form>
  );
}
