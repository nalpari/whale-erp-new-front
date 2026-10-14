"use client";

import { useId, useState, type ReactNode } from "react";
import { FIELD_BUTTON, INPUT, INPUT_BOX, LABEL } from "@/app/design/guest/guest-form";
import { validateBizRegistrationNumber } from "./_components/validators";

// 필드 이름은 naming.md(BP · 점포)의 사업자정보 표기(biz_registration_number · biz_ceo_name · biz_open_date)를 그대로 따른다.
export type BizAuthValue = { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string; verified: boolean };
export const BIZ_AUTH_INITIAL: BizAuthValue = { bizRegistrationNumber: "", bizCeoName: "", bizOpenDate: "", verified: false };

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
// 국세청 사업자등록번호 진위확인 API 연동이 없다 — "인증하기"는 사업자등록번호·대표자명·개업일자
// 셋이 모두 채워졌을 때만 화면을 "인증완료"로 바꾸는 자리표시자다(2026-10-12 피드백).
// "재인증"은 입력칸을 다시 열되 값은 그대로 두어(다른 값으로 바꿔 다시 인증받도록) 편집하게 하고,
// "지우기"는 인증한 걸 아예 안 쓰기로 한 경우라 값까지 비운 전 상태로 되돌린다.
export function BizAuthSection({ value, onChange }: { value: BizAuthValue; onChange: (value: BizAuthValue) => void }) {
  // 사업자등록번호·대표자명 두 칸이 이 오류 하나를 같이 쓴다(개업일자는 네이티브 date 입력이라 형식
  // 검사 대상이 아니다).
  const errorId = useId();
  const [triedVerify, setTriedVerify] = useState(false);
  const [bizNumberTouched, setBizNumberTouched] = useState(false);
  // 지우기마다 올려 입력칸을 새로 그린다 — 개업일자는 날짜가 완성되기 전 글자를 입력칸 안에만 들고 있어서,
  // 값("")이 그대로면 치던 글자가 남는다.
  const [clearCount, setClearCount] = useState(0);

  // 약관동의 오류와 같다 — 비어 있는 항목 이름만 말하고, 한 번 시도한 뒤로는 입력할 때마다 바로 따라 바뀐다.
  // 빈 칸이 없으면 사업자등록번호 형식을 본다 — 형식이 틀린 번호가 "인증완료"로 가입 요청에 실리지 않게 한다.
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

  function handleVerifyClick() {
    setTriedVerify(true);
    if (invalid) return;
    onChange({ ...value, verified: true });
  }

  function handleReverifyClick() {
    setTriedVerify(false);
    onChange({ ...value, verified: false });
  }

  function handleClearClick() {
    setTriedVerify(false);
    setBizNumberTouched(false);
    setClearCount((n) => n + 1);
    onChange(BIZ_AUTH_INITIAL);
  }

  return (
    <section className="flex flex-col gap-[24px] border-t border-[#ebebeb] pt-[32px]">
      <h2 className="text-[20px] leading-[1.4] font-semibold text-[#111]">
        사업자정보 인증<span className="ml-[10px] text-[15px] font-normal text-[#767676]">(선택)</span>
      </h2>
      {value.verified ? (
        <div className="flex flex-col gap-[24px]">
          <p className="flex items-center gap-[8px] text-[16px] leading-[1.4] font-medium">
            사업자 번호 인증
            <span className="rounded-[4px] bg-guest-card px-[8px] py-[2px] text-[14px] text-guest-navy">인증완료</span>
          </p>
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
                지우기
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div key={clearCount} className="flex flex-col gap-[24px]">
          <p className="text-[16px] leading-[1.4] font-medium">사업자 번호 인증</p>
          <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end gap-[16px]">
            <OptionalField label="사업자등록번호">
              {/* 숫자만 받는다(연락처와 같다). 붙여 넣은 하이픈·공백도 걸러 낸다. */}
              <span className={INPUT_BOX}>
                <input
                  value={value.bizRegistrationNumber}
                  onChange={(e) => onChange({ ...value, bizRegistrationNumber: e.target.value.replace(/\D/g, "") })}
                  onBlur={() => setBizNumberTouched(true)}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="숫자 10자리"
                  aria-invalid={numberInvalid || undefined}
                  aria-describedby={error ? errorId : undefined}
                  className={INPUT}
                />
              </span>
            </OptionalField>
            <OptionalField label="대표자명">
              <span className={INPUT_BOX}>
                <input
                  value={value.bizCeoName}
                  onChange={(e) => onChange({ ...value, bizCeoName: e.target.value })}
                  placeholder="대표자 이름"
                  aria-invalid={ceoInvalid || undefined}
                  aria-describedby={error ? errorId : undefined}
                  className={INPUT}
                />
              </span>
            </OptionalField>
            <OptionalField label="개업일자">
              <span className={INPUT_BOX}>
                <input
                  value={value.bizOpenDate}
                  onChange={(e) => onChange({ ...value, bizOpenDate: e.target.value })}
                  type="date"
                  aria-label="개업일자"
                  className={INPUT}
                />
              </span>
            </OptionalField>
            <div className="flex gap-[8px]">
              <button type="button" onClick={handleVerifyClick} className={FIELD_BUTTON}>
                인증하기
              </button>
              {showClear ? (
                <button type="button" onClick={handleClearClick} className={FIELD_BUTTON}>
                  지우기
                </button>
              ) : null}
            </div>
          </div>
          {error ? (
            <span id={errorId} role="alert" className="text-[14px] leading-[1.5] text-[#e93737]">
              {error}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
