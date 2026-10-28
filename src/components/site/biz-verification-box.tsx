"use client";

import { useId, type ReactNode } from "react";
import { Badge, Button, DateField, Field, TextField } from "@/components/common";
import { FieldMessage } from "@/components/site/side-parts";
import {
  BIZ_CEO_NAME_MAX,
  bizNumberInput,
  bizVerifiedLabel,
  missingMessage,
  BIZ_MESSAGE,
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
/** 인증 상태 배지 — 「인증 완료 · 날짜」(on) / 「미인증」(off). 상자 머리 대신 묶음 제목에 둘 때도 같은 배지를 쓴다(2026-10-22 사용자 지정) */
export function BizVerifiedStatus({ verified, date }: { verified: boolean; date: string }) {
  return <Badge tone={verified ? "on" : "off"}>{bizVerifiedLabel(verified, date)}</Badge>;
}

/** struck 일 때 쓰는 칸 — 입력칸이 아니라 "지워질 값"을 보여주기만 한다(MY PAGE "사용안함", 2026-10-23
 * 사용자 지정). TextField 는 className 을 안 받아(공통 컴포넌트 규칙) 취소선을 못 넣으므로, 같은 높이 ·
 * 테두리 · 읽기전용 바탕(FIELD_BOX)을 직접 그린 읽기 전용 칸이다. */
function StruckField({ value }: { value: string }) {
  return (
    <div className="flex h-[34px] w-full items-center rounded-[2px] border border-erp-field-line bg-erp-thead-bg pl-[10px] text-[14px] text-erp-label">
      <span className="truncate line-through">{value || " "}</span>
    </div>
  );
}

export function BizVerificationBox({
  values,
  onChange,
  locked = {},
  lockedDisplay = {},
  struck = false,
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
  revertLabel = "재인증 취소",
  onClearSaved,
  // 국세청 안내 줄은 인증하기 전에만 보인다 — 인증한 뒤에도 남으면 어색했다(점포 · MY PAGE · BP 마스터, 2026-10-28 사용자 지정)
  guide = BIZ_MESSAGE.GUIDE,
  note,
  layout = "stack",
  compactRow = false,
  showHeader = true,
  titleBar = false,
}: {
  values: BizVerifyValues;
  onChange: (key: BizVerifyField, value: string) => void;
  /** 지금 고칠 수 없는 칸 — 인증 완료로 잠근 칸과 저장한 점포의 사업자등록번호 · 개업일자. 읽기 전용으로 보인다 */
  locked?: Partial<Record<BizVerifyField, boolean>>;
  /** 잠긴 칸에 값 대신 보일 글자(저장된 번호의 123-45-67890 표기) */
  lockedDisplay?: Partial<Record<BizVerifyField, string>>;
  /** 세 칸을 전부 지워질 값으로 보인다 — 입력칸이 아니라 취소선 그은 읽기 전용 칸, 인증하기 버튼도 숨긴다
   * ("사용안함"을 누른 MY PAGE, 2026-10-23 사용자 지정 — 고칠 수 있는 게 아니라 지워진다는 걸 보여준다) */
  struck?: boolean;
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
  /** 주면 재인증 버튼 옆에 되돌리기 버튼을 보인다 — 저장된 값으로 되돌린다(점포 수정, 2026-10-22 사용자 지정) */
  onRevert?: () => void;
  /** onRevert 버튼 글자. 기본은 "재인증 취소" — "사용안함" 뒤의 되돌리기처럼 다른 문구가 필요하면 바꿔 쓴다
   * (MY PAGE, 2026-10-23 사용자 지정 — 두 동작이 같은 되돌리기 함수를 쓰지만 문구는 달라야 한다) */
  revertLabel?: string;
  /** 주면 [사용안함]을 재인증 버튼 오른쪽에 보인다 — 저장된 값을 아예 지운다. 점포는 못 쓰고 BP 자신만
   * 쓴다(점포는 저장 뒤 번호 · 개업일자가 고정이라 지울 수 없다, MY PAGE, 2026-10-23 사용자 지정) */
  onClearSaved?: () => void;
  /** 버튼 아래 안내. 기본은 공통 안내 한 줄 — 저장된 점포 재인증처럼 그 화면만의 안내로 바꿀 때만 준다 */
  guide?: ReactNode;
  /** 안내 아래에 덧붙일 그 화면만의 한 줄(점포의 운영 전환 조건 등) */
  note?: ReactNode;
  /** 세 칸 배치 — 한 줄씩 쌓거나(stack, 기본) 한 줄에 나란히(row) 둔다(2026-10-22 사용자 지정). MY PAGE
   * 사업자정보도 row 를 쓴다(2026-10-23 사용자 지정 — 처음엔 좁은 패널이라 stack 이었다) */
  layout?: "stack" | "row";
  /** row 일 때 세 칸의 비율을 좁은 슬라이드 패널(MY PAGE)에 맞게 바꾼다 — 기본은 셋이 똑같다(회원가입 ·
   * 점포, 2026-10-23 사용자 지정으로 원래 비율 유지). 사업자등록번호를 좁히고 대표자명을 넓힌다 — 개업일자
   * 입력칸은 달력 아이콘(34px)까지 있어 "YYYY-MM-DD"가 좁은 폭에서 잘렸던 걸 먼저 고쳤는데, 그러면 사업자
   * 등록번호 · 대표자명의 placeholder가 잘려 사용자가 다시 조정했다. */
  compactRow?: boolean;
  /** 상자 머리(「사업자정보」 · 인증 상태). 점포는 인증 상태를 위쪽 묶음 제목에 두어(BizVerifiedStatus) 머리를 뺀다(2026-10-22 사용자 지정) */
  showHeader?: boolean;
  /** 머리를 상자 밖 42px 회색 제목 바로 떼고 본문을 흰 바탕에 둔다 — MY PAGE 사업자정보 탭 전용(2026-10-26 사용자 지정).
   * 켜면 showHeader 는 보지 않는다 */
  titleBar?: boolean;
}) {
  const ids = useId();
  const lineMessage = missingMessage(missing) ?? boxError ?? undefined;
  const lineId = `${ids}-line`;
  const messageId = (key: BizVerifyField) => `${ids}-${key}`;
  const describe = (key: BizVerifyField) => (fieldErrors[key] ? messageId(key) : missing.includes(key) ? lineId : undefined);
  const invalid = (key: BizVerifyField) => Boolean(fieldErrors[key]) || missing.includes(key);
  const off = disabled || verifying;
  // 칸 하나(입력칸 + 그 아래 문구). 나란히 둘 때(row)는 세 칸이 남는 폭을 똑같이 나눈다 — 회원가입 · 점포는
  // 그대로. compactRow 를 받은 화면만(MY PAGE 슬라이드 패널, 2026-10-23 사용자 지정) 세 칸의 비율을 바꾼다 —
  // 값 길이 기준으로 맞춘 것이다: 사업자등록번호(하이픈 넣어 최대 12자, 123-45-67890)·개업일자(입력칸 안
  // 달력 아이콘 34px 까지 있어 "YYYY-MM-DD"가 가장 좁은 폭에서 끝(DD)까지 안 보였다)는 넓게, 대표자명은
  // 보통 짧아 좁게 — 수치는 실제 화면으로 여러 번 맞춰 본 값이다(사용자 확인, 2026-10-23). 다른 화면엔
  // 영향 없다.
  const cell = layout === "row" ? "flex min-w-px flex-1 flex-col" : "flex flex-col";
  const compactCell = (grow: string) => (layout === "row" && compactRow ? `flex min-w-px ${grow} flex-col` : cell);

  const bizNumberCell = (
    <div className={compactCell("flex-[1.0]")}>
      <Field label="사업자등록번호">
        {struck ? (
          <StruckField value={lockedDisplay.bizNumber ?? values.bizNumber} />
        ) : (
          <TextField
            value={locked.bizNumber ? (lockedDisplay.bizNumber ?? values.bizNumber) : values.bizNumber}
            // maxLength 를 DOM 에 두지 않는다 — 공백이 섞인 붙여넣기가 거르기 전에 잘린다. 12자 제한은 bizNumberInput 이 건다
            onChange={(e) => onChange("bizNumber", bizNumberInput(e.target.value))}
            readOnly={locked.bizNumber || verifying}
            disabled={disabled}
            inputMode="numeric"
            placeholder="숫자 10자리"
            aria-invalid={invalid("bizNumber") || undefined}
            aria-describedby={describe("bizNumber")}
          />
        )}
      </Field>
      <FieldMessage id={messageId("bizNumber")} message={fieldErrors.bizNumber} />
    </div>
  );
  const ceoNameCell = (
    <div className={compactCell("flex-[0.85]")}>
      <Field label="대표자명">
        {struck ? (
          <StruckField value={values.ceoName} />
        ) : (
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
        )}
      </Field>
      <FieldMessage id={messageId("ceoName")} message={fieldErrors.ceoName} />
    </div>
  );
  const openDateCell = (
    <div className={compactCell("flex-[1.3]")}>
      <div role="group" aria-label="개업일자" className="flex flex-col gap-[8px]">
        <span className="text-[14px] font-medium text-erp-label">개업일자</span>
        {struck ? (
          <StruckField value={values.openDate} />
        ) : locked.openDate || verifying ? (
          <TextField value={values.openDate} readOnly aria-label="개업일자" />
        ) : (
          <DateField value={values.openDate} onChange={(v) => onChange("openDate", v)} disabled={disabled} aria-label="개업일자" />
        )}
      </div>
      <FieldMessage id={messageId("openDate")} message={fieldErrors.openDate} />
    </div>
  );

  // titleBar 면 머리를 상자 밖 회색 제목 바로 떼고 본문을 흰 바탕에 둔다(MY PAGE 「계정 정보」와 같은 모양,
  // 2026-10-26 사용자 지정). 아니면 본문 div 는 contents 라 회색 상자 하나(머리 · 본문이 한 상자)다.
  return (
    <section
      aria-label="사업자 번호 인증"
      className={titleBar ? "w-full" : "flex flex-col gap-[12px] rounded-[2px] border border-erp-panel-line bg-erp-thead-bg p-[18px]"}
    >
      {titleBar && (
        <h3 className="flex h-[42px] items-center justify-between rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">
          <span>사업자정보</span>
          <BizVerifiedStatus verified={verified} date={verifiedDate} />
        </h3>
      )}
      {/* 본문 위아래 여백은 계정 정보(20px)보다 줄인 16px — 좌우와 같다(사용자가 비교 화면으로 고름, 2026-10-26) */}
      <div className={titleBar ? "flex flex-col gap-[12px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white p-[16px]" : "contents"}>
        {showHeader && !titleBar && (
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-erp-ink">사업자정보</span>
            <BizVerifiedStatus verified={verified} date={verifiedDate} />
          </div>
        )}
        {/* 오류 문구가 칸 사이에 빈 줄을 만들지 않게 칸과 문구를 간격 없는 묶음으로 둔다(2026-10-22 사용자 지정).
            나란히(row)일 땐 위로 맞춘다(items-start) — 늘이면(기본 stretch) 한 칸에만 오류 문구가 붙었을 때 다른 칸이
            그 높이로 늘어나고, 공통 Field 가 라벨 · 입력칸을 세로 가운데로 두어(justify-center) 입력칸 줄이 어긋났다
            (2026-10-23 사용자 요청 — 점포 「이미 등록된 사업자등록번호입니다」). */}
        <div className={layout === "row" ? "flex items-start gap-[6px]" : "flex flex-col gap-[12px]"}>
          {bizNumberCell}
          {ceoNameCell}
          {openDateCell}
        </div>
        <FieldMessage id={lineId} message={lineMessage} />
        <div className="flex gap-[6px]">
          {/* struck 일 땐 숨긴다 — 지워질 값을 두고 "재인증/인증하기"를 누르는 건 말이 안 된다. 바꿔 타려면
              먼저 되돌리기(onRevert)로 돌아와야 한다(2026-10-23 사용자 지정). */}
          {!struck && (
            <Button variant="soft" onClick={onVerify} disabled={off}>
              {verifying ? "인증 중…" : verified ? "재인증" : "인증하기"}
            </Button>
          )}
          {onClearSaved && (
            <Button variant="soft" onClick={onClearSaved} disabled={off}>
              사용안함
            </Button>
          )}
          {showClear && (
            <Button variant="soft" onClick={onClear} disabled={off}>
              지우기
            </Button>
          )}
          {onRevert && (
            <Button variant="soft" onClick={onRevert} disabled={off}>
              {revertLabel}
            </Button>
          )}
        </div>
        {/* 성공은 상자 머리의 상태가 바뀌는 것으로 보이고, 화면 낭독기에만 따로 알린다 */}
        <span role="status" className="sr-only">
          {verified ? "사업자정보 인증이 완료되었습니다." : ""}
        </span>
        {/* 인증한 뒤에는 안내 줄을 빼고 note 만 둔다(2026-10-28 사용자 지정) */}
        {((!verified && guide) || note) && (
        <p className="text-[13px] leading-[1.5] text-erp-label">
          {!verified && guide}
          {note && (
            <>
              {!verified && guide && <br />}
              {note}
            </>
          )}
        </p>
        )}
      </div>
    </section>
  );
}
