"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CHECKBOX, INPUT, INPUT_BOX, SUBMIT } from "../guest-form";
import { HOVER } from "../theme";

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
            className={CHECKBOX}
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
