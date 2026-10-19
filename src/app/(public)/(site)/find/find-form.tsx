"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Button, Field, TextField } from "@/components/common";
import { findLoginId, issueTemporaryPassword, type FindLoginIdState, type TemporaryPasswordState } from "./actions";

// 로그인 화면의 「아이디 찾기」·「비밀번호 찾기」가 #id · #pw 로 탭을 고르고 들어온다(데모 auth/find.html).
const TABS = [
  { key: "id", label: "아이디 찾기" },
  { key: "pw", label: "비밀번호 찾기" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const tabOf = (hash: string): Tab => (hash === "#pw" ? "pw" : "id");

const ERROR = "text-[13px] text-erp-off";
const NOTE = "text-[13px] leading-[1.6] text-erp-label";

export function FindForm() {
  // 해시는 서버가 모른다. 첫 렌더는 아이디 탭으로 그리고 붙은 뒤 해시를 읽는다 — 렌더 중에 읽으면 하이드레이션이 어긋난다.
  const [tab, setTab] = useState<Tab>("id");
  useEffect(() => {
    const sync = () => setTab(tabOf(location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const select = (next: Tab) => {
    setTab(next);
    // 기록을 쌓지 않고 해시만 바꾼다 — 새로 고쳐도 같은 탭이고, 뒤로 가기는 로그인 화면으로 간다.
    history.replaceState(null, "", `#${next}`);
  };

  // 좌우 화살표 · Home · End 로 옮겨 고르고 그 탭에 포커스를 둔다. Tab 키로는 고른 탭 하나에만 선다(roving tabindex).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const at = TABS.findIndex((t) => t.key === tab);
    const next =
      e.key === "ArrowRight" ? (at + 1) % TABS.length : e.key === "ArrowLeft" ? (at - 1 + TABS.length) % TABS.length : e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : -1;
    if (next < 0) return;
    e.preventDefault();
    select(TABS[next].key);
    document.getElementById(`find-tab-${TABS[next].key}`)?.focus();
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-[6px]">
        <h1 className="text-[18px] font-semibold">아이디·비밀번호 찾기</h1>
        <p className={NOTE}>가입할 때 등록한 이름과 이메일로 확인합니다.</p>
      </div>
      <div role="tablist" aria-label="찾을 항목" onKeyDown={handleKeyDown} className="grid grid-cols-2 border-b border-erp-thead-line">
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`find-tab-${t.key}`}
              aria-selected={on}
              aria-controls="find-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => select(t.key)}
              className={`h-[42px] border-b-2 text-[14px] font-medium transition-colors duration-150 ease-out ${
                on ? "border-erp-brand text-erp-ink" : "border-transparent text-erp-label hover:text-erp-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {/* 탭을 바꾸면 패널을 새로 그려 앞 탭의 결과 · 오류를 버린다. */}
      <div id="find-panel" role="tabpanel" aria-labelledby={`find-tab-${tab}`}>
        {tab === "id" ? <LoginIdPanel key="id" onPasswordTab={() => select("pw")} /> : <PasswordPanel key="pw" />}
      </div>
      <p className="flex items-center justify-center gap-[10px] text-[14px]">
        <Link href="/login" className="text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink">로그인으로 돌아가기</Link>
        <span className="h-[11px] w-px bg-[#d9d9d9]" />
        <Link href="/signup" className="font-semibold text-erp-brand transition-colors duration-150 ease-out hover:text-erp-ink">회원가입</Link>
      </p>
    </div>
  );
}

// 칸이 다 차고 형식이 맞아야 제출 버튼이 열린다(목업 — 둘 중 하나라도 비어 있으면 찾기를 누를 수 없다).
function useFilled() {
  const [filled, setFilled] = useState(false);
  return [filled, (e: React.FormEvent<HTMLFormElement>) => setFilled(e.currentTarget.checkValidity())] as const;
}

function LoginIdPanel({ onPasswordTab }: { onPasswordTab: () => void }) {
  const [state, action, pending] = useActionState<FindLoginIdState, FormData>(findLoginId, {});
  const [filled, handleInput] = useFilled();

  if (state.maskedLoginId)
    return (
      <div className="flex flex-col gap-[18px]">
        <div className="flex flex-col items-center gap-[10px] rounded-[2px] bg-erp-thead-bg px-[24px] py-[24px] text-center">
          <p className="text-[14px]">{state.name}님의 아이디를 확인했습니다.</p>
          <p className="text-[22px] font-semibold">{state.maskedLoginId}</p>
          <p className={NOTE}>앞 2자와 뒤 1자만 보여 드립니다.</p>
        </div>
        <div className="grid">
          <Button href="/login">로그인하러 가기</Button>
        </div>
        <button type="button" onClick={onPasswordTab} className="text-[14px] text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink">
          비밀번호도 잊으셨나요?
        </button>
      </div>
    );

  return (
    <form action={action} onInput={handleInput} className="flex flex-col gap-[18px]">
      <Field label="이름" required>
        <TextField name="name" autoComplete="name" placeholder="이름" defaultValue={state.name} required maxLength={20} />
      </Field>
      <Field label="이메일" required>
        <TextField name="email" type="email" autoComplete="email" placeholder="이메일" defaultValue={state.email} required maxLength={254} />
      </Field>
      {state.error && (
        <p role="alert" className={ERROR}>
          {state.error}
        </p>
      )}
      <div className="grid">
        <Button type="submit" disabled={!filled || pending}>
          {pending ? "찾는 중" : "아이디 찾기"}
        </Button>
      </div>
    </form>
  );
}

function PasswordPanel() {
  const [state, action, pending] = useActionState<TemporaryPasswordState, FormData>(issueTemporaryPassword, {});
  const [filled, handleInput] = useFilled();

  // api 는 계정이 있는지 드러내지 않는다. 일치하지 않았거나 메일이 나가지 않았어도 이 안내가 뜬다.
  if (state.sent)
    return (
      <div className="flex flex-col gap-[18px]">
        <div role="status" className="flex flex-col gap-[10px] rounded-[2px] bg-erp-thead-bg px-[24px] py-[24px]">
          <p className="text-[16px] font-semibold">메일을 확인해 주세요</p>
          <p className="text-[14px] leading-[1.6]">
            입력한 이름·아이디·이메일이 맞으면 등록된 이메일로 임시 비밀번호를 보냈습니다.
            <br />
            임시 비밀번호는 1시간 동안만 쓸 수 있습니다.
          </p>
        </div>
        <div className="grid">
          <Button href="/login">확인</Button>
        </div>
      </div>
    );

  return (
    <form action={action} onInput={handleInput} className="flex flex-col gap-[18px]">
      <Field label="이름" required>
        <TextField name="name" autoComplete="name" placeholder="이름" defaultValue={state.name} required maxLength={20} />
      </Field>
      <Field label="아이디" required>
        <TextField name="loginId" autoComplete="username" placeholder="아이디" defaultValue={state.loginId} required maxLength={20} />
      </Field>
      <Field label="이메일" required>
        <TextField name="email" type="email" autoComplete="email" placeholder="이메일" defaultValue={state.email} required maxLength={254} />
      </Field>
      {state.error && (
        <p role="alert" className={ERROR}>
          {state.error}
        </p>
      )}
      <p className={NOTE}>
        받은 뒤에도 지금 비밀번호로 로그인할 수 있습니다. 임시 비밀번호로 들어오면 새 비밀번호를 정해야 ERP 를 쓸 수 있습니다.
      </p>
      <div className="grid">
        <Button type="submit" disabled={!filled || pending}>
          {pending ? "보내는 중" : "임시 비밀번호 받기"}
        </Button>
      </div>
    </form>
  );
}
