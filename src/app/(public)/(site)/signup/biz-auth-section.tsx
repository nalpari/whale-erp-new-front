"use client";

import { useId, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { FIELD_BUTTON, INPUT, INPUT_BOX, LABEL } from "@/app/design/guest/guest-form";
import {
  BIZ_CEO_NAME_MAX,
  BIZ_MESSAGE,
  BIZ_NUMBER_INPUT_MAX,
  bizDigits,
  bizNumberInput,
  bizVerifiedLabel,
  checkBizVerify,
  dateOfMillis,
  hasBizVerifyProblem,
  missingMessage,
  sameBizVerifyValues,
} from "@/lib/biz-verification-rules";
import { BIZ_VERIFY_FAILED_MESSAGE } from "./biz-verification";
import { verifyBusiness } from "./actions";

// 필드 이름은 naming.md(BP · 점포)의 사업자정보 표기(biz_registration_number · biz_ceo_name · biz_open_date)를 그대로 따른다.
// verification 은 진위확인에 성공해 받은 토큰과 받은 시각이다(10분 만료를 화면이 판단한다). 화면 상태에만 두어,
// 떠나거나 새로 고치면 사라진다. notice 는 api 가 거절한 문구나 10분 경과 문구고, noticeField 는 그 문구를 보일 자리다
// (사업자번호 중복만 번호 칸 아래, 그 밖은 인증하기 버튼 위 한 줄). 칸을 고치거나 인증하기 · 재인증 · 지우기를 누르면 지운다.
// 사업자등록번호는 친 그대로(하이픈 포함) 두고, 검사 · 요청에는 숫자만 쓴다(bizDigits).
export type BizVerification = { token: string; verifiedAt: number };
export type BizAuthValue = {
  bizRegistrationNumber: string;
  bizCeoName: string;
  bizOpenDate: string;
  verification: BizVerification | null;
  notice?: string;
  noticeField?: "bizNumber" | null;
};
export const BIZ_AUTH_INITIAL: BizAuthValue = { bizRegistrationNumber: "", bizCeoName: "", bizOpenDate: "", verification: null };

// 빈 네이티브 <input type="date">가 한국어 로캘로 그리는 "연도. 월. 일."은 브라우저가 그리는 글자라 placeholder
// 속성으로도 CSS content 로도 글자(점 유무)를 바꿀 수 없다 — 색만 다른 칸의 placeholder(#999, guest-form.ts 의
// INPUT)에 맞춘다. 값이 비어 있을 때만 :placeholder-shown 이 걸려, 날짜를 고르면 원래 글자색으로 돌아간다(2026-10-16).
const DATE_PLACEHOLDER_COLOR =
  "[&:placeholder-shown::-webkit-datetime-edit-fields-wrapper]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-text]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-year-field]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-month-field]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-day-field]:text-[#999]";
/** 인증을 마쳐 잠긴 칸 — 바탕을 상자보다 한 단계 옅게 두지 않고 글자색만 낮춰 입력할 수 없는 칸임을 알린다 */
const LOCKED_INPUT = `${INPUT} read-only:text-guest-sub`;
const ERROR_TEXT = "text-[14px] leading-[1.5] text-[#e93737]";

/** 인증 요청을 보내는 시각 — 클릭 처리에서만 부른다(렌더 중에 재지 않는다) */
const requestedAt = () => Date.now();

const valuesOf = (v: BizAuthValue) => ({ bizNumber: v.bizRegistrationNumber, ceoName: v.bizCeoName, openDate: v.bizOpenDate });

// 선택 칸이라 필수 표시(*)는 없다 — design/guest/sign-up 의 Field(required 기본 false)와 같다. 칸 바로 아래 문구(형식 오류 ·
// 중복)는 칸과 간격 없이 붙인다(오류 문구가 칸 사이에 빈 줄을 만들지 않게 — 2026-10-22 사용자 지정).
function OptionalField({ label, message, messageId, children }: { label: string; message?: string; messageId: string; children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <label className="flex flex-col gap-[10px]">
        <span className={LABEL}>{label}</span>
        {children}
      </label>
      {message ? (
        <span id={messageId} role="alert" className={`mt-[6px] ${ERROR_TEXT}`}>
          {message}
        </span>
      ) : null}
    </div>
  );
}

// 사업자정보 인증 (선택). 네 화면(회원가입 · 점포 · MY PAGE · 플랫폼 BP 관리) 공통 정책 manyfast S-VRNTHD(2026-10-22 사용자
// 확정)를 따른다 — 관리자 웹의 components/site/biz-verification-box.tsx 와 같은 구성 · 같은 문구를, 이 화면은 1팀 비로그인
// 폼 규격(guest-form.ts)으로 그린다. 상자 머리(제목 · 인증 상태) → 세 칸(형식 오류 · 중복은 칸 아래) → 버튼 위 한 줄(빈 칸 묶음 ·
// 그 밖의 실패) → 버튼 → 안내.
// "인증하기"는 빈 칸 · 형식을 먼저 보고, 통과하면 서버 액션(verifyBusiness)으로 api 진위확인을 부른다. api 가 중복 검사 →
// 국세청 확인을 하고 10분짜리 토큰을 주면 「인증 완료」로 바꾸고 세 칸을 잠근다. 토큰은 가입할 때 signup-form 이 싣는다.
// "재인증"은 값은 그대로 둔 채 칸을 다시 열고(인증하기로 다시 확인하면 다시 잠긴다), "지우기"는 세 값과 인증을 비운다.
// onChange 는 setState 를 그대로 받는다 — 늦게 온 응답을 그 사이 바뀐 값이 아니라 지금 값에 맞춰 적용하려고 함수형 갱신을 쓴다.
// onVerifyingChange 는 폼이 확인 중 제출을 막는 데 쓴다(토큰을 받기 전에 가입되면 사업자정보가 빠진다).
export function BizAuthSection({
  value,
  onChange,
  onVerifyingChange,
}: {
  value: BizAuthValue;
  onChange: Dispatch<SetStateAction<BizAuthValue>>;
  onVerifyingChange?: (verifying: boolean) => void;
}) {
  const ids = useId();
  const [triedVerify, setTriedVerify] = useState(false);
  const [bizNumberTouched, setBizNumberTouched] = useState(false);
  // 지우기마다 올려 입력칸을 새로 그린다 — 개업일자는 날짜가 완성되기 전 글자를 입력칸 안에만 들고 있어서,
  // 값("")이 그대로면 치던 글자가 남는다.
  const [clearCount, setClearCount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  // 연타해도 요청은 하나만 — state 는 다음 렌더까지 바뀌지 않아 같은 틱의 두 번째 클릭을 못 막는다.
  const verifyingRef = useRef(false);

  const verified = Boolean(value.verification);
  const locked = verified || verifying;
  const check = checkBizVerify(valuesOf(value));
  // 빈 칸 묶음은 인증하기를 누른 뒤에만, 번호 형식 오류는 번호 칸을 한 번 벗어난 뒤로는 바로 보인다(2026-10-12 피드백).
  const missing = triedVerify && !verified ? check.missing : [];
  const showFormat = (triedVerify || bizNumberTouched) && !verified;
  const fieldError = {
    bizNumber: (showFormat ? check.format.bizNumber : undefined) ?? (value.noticeField === "bizNumber" ? value.notice : undefined),
    ceoName: triedVerify && !verified ? check.format.ceoName : undefined,
    openDate: triedVerify && !verified ? check.format.openDate : undefined,
  };
  const lineMessage = missingMessage(missing) ?? (value.noticeField === "bizNumber" ? undefined : value.notice);
  const lineId = `${ids}-line`;
  const messageId = (key: "bizNumber" | "ceoName" | "openDate") => `${ids}-${key}`;
  const describe = (key: "bizNumber" | "ceoName" | "openDate") => (fieldError[key] ? messageId(key) : missing.includes(key) ? lineId : undefined);
  const invalid = (key: "bizNumber" | "ceoName" | "openDate") => Boolean(fieldError[key]) || missing.includes(key) || undefined;
  // 한 글자라도 들어갔거나 인증했으면 지우기를 보인다(S-VRNTHD — 입력값이 있을 때만).
  const showClear = verified || Boolean(value.bizRegistrationNumber || value.bizCeoName || value.bizOpenDate);
  const verifiedDate = value.verification ? dateOfMillis(value.verification.verifiedAt) : "";

  function changeVerifying(next: boolean) {
    verifyingRef.current = next;
    setVerifying(next);
    onVerifyingChange?.(next);
  }

  function edit(patch: Partial<BizAuthValue>) {
    onChange({ ...value, ...patch, notice: undefined, noticeField: undefined });
  }

  async function handleVerifyClick() {
    if (verifyingRef.current) return;
    setTriedVerify(true);
    onChange((v) => ({ ...v, notice: undefined, noticeField: undefined }));
    if (hasBizVerifyProblem(check)) return;
    const requested = value;
    // 토큰의 10분은 api 가 요청을 처리할 때부터 센다. 응답을 받은 시각으로 세면 왕복만큼 늦게 만료돼, 끝자락에 낸 가입이
    // api 에서 400 이 된다 — 요청을 보내기 전 시각으로 센다.
    const startedAt = requestedAt();
    changeVerifying(true);
    const result = await verifyBusiness({
      bizRegistrationNumber: bizDigits(requested.bizRegistrationNumber),
      bizCeoName: requested.bizCeoName.trim(),
      bizOpenDate: requested.bizOpenDate,
    }).catch((e) => {
      // 서버 액션 호출 자체가 실패했을 때만 여기로 온다(네트워크 끊김, 배포로 액션 ID 가 바뀜) — 액션은 자기 실패를 {ok:false} 로 돌려준다.
      console.error("[signup] verifyBusiness request failed", e);
      return { ok: false as const, message: BIZ_VERIFY_FAILED_MESSAGE, field: null };
    });
    changeVerifying(false);
    // 확인 중엔 칸이 잠겨 있지만, 그 사이 폼이 값을 바꿨으면(가입 거절로 인증을 푼 경우 등) 이 응답은 버린다 —
    // 받은 토큰이 보이는 값과 어긋난다.
    onChange((v) => {
      if (!sameBizVerifyValues(valuesOf(v), valuesOf(requested))) return v;
      return result.ok
        ? { ...v, verification: { token: result.verificationToken, verifiedAt: startedAt }, notice: undefined, noticeField: undefined }
        : { ...v, notice: result.message, noticeField: result.field };
    });
  }

  function handleReverifyClick() {
    setTriedVerify(false);
    onChange({ ...value, verification: null, notice: undefined, noticeField: undefined });
  }

  function handleClearClick() {
    setTriedVerify(false);
    setBizNumberTouched(false);
    setClearCount((n) => n + 1);
    onChange(BIZ_AUTH_INITIAL);
  }

  return (
    // 상자 바탕은 관리자 웹 인증 상자(biz-verification-box.tsx)와 같은 #f8f9fb(erp-thead-bg)다 — 네 화면이 같은 색으로 보이게(2026-10-22 사용자 지정).
    // guest-card(#f5f8fb)는 푸른 기가 있어 점포 화면의 상자와 달라 보였다.
    <section data-biz-auth aria-label="사업자 번호 인증" className="flex flex-col gap-[20px] rounded-[6px] border border-guest-line bg-erp-thead-bg p-[24px]">
      <div className="flex items-center justify-between gap-[16px]">
        <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">
          사업자정보 인증<span className="ml-[10px] text-[15px] font-normal text-[#767676]">(선택)</span>
        </h2>
        <span className={`text-[16px] font-medium ${verified ? "text-guest-navy" : "text-[#e93737]"}`}>{bizVerifiedLabel(verified, verifiedDate)}</span>
      </div>
      {/* 인증하기를 누르면 상자 머리의 상태가 바뀐다. 실패는 role="alert" 로 읽히니 성공도 읽히게 한다 — 화면 낭독기는 이미 있던
          live 영역의 글자가 바뀔 때만 읽는 경우가 많아, 늘 두는 칸 하나에 글자만 넣는다. */}
      <span role="status" className="sr-only">
        {verified ? "사업자정보 인증이 완료되었습니다." : ""}
      </span>
      <div key={clearCount} className="grid grid-cols-3 items-start gap-[16px]">
        <OptionalField label="사업자등록번호" message={fieldError.bizNumber} messageId={messageId("bizNumber")}>
          {/* 숫자와 하이픈만 받는다 — 105-87-63602 처럼 하이픈을 넣어 치거나 붙여 넣어도 12자까지 들어가고, 검사 · 요청에는 숫자만 쓴다 */}
          <span className={INPUT_BOX}>
            <input
              value={value.bizRegistrationNumber}
              onChange={(e) => edit({ bizRegistrationNumber: bizNumberInput(e.target.value) })}
              onBlur={() => setBizNumberTouched(true)}
              readOnly={locked}
              inputMode="numeric"
              maxLength={BIZ_NUMBER_INPUT_MAX}
              placeholder="숫자 10자리"
              aria-invalid={invalid("bizNumber")}
              aria-describedby={describe("bizNumber")}
              className={LOCKED_INPUT}
            />
          </span>
        </OptionalField>
        <OptionalField label="대표자명" message={fieldError.ceoName} messageId={messageId("ceoName")}>
          <span className={INPUT_BOX}>
            <input
              value={value.bizCeoName}
              onChange={(e) => edit({ bizCeoName: e.target.value })}
              readOnly={locked}
              maxLength={BIZ_CEO_NAME_MAX}
              placeholder="대표자 이름"
              aria-invalid={invalid("ceoName")}
              aria-describedby={describe("ceoName")}
              className={LOCKED_INPUT}
            />
          </span>
        </OptionalField>
        <OptionalField label="개업일자" message={fieldError.openDate} messageId={messageId("openDate")}>
          <span className={INPUT_BOX}>
            <input
              value={value.bizOpenDate}
              onChange={(e) => edit({ bizOpenDate: e.target.value })}
              type="date"
              readOnly={locked}
              aria-label="개업일자"
              aria-invalid={invalid("openDate")}
              aria-describedby={describe("openDate")}
              // 잠긴 날짜 칸은 눌러도 달력이 뜨지 않게 막는다 — readOnly 만으로는 일부 Safari 가 날짜판을 연다
              className={`${LOCKED_INPUT} ${DATE_PLACEHOLDER_COLOR} ${locked ? "pointer-events-none" : ""}`}
            />
          </span>
        </OptionalField>
      </div>
      {lineMessage ? (
        <span id={lineId} role="alert" className={ERROR_TEXT}>
          {lineMessage}
        </span>
      ) : null}
      <div className="flex gap-[8px]">
        <button type="button" onClick={verified ? handleReverifyClick : handleVerifyClick} disabled={verifying} className={FIELD_BUTTON}>
          {verifying ? "인증 중…" : verified ? "재인증" : "인증하기"}
        </button>
        {showClear ? (
          <button type="button" onClick={handleClearClick} disabled={verifying} className={FIELD_BUTTON}>
            지우기
          </button>
        ) : null}
      </div>
      <p className="text-[15px] leading-[1.5] text-guest-sub">{BIZ_MESSAGE.GUIDE}</p>
    </section>
  );
}
