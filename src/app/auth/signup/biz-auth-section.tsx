"use client";

import { useId, useState } from "react";
import { Badge, Button, DateField, Field, FormGroup, TextField } from "@/components/common";
import { Row } from "../_components/row";
import { validateBizRegistrationNumber } from "../_components/validators";

// 필드 이름은 naming.md(BP · 점포)의 사업자정보 표기(biz_registration_number · biz_ceo_name · biz_open_date)를 그대로 따른다.
export type BizAuthValue = { bizRegistrationNumber: string; bizCeoName: string; bizOpenDate: string; verified: boolean };
export const BIZ_AUTH_INITIAL: BizAuthValue = { bizRegistrationNumber: "", bizCeoName: "", bizOpenDate: "", verified: false };

// 사업자정보 인증 (선택). docs/demo/src/pages/auth/signup.mjs 의 biz 섹션과 같다.
// 국세청 사업자등록번호 진위확인 API 연동이 없다 — "인증하기"는 사업자등록번호·대표자명·개업일자
// 셋이 모두 채워졌을 때만 화면을 "인증완료"로 바꾸는 자리표시자다(2026-10-12 피드백).
// "재인증"은 입력칸을 다시 열되 값은 그대로 두어(다른 값으로 바꿔 다시 인증받도록) 편집하게 하고,
// "지우기"는 인증한 걸 아예 안 쓰기로 한 경우라 값까지 비운 전 상태로 되돌린다.
export function BizAuthSection({ value, onChange }: { value: BizAuthValue; onChange: (value: BizAuthValue) => void }) {
  // 사업자등록번호·대표자명 두 칸이 이 오류 하나를 같이 쓴다(개업일자는 DateField 가 aria-invalid 를
  // 못 받는 공통 컴포넌트라 뺀다 — 공통 컴포넌트는 1팀과 맞추지 않고 고치지 않는다).
  const errorId = useId();
  const [triedVerify, setTriedVerify] = useState(false);
  const [bizNumberTouched, setBizNumberTouched] = useState(false);
  // 지우기마다 올려 입력칸을 새로 그린다 — 개업일자는 날짜가 완성되기 전 글자를 DateField 안에만 들고 있어서,
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
    <FormGroup title="사업자정보 인증 (선택)">
      {value.verified ? (
        <>
          <h4 className="flex items-center gap-[8px] text-[14px] font-semibold">
            사업자 번호 인증
            <Badge tone="on">인증완료</Badge>
          </h4>
          <Row>
            <Field label="사업자등록번호">
              <TextField value={value.bizRegistrationNumber} disabled />
            </Field>
            <Field label="대표자명">
              <TextField value={value.bizCeoName} disabled />
            </Field>
            <Field label="개업일자">
              <TextField value={value.bizOpenDate} disabled />
            </Field>
          </Row>
          <div className="flex gap-[6px]">
            <Button type="button" variant="soft" onClick={handleReverifyClick}>
              재인증
            </Button>
            <Button type="button" variant="off" onClick={handleClearClick}>
              지우기
            </Button>
          </div>
        </>
      ) : (
        <>
          <h4 className="text-[14px] font-semibold">사업자 번호 인증</h4>
          <Row key={clearCount}>
            <Field label="사업자등록번호">
              {/* 숫자만 받는다(연락처와 같다). 붙여 넣은 하이픈·공백도 걸러 낸다. */}
              <TextField
                value={value.bizRegistrationNumber}
                onChange={(e) => onChange({ ...value, bizRegistrationNumber: e.target.value.replace(/\D/g, "") })}
                onBlur={() => setBizNumberTouched(true)}
                inputMode="numeric"
                maxLength={10}
                placeholder="숫자 10자리"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
            </Field>
            <Field label="대표자명">
              <TextField
                value={value.bizCeoName}
                onChange={(e) => onChange({ ...value, bizCeoName: e.target.value })}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
              />
            </Field>
            <Field label="개업일자">
              <DateField aria-label="개업일자" value={value.bizOpenDate} onChange={(bizOpenDate) => onChange({ ...value, bizOpenDate })} />
            </Field>
          </Row>
          {error ? (
            <span id={errorId} role="alert" className="text-[13px] text-[#e93737]">
              {error}
            </span>
          ) : null}
          <div className="flex gap-[6px]">
            <Button type="button" onClick={handleVerifyClick}>
              인증하기
            </Button>
            {showClear ? (
              <Button type="button" variant="off" onClick={handleClearClick}>
                지우기
              </Button>
            ) : null}
          </div>
        </>
      )}
    </FormGroup>
  );
}
