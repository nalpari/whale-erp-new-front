"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { INPUT, INPUT_BOX, LABEL, SUBMIT } from "@/app/design/guest/guest-form";
import { SITE_ROUTES } from "@/app/design/guest/guest-routes";
import { GuestButton } from "@/app/design/guest/guest-ui";
import { HOVER } from "@/app/design/guest/theme";
import { findLoginId, issueTemporaryPassword, type FindLoginIdState, type TemporaryPasswordState } from "./actions";

// 모양은 Figma 「아이디/비밀번호 찾기」 샘플(design/guest/find-account/find-account-form.tsx)의 폼 규격(guest-form.ts)을 쓴다.
// 칸은 시안의 휴대폰 인증 대신 정책대로 이름·이메일(비밀번호는 아이디까지)이다(okf/auth.md 계정 찾기).
// #id · #pw 해시로 탭을 고른다(데모 auth/find.html).
const TABS = [
  { key: "id", label: "ID 찾기" },
  { key: "pw", label: "비밀번호 찾기" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const tabOf = (hash: string): Tab => (hash === "#pw" ? "pw" : "id");

// 로그인 폼과 같은 오류 글자. #e93737 은 위험 문구에만 쓰는 Figma 색이다(DESIGN.md).
const ERROR = "text-[15px] text-[#e93737]";
const RESULT = "flex flex-col gap-[10px] rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy";

export function FindForm() {
  // 해시는 서버가 모른다. 첫 렌더는 ID 탭으로 그리고 붙은 뒤 해시를 읽는다 — 렌더 중에 읽으면 하이드레이션이 어긋난다.
  const [tab, setTab] = useState<Tab>("id");
  useEffect(() => {
    const sync = () => setTab(tabOf(location.hash));
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const select = (next: Tab) => {
    setTab(next);
    // 기록을 쌓지 않고 해시만 바꾼다 — 새로 고쳐도 같은 탭이고, 뒤로 가기는 앞 화면으로 간다.
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
    <>
      <div role="tablist" aria-label="찾을 항목" onKeyDown={handleKeyDown} className="flex">
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
              className={`flex-1 border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${HOVER} ${
                on ? "border-guest-ink text-guest-ink" : "border-[#999] text-[#999] hover:text-guest-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {/* 탭을 바꾸면 패널을 새로 그려 앞 탭의 입력 · 결과 · 오류를 버린다. */}
      <div id="find-panel" role="tabpanel" aria-labelledby={`find-tab-${tab}`}>
        {tab === "id" ? <LoginIdPanel key="id" onPasswordTab={() => select("pw")} /> : <PasswordPanel key="pw" />}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>{label}</span>
      <span className={INPUT_BOX}>{children}</span>
    </label>
  );
}

// 시안의 세 버튼 줄 — 주 동작 · 회원가입 · 로그인 이동. 같은 폭으로 둔다(flex-1 은 여백 있는 링크를 더 넓힌다).
function Actions({ submit }: { submit?: ReactNode }) {
  return (
    <div className={`grid gap-[8px] ${submit ? "grid-cols-3" : "grid-cols-2"}`}>
      {submit}
      <GuestButton tone="soft" href={SITE_ROUTES.signUp} tall>
        회원가입
      </GuestButton>
      <GuestButton tone="line" href={SITE_ROUTES.login} arrow="back" tall>
        로그인 이동
      </GuestButton>
    </div>
  );
}

// 칸이 다 차고 형식이 맞아야 제출 버튼이 열린다(목업 — 하나라도 비어 있으면 누를 수 없다).
function useFilled() {
  const [filled, setFilled] = useState(false);
  return [filled, (e: React.FormEvent<HTMLFormElement>) => setFilled(e.currentTarget.checkValidity())] as const;
}

function LoginIdPanel({ onPasswordTab }: { onPasswordTab: () => void }) {
  const [state, action, pending] = useActionState<FindLoginIdState, FormData>(findLoginId, {});
  const [filled, handleInput] = useFilled();

  if (state.maskedLoginId)
    return (
      <div className="flex flex-col gap-[24px]">
        <div role="status" className={RESULT}>
          <p>{state.name}님의 아이디를 확인했습니다.</p>
          <p className="text-[28px] leading-[1.2] font-bold text-guest-ink">{state.maskedLoginId}</p>
          <p className="text-[15px] text-[#767676]">앞 2자와 뒤 1자만 보여 드립니다.</p>
        </div>
        <Actions />
        <button type="button" onClick={onPasswordTab} className={`text-[15px] leading-[1.5] font-medium text-[#5e697b] hover:text-guest-navy ${HOVER}`}>
          비밀번호도 잊으셨나요?
        </button>
      </div>
    );

  return (
    <form action={action} onInput={handleInput} className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[16px]">
        <Field label="이름">
          <input name="name" autoComplete="name" placeholder="이름을 입력해 주세요" defaultValue={state.name} required maxLength={20} className={INPUT} />
        </Field>
        <Field label="이메일">
          <input name="email" type="email" autoComplete="email" placeholder="가입할 때 등록한 이메일" defaultValue={state.email} required maxLength={254} className={INPUT} />
        </Field>
      </div>
      {state.error && (
        <p role="alert" className={ERROR}>
          {state.error}
        </p>
      )}
      <Actions
        submit={
          <button type="submit" disabled={!filled || pending} className={`${SUBMIT} disabled:pointer-events-none disabled:opacity-40`}>
            {pending ? "확인 중" : "아이디 확인"}
          </button>
        }
      />
    </form>
  );
}

function PasswordPanel() {
  const [state, action, pending] = useActionState<TemporaryPasswordState, FormData>(issueTemporaryPassword, {});
  const [filled, handleInput] = useFilled();

  // api 는 계정이 있는지 드러내지 않는다. 일치하지 않았거나, 메일이 나가지 않았거나, 응답이 10초를 넘겨도 이 안내가 뜬다.
  if (state.sent)
    return (
      <div className="flex flex-col gap-[24px]">
        <div role="status" className={RESULT}>
          <p className="text-[20px] font-semibold text-guest-ink">메일을 확인해 주세요</p>
          <p>
            입력한 이름·아이디·이메일이 맞으면 등록된 이메일로 임시 비밀번호를 보냈습니다.
            <br />
            임시 비밀번호는 1시간 동안만 쓸 수 있습니다.
          </p>
        </div>
        <Actions />
      </div>
    );

  return (
    <form action={action} onInput={handleInput} className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[16px]">
        <Field label="이름">
          <input name="name" autoComplete="name" placeholder="이름을 입력해 주세요" defaultValue={state.name} required maxLength={20} className={INPUT} />
        </Field>
        <Field label="아이디">
          <input name="loginId" autoComplete="username" placeholder="아이디를 입력해 주세요" defaultValue={state.loginId} required maxLength={20} className={INPUT} />
        </Field>
        <Field label="이메일">
          <input name="email" type="email" autoComplete="email" placeholder="가입할 때 등록한 이메일" defaultValue={state.email} required maxLength={254} className={INPUT} />
        </Field>
      </div>
      {state.error && (
        <p role="alert" className={ERROR}>
          {state.error}
        </p>
      )}
      <Actions
        submit={
          <button type="submit" disabled={!filled || pending} className={`${SUBMIT} disabled:pointer-events-none disabled:opacity-40`}>
            {pending ? "보내는 중" : "임시 비밀번호 받기"}
          </button>
        }
      />
    </form>
  );
}
