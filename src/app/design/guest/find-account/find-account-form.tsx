"use client";

import { useEffect, useState } from "react";
import { GuestButton } from "../guest-ui";
import { FIELD_BUTTON, INPUT, INPUT_BOX, LABEL, SUBMIT } from "../guest-form";
import { HOVER } from "../theme";

// 인증번호 유효 시간(초). 시안의 「남은 시간 02:41」은 3분에서 줄어든 모습이다.
const CODE_SECONDS = 180;

const TABS = [
  { key: "id", label: "ID 찾기", submit: "아이디 확인" },
  { key: "password", label: "비밀번호 찾기", submit: "비밀번호 재설정" },
] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

// 디자인 샘플이라 인증번호 발송·확인 요청은 보내지 않는다. 받기를 누르면 남은 시간만 센다.
// 시안은 ID 찾기 탭만 있다. 비밀번호 찾기는 이름 대신 아이디를 받는 것으로 두었다.
export function FindAccountForm() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("id");
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!left) return;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const current = TABS.find((t) => t.key === tab)!;

  return (
    <>
      <div role="tablist" className="flex">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => {
              setTab(t.key);
              setLeft(null);
            }}
            className={`flex-1 border-b-2 p-[10px] text-[22px] leading-[1.4] font-medium ${HOVER} ${
              tab === t.key ? "border-guest-ink text-guest-ink" : "border-[#999] text-[#999] hover:text-guest-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* 탭을 바꾸면 key 로 폼을 새로 그려 입력값을 비운다. */}
      <form key={tab} role="tabpanel" className="flex flex-col gap-[24px]" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-[16px]">
          {tab === "id" ? (
            <Field label="이름">
              <span className={INPUT_BOX}>
                <input name="name" autoComplete="name" placeholder="이름을 입력해 주세요" className={INPUT} />
              </span>
            </Field>
          ) : (
            <Field label="아이디">
              <span className={INPUT_BOX}>
                <input name="loginId" autoComplete="username" placeholder="아이디를 입력해 주세요" className={INPUT} />
              </span>
            </Field>
          )}
          <Field label="휴대폰 번호">
            <span className={INPUT_BOX}>
              <input name="phone" type="tel" inputMode="numeric" autoComplete="tel" placeholder="숫자만 입력해 주세요" className={INPUT} />
            </span>
          </Field>
          <div className="flex flex-col gap-[10px]">
            <label htmlFor="verification-code" className={LABEL}>
              인증번호
            </label>
            <div className="flex gap-[10px]">
              <span className={`flex-1 ${INPUT_BOX}`}>
                <input id="verification-code" name="verificationCode" inputMode="numeric" autoComplete="one-time-code" placeholder="인증번호 6자리" className={INPUT} />
              </span>
              <button
                type="button"
                onClick={() => setLeft(CODE_SECONDS)}
                className={FIELD_BUTTON}
              >
                인증번호 받기
              </button>
            </div>
            {left !== null && (
              <p aria-live="polite" className="text-[15px] leading-[1.5] text-[#767676]">
                {left > 0
                  ? `남은 시간 ${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`
                  : "인증 시간이 지났습니다. 인증번호를 다시 받아 주세요."}
              </p>
            )}
          </div>
        </div>
        {/* 세 버튼을 같은 폭으로 — flex-1 은 안쪽 여백을 뺀 나머지만 나눠, 여백 있는 링크가 더 넓어진다. */}
        <div className="grid grid-cols-3 gap-[8px]">
          <button type="submit" className={SUBMIT}>
            {current.submit}
          </button>
          <GuestButton tone="soft" tall>
            회원가입
          </GuestButton>
          <GuestButton tone="line" href="/design/guest/login" arrow="back" tall>
            로그인 이동
          </GuestButton>
        </div>
        <p className="rounded-[6px] bg-guest-card px-[32px] py-[24px] text-[16px] leading-[1.4] text-guest-navy">
          휴대폰번호가 바뀌었다면 <strong className="font-semibold">고객센터 02-3847-1592</strong>로 문의해 주세요.
        </p>
      </form>
    </>
  );
}
