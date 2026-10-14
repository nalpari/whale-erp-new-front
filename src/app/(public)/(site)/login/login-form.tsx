"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Checkbox, Field, TextField } from "@/components/common";
import { clearLoginStorage } from "@/lib/browser-storage";
import { login, type LoginFormState } from "./actions";

// 아이디 저장은 이 브라우저에만 둔다(okf/auth.md — 로그인 유지 선택은 없다).
const SAVED_ID = "whale-erp:saved-login-id";

const QUIET = "text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginFormState, FormData>(login, {});
  const idRef = useRef<HTMLInputElement>(null);
  // 제어 입력 — 실패 뒤 React 가 비제어 폼을 비워도 체크가 남아야 다음 제출에서 저장값이 지워지지 않는다.
  const [save, setSave] = useState(false);

  useEffect(() => {
    // 로그아웃·세션 만료로 왔다. 앞 로그인의 메뉴·점포·공통코드를 지운다(남아 있어도 login-key 가 달라 쓰이지 않지만 이 브라우저에 두지 않는다).
    clearLoginStorage();
    try {
      const saved = localStorage.getItem(SAVED_ID);
      if (saved && idRef.current && !idRef.current.value) {
        idRef.current.value = saved;
        // localStorage 는 클라이언트에만 있어 첫 렌더에 알 수 없다(초기값으로 읽으면 하이드레이션이 어긋난다).
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

  return (
    <form action={remember} className="flex flex-col gap-[18px]">
      <h1 className="text-[18px] font-semibold">웨일ERP 로그인</h1>
      <Field label="아이디">
        <TextField ref={idRef} name="loginId" autoComplete="username" placeholder="아이디" defaultValue={state.loginId} required maxLength={20} />
      </Field>
      <Field label="비밀번호">
        <TextField name="password" type="password" autoComplete="current-password" placeholder="비밀번호" required maxLength={128} />
      </Field>
      <Checkbox label="아이디 저장" checked={save} onChange={(e) => setSave(e.target.checked)} />
      {state.error && (
        <p role="alert" className="text-[13px] text-erp-off">
          {state.error}
        </p>
      )}
      <div className="grid">
        <Button type="submit" disabled={pending}>
          {pending ? "로그인 중" : "로그인"}
        </Button>
      </div>
      {/* 주소는 데모(auth/find.html#id·#pw, auth/signup.html)와 같다. 가입 화면(/signup)은 있고, 찾기 화면은 다음 작업. */}
      <p className="flex items-center justify-center gap-[10px] text-[14px]">
        <Link href="/find#id" className={QUIET}>아이디 찾기</Link>
        <span className="h-[11px] w-px bg-[#d9d9d9]" />
        <Link href="/find#pw" className={QUIET}>비밀번호 찾기</Link>
        <span className="h-[11px] w-px bg-[#d9d9d9]" />
        <Link href="/signup" className="font-semibold text-erp-brand transition-colors duration-150 ease-out hover:text-erp-ink">사업자회원가입</Link>
      </p>
    </form>
  );
}
