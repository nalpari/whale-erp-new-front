"use client";

import { useId, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { FIELD_BUTTON, INPUT, INPUT_BOX, LABEL } from "@/app/design/guest/guest-form";
import { BIZ_VERIFY_FAILED_MESSAGE } from "./biz-verification";
import { validateBizRegistrationNumber } from "./validators";
import { verifyBusiness } from "./actions";

// 필드 이름은 naming.md(BP · 점포)의 사업자정보 표기(biz_registration_number · biz_ceo_name · biz_open_date)를 그대로 따른다.
// verification 은 진위확인에 성공해 받은 토큰과 받은 시각이다(10분 만료를 화면이 판단한다). 화면 상태에만 두어,
// 떠나거나 새로 고치면 사라진다. notice 는 api 가 거절한 문구나 10분 경과 문구다 — 어느 칸이 틀렸는지 모르는 안내라
// 칸 테두리를 빨갛게 하지 않는다. 칸을 고치거나 인증하기·재인증·지우기를 누르면 지운다.
export type BizVerification = { token: string; verifiedAt: number };
export type BizAuthValue = {
  bizRegistrationNumber: string;
  bizCeoName: string;
  bizOpenDate: string;
  verification: BizVerification | null;
  notice?: string;
};
export const BIZ_AUTH_INITIAL: BizAuthValue = { bizRegistrationNumber: "", bizCeoName: "", bizOpenDate: "", verification: null };

// 빈 네이티브 <input type="date">가 한국어 로캘로 그리는 "연도. 월. 일."은 브라우저가 그리는 글자라 placeholder
// 속성으로도 CSS content 로도 글자(점 유무)를 바꿀 수 없다 — 색만 다른 칸의 placeholder(#999, guest-form.ts 의
// INPUT)에 맞춘다. 값이 비어 있을 때만 :placeholder-shown 이 걸려, 날짜를 고르면 원래 글자색으로 돌아간다(2026-10-16).
const DATE_PLACEHOLDER_COLOR =
  "[&:placeholder-shown::-webkit-datetime-edit-fields-wrapper]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-text]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-year-field]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-month-field]:text-[#999] [&:placeholder-shown::-webkit-datetime-edit-day-field]:text-[#999]";

const sameIdentity = (a: BizAuthValue, b: BizAuthValue) =>
  a.bizRegistrationNumber === b.bizRegistrationNumber && a.bizCeoName === b.bizCeoName && a.bizOpenDate === b.bizOpenDate;

// 선택 칸이라 필수 표시(*)는 없다 — design/guest/sign-up 의 Field(required 기본 false)와 같다.
function OptionalField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[10px]">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
}

// 사업자정보 인증 (선택). 항목은 회원가입 데모(docs/demo/src/pages/auth/signup.mjs)와 같고, 1팀 비로그인
// 폼 규격(guest-form.ts)을 쓴다 — design/guest/sign-up 의 사업자정보 인증 묶음과 같은 생김새다(2026-10-14).
// "인증하기"는 빈 칸·번호 형식을 먼저 보고, 통과하면 서버 액션(verifyBusiness)으로 api 진위확인을 부른다. api 가
// 중복 검사 → 국세청 확인을 하고 10분짜리 토큰을 주면 "인증완료"로 바꾼다. 토큰은 가입할 때 signup-form 이 싣는다.
// 확인하는 동안(verifying)은 세 칸과 버튼을 잠근다 — 값을 고치면 받은 토큰이 보이는 값과 어긋난다.
// "재인증"은 입력칸을 다시 열되 값은 그대로 두어(다른 값으로 바꿔 다시 인증받도록) 편집하게 하고,
// 인증완료 뒤의 "사용안함"은 인증한 걸 아예 안 쓰기로 한 경우라 값까지 비운 전 상태로 되돌린다(handleClearClick,
// 인증 전 칸에서 누르는 "지우기"와 같은 동작·같은 함수다 — 인증 전엔 "아직 아무것도 확정된 게 없어 지운다"는
// 뜻이라 "지우기", 인증 뒤엔 "받아 둔 인증을 안 쓰기로 한다"는 뜻이라 "사용안함"으로만 문구를 가른다, 2026-10-16).
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
  // 사업자등록번호·대표자명 두 칸이 이 오류 하나를 같이 쓴다(개업일자는 네이티브 date 입력이라 형식
  // 검사 대상이 아니다).
  const errorId = useId();
  const [triedVerify, setTriedVerify] = useState(false);
  const [bizNumberTouched, setBizNumberTouched] = useState(false);
  // 지우기마다 올려 입력칸을 새로 그린다 — 개업일자는 날짜가 완성되기 전 글자를 입력칸 안에만 들고 있어서,
  // 값("")이 그대로면 치던 글자가 남는다.
  const [clearCount, setClearCount] = useState(0);
  const [verifying, setVerifying] = useState(false);
  // 연타해도 요청은 하나만 — state 는 다음 렌더까지 바뀌지 않아 같은 틱의 두 번째 클릭을 못 막는다.
  const verifyingRef = useRef(false);

  // 약관동의 오류와 같다 — 비어 있는 항목 이름만 말하고, 한 번 시도한 뒤로는 입력할 때마다 바로 따라 바뀐다.
  // 빈 칸이 없으면 사업자등록번호 형식을 본다 — 형식이 틀린 번호로는 api 진위확인을 부르지 않는다.
  const missing = [!value.bizRegistrationNumber && "사업자등록번호", !value.bizCeoName && "대표자명", !value.bizOpenDate && "개업일자"].filter(
    (v): v is string => !!v,
  );
  const formatError = value.bizRegistrationNumber ? validateBizRegistrationNumber(value.bizRegistrationNumber) : undefined;
  const invalid = missing.length ? `${missing.join("·")} 항목을 입력해 주세요.` : formatError;
  // 형식 오류는 "인증하기"를 누르기 전에도, 번호 칸을 한 번 벗어난 뒤로는 바로 보인다(2026-10-12 피드백).
  const error = triedVerify ? invalid : bizNumberTouched ? formatError : undefined;
  // error 는 묶음 전체 문구라 그대로 두 칸에 걸면, 한 칸만 틀려도 틀리지 않은 칸까지 빨간 테두리가 된다
  // (예: 번호만 비웠는데 대표자명도 빨개짐). 칸마다 실제로 그 칸이 문제일 때만 aria-invalid 를 건다(2026-10-14 코드리뷰).
  const numberInvalid = !!error && (!value.bizRegistrationNumber || !!formatError);
  const ceoInvalid = triedVerify && !value.bizCeoName;
  // 한 글자라도 들어간 칸이 있으면 — 인증 전이라도 "지우기"로 지울 게 있다는 뜻이다(2026-10-12 피드백).
  // 오류 문구가 보일 때도 지우기를 보인다(2026-10-13 피드백) — 치는 도중인 개업일자처럼 값으로 안 잡히는 글자가 있거나,
  // 빈 칸으로 인증하기를 눌러 오류만 떠 있을 때도 한 번에 처음으로 돌릴 수 있게 한다.
  const hasInput = !!(value.bizRegistrationNumber || value.bizCeoName || value.bizOpenDate);
  const showClear = hasInput || !!error;
  // 화면 검사 오류가 먼저다. 없을 때만 api 거절 · 10분 경과 문구를 같은 자리에 보인다.
  const message = error ?? value.notice;

  function changeVerifying(next: boolean) {
    verifyingRef.current = next;
    setVerifying(next);
    onVerifyingChange?.(next);
  }

  function edit(patch: Partial<BizAuthValue>) {
    onChange({ ...value, ...patch, notice: undefined });
  }

  async function handleVerifyClick() {
    if (verifyingRef.current) return;
    setTriedVerify(true);
    onChange((v) => ({ ...v, notice: undefined }));
    if (invalid) return;
    const requested = value;
    // 토큰의 10분은 api 가 요청을 처리할 때부터 센다. 응답을 받은 시각으로 세면 왕복만큼 늦게 만료돼, 끝자락에 낸 가입이
    // api 에서 400 이 된다 — 요청을 보내기 전 시각으로 센다.
    const startedAt = Date.now();
    changeVerifying(true);
    const result = await verifyBusiness({
      bizRegistrationNumber: requested.bizRegistrationNumber,
      bizCeoName: requested.bizCeoName,
      bizOpenDate: requested.bizOpenDate,
    }).catch((e) => {
      // 서버 액션 호출 자체가 실패했을 때만 여기로 온다(네트워크 끊김, 배포로 액션 ID 가 바뀜) — 액션은 자기 실패를 {ok:false} 로 돌려준다.
      console.error("[signup] verifyBusiness request failed", e);
      return { ok: false as const, message: BIZ_VERIFY_FAILED_MESSAGE };
    });
    changeVerifying(false);
    // 확인 중엔 칸이 잠겨 있지만, 그 사이 폼이 값을 바꿨으면(가입 거절로 인증을 푼 경우 등) 이 응답은 버린다 —
    // 받은 토큰이 보이는 값과 어긋난다.
    onChange((v) => {
      if (!sameIdentity(v, requested)) return v;
      return result.ok
        ? { ...v, verification: { token: result.verificationToken, verifiedAt: startedAt }, notice: undefined }
        : { ...v, notice: result.message };
    });
  }

  function handleReverifyClick() {
    setTriedVerify(false);
    onChange({ ...value, verification: null, notice: undefined });
  }

  function handleClearClick() {
    setTriedVerify(false);
    setBizNumberTouched(false);
    setClearCount((n) => n + 1);
    onChange(BIZ_AUTH_INITIAL);
  }

  return (
    <section data-biz-auth className="flex flex-col gap-[24px]">
      <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">
        사업자정보 인증<span className="ml-[10px] text-[15px] font-normal text-[#767676]">(선택)</span>
        {/* 인증완료 뱃지는 묶음 제목 쪽에 하나만 둔다 — 안쪽 "사업자 번호 인증" 줄에도 같은 뱃지를 두면
            한 화면에 "인증완료"가 두 번 보인다(2026-10-16 디자인 반영). */}
        {value.verification ? (
          <span className="ml-[10px] rounded-[4px] bg-guest-card px-[8px] py-[2px] align-middle text-[14px] font-normal text-guest-navy">
            인증완료
          </span>
        ) : null}
      </h2>
      {/* 인증하기를 누르면 화면이 통째로 바뀐다. 실패는 role="alert" 로 읽히니 성공도 읽히게 한다 — 화면 낭독기는 이미 있던
          live 영역의 글자가 바뀔 때만 읽는 경우가 많아, 두 화면에 늘 두는 칸 하나에 글자만 넣는다. */}
      <span role="status" className="sr-only">
        {value.verification ? "사업자정보 인증이 완료되었습니다." : ""}
      </span>
      {value.verification ? (
        <div className="flex flex-col gap-[24px]">
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-[16px]">
            <OptionalField label="사업자등록번호">
              <span className={`${INPUT_BOX} has-disabled:bg-guest-card`}>
                <input value={value.bizRegistrationNumber} disabled className={INPUT} />
              </span>
            </OptionalField>
            <OptionalField label="대표자명">
              <span className={`${INPUT_BOX} has-disabled:bg-guest-card`}>
                <input value={value.bizCeoName} disabled className={INPUT} />
              </span>
            </OptionalField>
            <OptionalField label="개업일자">
              <span className={`${INPUT_BOX} has-disabled:bg-guest-card`}>
                <input value={value.bizOpenDate} disabled type="date" className={INPUT} />
              </span>
            </OptionalField>
            <div className="flex gap-[8px]">
              <button type="button" onClick={handleReverifyClick} className={FIELD_BUTTON}>
                재인증
              </button>
              <button type="button" onClick={handleClearClick} className={FIELD_BUTTON}>
                사용안함
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div key={clearCount} className="flex flex-col gap-[24px]">
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-[16px]">
            <OptionalField label="사업자등록번호">
              {/* 숫자만 받는다(연락처와 같다). 붙여 넣은 하이픈·공백도 걸러 낸다 — maxLength 를 DOM 에 두면
                  "105-87-63602"처럼 하이픈을 포함한 붙여넣기가 숫자로 거르기 전에 10자(하이픈 포함) 에서 잘려
                  뒤 숫자가 사라진다. 10자리 제한은 숫자만 남긴 뒤 slice 로 건다. */}
              <span className={INPUT_BOX}>
                <input
                  value={value.bizRegistrationNumber}
                  onChange={(e) => edit({ bizRegistrationNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  onBlur={() => setBizNumberTouched(true)}
                  disabled={verifying}
                  inputMode="numeric"
                  placeholder="숫자 10자리"
                  aria-invalid={numberInvalid || undefined}
                  aria-describedby={message ? errorId : undefined}
                  className={INPUT}
                />
              </span>
            </OptionalField>
            <OptionalField label="대표자명">
              <span className={INPUT_BOX}>
                <input
                  value={value.bizCeoName}
                  onChange={(e) => edit({ bizCeoName: e.target.value })}
                  disabled={verifying}
                  placeholder="대표자 이름"
                  aria-invalid={ceoInvalid || undefined}
                  aria-describedby={message ? errorId : undefined}
                  className={INPUT}
                />
              </span>
            </OptionalField>
            <OptionalField label="개업일자">
              <span className={INPUT_BOX}>
                <input
                  value={value.bizOpenDate}
                  onChange={(e) => edit({ bizOpenDate: e.target.value })}
                  type="date"
                  disabled={verifying}
                  aria-label="개업일자"
                  className={`${INPUT} ${DATE_PLACEHOLDER_COLOR}`}
                />
              </span>
            </OptionalField>
            <div className="flex gap-[8px]">
              <button type="button" onClick={handleVerifyClick} disabled={verifying} className={FIELD_BUTTON}>
                {verifying ? "인증 중…" : "인증하기"}
              </button>
              {showClear ? (
                <button type="button" onClick={handleClearClick} disabled={verifying} className={FIELD_BUTTON}>
                  지우기
                </button>
              ) : null}
            </div>
          </div>
          {message ? (
            <span id={errorId} role="alert" className="text-[14px] leading-[1.5] text-[#e93737]">
              {message}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
