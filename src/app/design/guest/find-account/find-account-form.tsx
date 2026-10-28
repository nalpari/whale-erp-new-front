"use client";

import { useState, type ReactNode } from "react";
import { GuestButton } from "../guest-ui";
import { INPUT, INPUT_BOX, LABEL, SUBMIT } from "../guest-form";
import { HOVER } from "../theme";
import { FindAccountHeading } from "./find-account-screen";

// 실제 찾기 화면((site)/find/find-form.tsx)과 같은 모양이다 — 해시로 탭 고르기 · 키보드 탭 이동 · 오류 안내는 없다.
// 칸은 시안의 휴대폰 인증 대신 정책대로 이름 · 이메일(비밀번호는 아이디까지).
// 디자인 샘플이라 요청은 보내지 않는다. 칸을 채워 제출하면 그 탭의 예시 결과만 보인다.
const TABS = [
  { key: "id", label: "ID 찾기", submit: "아이디 확인", lead: "회원가입 시 등록한 이름, 이메일 주소를 입력해 주세요." },
  { key: "password", label: "비밀번호 찾기", submit: "임시 비밀번호 받기", lead: "회원가입 시 등록한 이름, 아이디, 이메일 주소를 입력해 주세요." },
] as const;
type Tab = (typeof TABS)[number]["key"];

const RESULT = "flex flex-col gap-[10px] rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>{label}</span>
      <span className={INPUT_BOX}>{children}</span>
    </label>
  );
}

export function FindAccountForm() {
  const [tab, setTab] = useState<Tab>("id");
  const [done, setDone] = useState(false);
  const current = TABS.find((t) => t.key === tab)!;

  const select = (key: Tab) => {
    setTab(key);
    setDone(false);
  };

  return (
    <>
      <FindAccountHeading lead={current.lead} />
      <div role="tablist" className="flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => select(t.key)}
            className={`flex-1 border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${HOVER} ${
              tab === t.key ? "border-guest-ink text-guest-ink" : "border-[#999] text-[#999] hover:text-guest-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* 탭을 바꾸면 key 로 폼을 새로 그려 입력값을 비운다. */}
      <form
        key={tab}
        role="tabpanel"
        className="flex flex-col gap-[24px]"
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        {done ? (
          tab === "id" ? (
            <div role="status" className={RESULT}>
              <p>정하윤님의 아이디를 확인했습니다.</p>
              <p className="text-[28px] leading-[1.2] font-bold text-guest-ink">ha******1</p>
              <p className="text-[15px] text-[#767676]">앞 2자와 뒤 1자만 보여 드립니다.</p>
            </div>
          ) : (
            <div role="status" className={RESULT}>
              <p className="text-[20px] font-semibold text-guest-ink">이메일을 확인해 주세요.</p>
              <p>
                입력하신 이메일 주소로 임시 비밀번호를 발송했습니다.
                <br />
                임시 비밀번호는 발급 후 1시간 동안 사용할 수 있습니다.
              </p>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-[16px]">
            <Field label="이름">
              <input name="name" autoComplete="name" placeholder="이름을 입력해 주세요." required maxLength={20} className={INPUT} />
            </Field>
            {tab === "password" && (
              <Field label="아이디">
                <input name="loginId" autoComplete="username" placeholder="아이디를 입력해 주세요." required maxLength={20} className={INPUT} />
              </Field>
            )}
            <Field label="이메일">
              <input name="email" type="email" autoComplete="email" placeholder="가입 시 등록한 이메일 주소를 입력해 주세요." required maxLength={254} className={INPUT} />
            </Field>
          </div>
        )}
        {/* 세 버튼을 같은 폭으로 — flex-1 은 안쪽 여백을 뺀 나머지만 나눠, 여백 있는 링크가 더 넓어진다. 결과 화면에서는 주 동작이 빠진다. */}
        <div className={`grid gap-[8px] ${done ? "grid-cols-2" : "grid-cols-3"}`}>
          {!done && (
            <button type="submit" className={SUBMIT}>
              {current.submit}
            </button>
          )}
          <GuestButton tone="soft" href="/design/guest/sign-up" tall>
            회원가입
          </GuestButton>
          <GuestButton tone="line" href="/design/guest/login" arrow="back" tall>
            로그인 이동
          </GuestButton>
        </div>
        {done && tab === "id" && (
          <button type="button" onClick={() => select("password")} className={`text-[15px] leading-[1.5] font-medium text-[#5e697b] hover:text-guest-navy ${HOVER}`}>
            비밀번호도 잊으셨나요?
          </button>
        )}
      </form>
    </>
  );
}
