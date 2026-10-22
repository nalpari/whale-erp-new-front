"use client";

import { useId, type ReactNode } from "react";
import { Button, DateField, Field, TextField } from "@/components/common";
import { FieldMessage } from "@/components/site/side-parts";
import {
  BIZ_CEO_NAME_MAX,
  BIZ_MESSAGE,
  BIZ_NUMBER_INPUT_MAX,
  bizNumberInput,
  bizVerifiedLabel,
  missingMessage,
  type BizVerifyField,
  type BizVerifyValues,
} from "@/lib/biz-verification-rules";

/**
 * 사업자정보 인증 상자(관리자 웹) — 지금은 점포 등록/수정이 쓰고, MY PAGE 사업자정보 탭 · 플랫폼 BP 관리도 이것으로 옮길 차례다. 규칙과 문구는
 * lib/biz-verification-rules.ts, 정책은 manyfast S-VRNTHD(2026-10-22 사용자 확정, 미리보기 「사업자정보 인증 통일안」).
 * 회원가입은 로그인 전 화면 규격(guest-form)이라 같은 구성 · 같은 문구를 그 화면 부품으로 그린다(signup/biz-auth-section.tsx).
 * 상태는 부르는 화면이 쥔다 — 이 상자는 그리기만 한다. 인증하기는 확인만 하고 저장은 화면의 [저장]이 한다.
 * 형식 오류 · 중복은 그 칸 아래, 빈 칸 묶음 · 그 밖의 실패(boxError)는 인증하기 버튼 바로 위 한 줄이다.
 */
/** 인증 상태 글자 — 「인증 완료 · 날짜」(파랑) / 「미인증」(빨강). 상자 머리 대신 묶음 제목에 둘 때도 같은 모양을 쓴다 */
export function BizVerifiedStatus({ verified, date }: { verified: boolean; date: string }) {
  return <span className={`text-[14px] font-medium ${verified ? "text-erp-on" : "text-erp-off"}`}>{bizVerifiedLabel(verified, date)}</span>;
}

export function BizVerificationBox({
  values,
  onChange,
  locked = {},
  lockedDisplay = {},
  verified,
  verifiedDate,
  verifying,
  disabled,
  fieldErrors,
  missing,
  boxError,
  onVerify,
  onClear,
  showClear,
  onRevert,
  guide = BIZ_MESSAGE.GUIDE,
  note,
  layout = "stack",
  showHeader = true,
}: {
  values: BizVerifyValues;
  onChange: (key: BizVerifyField, value: string) => void;
  /** 지금 고칠 수 없는 칸 — 인증 완료로 잠근 칸과 저장한 점포의 사업자등록번호 · 개업일자. 읽기 전용으로 보인다 */
  locked?: Partial<Record<BizVerifyField, boolean>>;
  /** 잠긴 칸에 값 대신 보일 글자(저장된 번호의 123-45-67890 표기) */
  lockedDisplay?: Partial<Record<BizVerifyField, string>>;
  verified: boolean;
  /** 인증 일자 YYYY-MM-DD — 「인증 완료 · 날짜」. 모르면 빈 문자열 */
  verifiedDate: string;
  verifying: boolean;
  disabled?: boolean;
  /** 칸 바로 아래 문구 — 형식 오류와 중복 */
  fieldErrors: Partial<Record<BizVerifyField, string>>;
  /** 비어 있는 칸(인증하기를 누른 뒤) — 「·」로 묶어 버튼 위 한 줄 */
  missing: BizVerifyField[];
  /** 버튼 위 한 줄 — 국세청 불일치 · 연동 실패 · 한도 초과 · 만료 · 미인증 저장 */
  boxError?: string | null;
  onVerify: () => void;
  onClear: () => void;
  /** 주면 지우기를 보인다 — 언제 보일지는 부르는 화면이 정한다(입력값이 있거나 인증했을 때, 점포는 저장 전에만) */
  showClear: boolean;
  /** 주면 [재인증 취소]를 보인다 — 저장된 사업자정보를 재인증하다가 저장된 값 · 인증 완료로 되돌린다(점포 수정, 2026-10-22 사용자 지정) */
  onRevert?: () => void;
  /** 버튼 아래 안내. 기본은 공통 안내 한 줄 — 저장된 점포 재인증처럼 그 화면만의 안내로 바꿀 때만 준다 */
  guide?: ReactNode;
  /** 안내 아래에 덧붙일 그 화면만의 한 줄(점포의 운영 전환 조건 등) */
  note?: ReactNode;
  /** 세 칸 배치 — 좁은 슬라이드 패널(MY PAGE)은 한 줄씩 쌓고(stack, 기본), 넓은 화면(점포 등록 · 수정)은 한 줄에 나란히(row) 둔다(2026-10-22 사용자 지정) */
  layout?: "stack" | "row";
  /** 상자 머리(「사업자정보」 · 인증 상태). 점포는 인증 상태를 위쪽 묶음 제목에 두어(BizVerifiedStatus) 머리를 뺀다(2026-10-22 사용자 지정) */
  showHeader?: boolean;
}) {
  const ids = useId();
  const lineMessage = missingMessage(missing) ?? boxError ?? undefined;
  const lineId = `${ids}-line`;
  const messageId = (key: BizVerifyField) => `${ids}-${key}`;
  const describe = (key: BizVerifyField) => (fieldErrors[key] ? messageId(key) : missing.includes(key) ? lineId : undefined);
  const invalid = (key: BizVerifyField) => Boolean(fieldErrors[key]) || missing.includes(key);
  const off = disabled || verifying;
  // 칸 하나(입력칸 + 그 아래 문구). 나란히 둘 때는 세 칸이 남는 폭을 똑같이 나눈다
  const cell = layout === "row" ? "flex min-w-px flex-1 flex-col" : "flex flex-col";

  return (
    <section aria-label="사업자 번호 인증" className="flex flex-col gap-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[18px]">
      {showHeader && (
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold text-erp-ink">사업자정보</span>
          <BizVerifiedStatus verified={verified} date={verifiedDate} />
        </div>
      )}
      {/* 오류 문구가 칸 사이에 빈 줄을 만들지 않게 칸과 문구를 간격 없는 묶음으로 둔다(2026-10-22 사용자 지정) */}
      <div className={layout === "row" ? "flex gap-[6px]" : "flex flex-col gap-[12px]"}>
        <div className={cell}>
          <Field label="사업자등록번호">
            <TextField
              value={locked.bizNumber ? (lockedDisplay.bizNumber ?? values.bizNumber) : values.bizNumber}
              onChange={(e) => onChange("bizNumber", bizNumberInput(e.target.value))}
              readOnly={locked.bizNumber || verifying}
              disabled={disabled}
              inputMode="numeric"
              placeholder="숫자 10자리"
              maxLength={BIZ_NUMBER_INPUT_MAX}
              aria-invalid={invalid("bizNumber") || undefined}
              aria-describedby={describe("bizNumber")}
            />
          </Field>
          <FieldMessage id={messageId("bizNumber")} message={fieldErrors.bizNumber} />
        </div>
        <div className={cell}>
          <Field label="대표자명">
            <TextField
              value={values.ceoName}
              onChange={(e) => onChange("ceoName", e.target.value)}
              readOnly={locked.ceoName || verifying}
              disabled={disabled}
              placeholder="대표자 이름"
              maxLength={BIZ_CEO_NAME_MAX}
              aria-invalid={invalid("ceoName") || undefined}
              aria-describedby={describe("ceoName")}
            />
          </Field>
          <FieldMessage id={messageId("ceoName")} message={fieldErrors.ceoName} />
        </div>
        <div className={cell}>
          <div role="group" aria-label="개업일자" className="flex flex-col gap-[8px]">
            <span className="text-[14px] font-medium text-erp-label">개업일자</span>
            {locked.openDate || verifying ? (
              <TextField value={values.openDate} readOnly aria-label="개업일자" />
            ) : (
              <DateField value={values.openDate} onChange={(v) => onChange("openDate", v)} disabled={disabled} aria-label="개업일자" />
            )}
          </div>
          <FieldMessage id={messageId("openDate")} message={fieldErrors.openDate} />
        </div>
      </div>
      <FieldMessage id={lineId} message={lineMessage} />
      <div className="flex gap-[6px]">
        <Button variant="soft" onClick={onVerify} disabled={off}>
          {verifying ? "인증 중…" : verified ? "재인증" : "인증하기"}
        </Button>
        {showClear && (
          <Button variant="soft" onClick={onClear} disabled={off}>
            지우기
          </Button>
        )}
        {onRevert && (
          <Button variant="soft" onClick={onRevert} disabled={off}>
            재인증 취소
          </Button>
        )}
      </div>
      {/* 성공은 상자 머리의 상태가 바뀌는 것으로 보이고, 화면 낭독기에만 따로 알린다 */}
      <span role="status" className="sr-only">
        {verified ? "사업자정보 인증이 완료되었습니다." : ""}
      </span>
      <p className="text-[13px] leading-[1.5] text-erp-label">
        {guide}
        {note && (
          <>
            <br />
            {note}
          </>
        )}
      </p>
    </section>
  );
}
