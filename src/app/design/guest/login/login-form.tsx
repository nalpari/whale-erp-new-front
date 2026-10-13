"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HOVER } from "../theme";

// 로그인 입력칸. 테두리는 처음부터 깔아 두고 포커스 때 색만 남색으로 바꾼다.
export const INPUT_BOX = `flex h-[56px] items-center gap-[10px] rounded-[6px] border border-[#ebebeb] bg-white px-[16px] focus-within:border-guest-navy ${HOVER}`;
export const INPUT =
  "min-w-0 flex-1 bg-transparent text-[15px] leading-[1.5] text-guest-ink outline-none! placeholder:text-[#999] placeholder:tracking-[-0.002em]";
// 폼의 주 버튼(66px 남색). 계정 찾기의 「아이디 확인」도 같은 모양이다.
export const SUBMIT =
  "h-[66px] rounded-[6px] border border-guest-navy bg-guest-navy text-[18px] leading-[1.5] font-semibold tracking-normal text-white hover:bg-white hover:text-guest-navy active:scale-[0.99] [transition:color_250ms_ease,background-color_250ms_ease,scale_150ms_cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";
const ICON_BUTTON = "flex size-[16px] items-center justify-center";

// 디자인 샘플이라 로그인 요청은 보내지 않는다. 1팀 관리자 로그인 API 가 생기면 서버 액션으로 잇는다.
export function LoginForm() {
  const [loginId, setLoginId] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="flex flex-col gap-[24px]" onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-[10px]">
        <label className={INPUT_BOX}>
          <span className="sr-only">아이디</span>
          <input
            name="loginId"
            autoComplete="username"
            placeholder="User ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            className={INPUT}
          />
          {loginId && (
            <button type="button" aria-label="아이디 지우기" onClick={() => setLoginId("")} className={ICON_BUTTON}>
              <Image src="/guest/login/clear.svg" alt="" width={16} height={16} />
            </button>
          )}
        </label>
        <label className={INPUT_BOX}>
          <span className="sr-only">비밀번호</span>
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            className={INPUT}
          />
          {/* 시안은 눈 모양 두 개를 나란히 둔 변형 모음이다. 지금 상태를 바꾸는 쪽 하나만 보인다. */}
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
      </div>
      <button
        type="submit"
        className={SUBMIT}
      >
        LOGIN
      </button>
      <div className="flex items-center justify-between text-[15px] leading-[1.5] font-medium text-[#5e697b]">
        <label className="flex items-center gap-[8px]">
          <input
            type="checkbox"
            name="keepSignedIn"
            className={`size-[20px] appearance-none rounded-[4px] border border-[#aab4c4] bg-white bg-center bg-no-repeat checked:border-guest-navy checked:bg-guest-navy checked:bg-[url(/icons/check.svg)] ${HOVER}`}
          />
          로그인 상태 유지
        </label>
        <Link href="/design/guest/find-account" className={`hover:text-guest-navy ${HOVER}`}>
          아이디/비밀번호 찾기
        </Link>
      </div>
    </form>
  );
}
