"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, useTransition } from "react";
import { AddressField } from "@/components/address-field";
import { Button, Checkbox, DateField, Field, FormRow, RequiredMark, TextField, useToast } from "@/components/common";
import { formatDate } from "@/lib/format";
import { splitPhone } from "@/lib/my-profile-form";
import {
  emptyVerifyFields,
  formOf,
  hasPendingVerification,
  hasUnverifiedChange,
  isVerified,
  missingVerifyMessage,
  serverErrorField,
  toUpdateBpProfileInput,
  toVerifyInput,
  validateBpProfileForm,
  validateVerifyForm,
  verifyFormOf,
  type BpProfileForm,
  type BpProfileFormField,
  type VerifyForm,
  type VerifyFormField,
} from "@/lib/bp-profile-form";
import { getBpProfileAction, updateBpProfileAction, verifyBpBusinessAction } from "./bp-page-actions";

const UNVERIFIED_CHANGE_MESSAGE = "인증하기를 눌러 사업자정보를 확인해 주세요.";

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}

function FailedBand({ title, message }: { title: string; message?: string }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      <p className="font-medium">{title}</p>
      {message && <p className="mt-[2px] text-[13px]">{message}</p>}
    </div>
  );
}

/** 입력칸이 여럿이거나 입력칸이 아닌 칸(개업일자 · 연락처 세 칸). Field 는 입력칸 하나만 감싸고 labelExtra 가
 * 없어서, 라벨 옆에 체크박스를 다는 칸(대표자 연락처 · 대표자 이메일)은 이걸로 짠다(AddressField 의 라벨
 * 줄과 같은 모양 — 화면마다 로컬로 둔다). */
function Labeled({ label, required, labelExtra, children }: { label: string; required?: boolean; labelExtra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex min-w-px flex-1 flex-col gap-[8px]">
      <span className="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
        <span>
          {label}
          {required && <RequiredMark />}
        </span>
        {labelExtra}
      </span>
      {children}
    </div>
  );
}

export type BpProfileTabHandle = { save: () => void };

/** MY PAGE 사업자정보 탭(S-UOJVUR). BP 마스터에게만 보인다 — my-page-panel.tsx 가 그 판정을 한다.
 * 패널이 열릴 때마다 새로 받는다(기본정보 탭과 같다). 「저장」·「닫기」는 기본정보 탭과 같은 자리(패널 맨 아래
 * 한 줄)에 둔다(사용자 디자인 피드백, 2026-10-22) — 그래서 저장은 ref 로 부모가 부르고, 저장 중 여부는
 * onSavingChange 로 부모에 올린다(부모가 그 값으로 맨 아래 버튼을 잠근다).
 *
 * 사업자 번호 인증은 점포 사업자정보와 같은 두 단계다(2026-10-22 사용자 결정, 「인증하자마자 바로 저장」하던
 * 첫 버전을 고침) — 「인증하기」는 검사만 하고 토큰을 로컬 상태(verifyForm.verification)로 들고 있다가,
 * 전체 「저장」을 눌러야 실제로 반영된다. 인증이 끝나 있으면(저장된 값이 있거나 이번 화면에서 통과했으면)
 * 세 칸을 읽기 전용으로 잠그고 "재인증"으로만 다시 연다(verifyEditing) — DESIGN.md 의 readonly 모양
 * ("인증을 마친 사업자정보"가 그 예다). "지우기"/"사용안함"은 서버를 부르지 않는다 — 칸을 저장된 값으로
 * 되돌릴 뿐이다(clearVerify, 아직 저장한 적 없으면 빈 값으로 되돌아간다).
 *
 * basicPhone · basicEmail — 내 정보(기본정보) 탭의 연락처 · 이메일. 대표자 연락처 · 이메일의 "기본정보와
 * 동일" 체크박스가 그 값을 그대로 쓴다(사용자 지정, 2026-10-22). my-page-panel.tsx 가 이미 받아 둔 값을
 * 그대로 내려준다 — 여기서 따로 조회하지 않는다. */
export const BpProfileTab = forwardRef<
  BpProfileTabHandle,
  {
    onSavingChange: (saving: boolean) => void;
    basicPhone: string;
    basicEmail: string;
  }
>(function BpProfileTab({ onSavingChange, basicPhone, basicEmail }, ref) {
  const toast = useToast();
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [form, setForm] = useState<BpProfileForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<BpProfileFormField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    onSavingChange(saving);
  }, [saving, onSavingChange]);

  const [verifyForm, setVerifyForm] = useState<VerifyForm | null>(null);
  const [verifyErrors, setVerifyErrors] = useState<Partial<Record<VerifyFormField, string>>>({});
  // 인증완료(잠긴) 상태를 "재인증"으로 다시 열어 고치는 중인가 — 저장된 값이 있는 한 isVerified 는 계속
  // true 라, 이 화면 전용 토글이 따로 있어야 편집 칸으로 바뀐다(signup biz-auth-section.tsx 의
  // value.verification 토글과 달리, BP 는 저장된 값이 있어도 편집할 수 있어야 해서 하나 더 필요하다).
  const [verifyEditing, setVerifyEditing] = useState(false);
  const [verifying, startVerifying] = useTransition();
  const requestNumber = useRef(0);
  const verifyNumber = useRef(0);

  useEffect(() => {
    const mine = ++requestNumber.current;
    getBpProfileAction()
      .then((result) => {
        if (mine !== requestNumber.current) return;
        if (!result.ok) return setLoadFailure(result.message);
        setUpdatedAt(result.profile.updatedAt);
        setForm(formOf(result.profile, basicPhone, basicEmail));
        setVerifyForm(verifyFormOf(result.profile));
      })
      .catch((error: unknown) => {
        if (mine !== requestNumber.current) return;
        console.error("사업자정보 불러오기 호출 실패", error);
        setLoadFailure("사업자정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      });
    // 탭이 열릴 때 한 번만 받는다(기본정보 탭과 같다) — basicPhone · basicEmail 은 탭이 떠 있는 동안
    // 바뀌지 않는다(기본정보 탭은 다른 탭이라 동시에 못 연다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ids = useId();
  const clearError = (key: BpProfileFormField) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const set = <K extends keyof BpProfileForm>(key: K, value: BpProfileForm[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    clearError(key as BpProfileFormField);
  };
  const invalid = (key: BpProfileFormField) => (errors[key] ? true : undefined);
  const messageId = (key: BpProfileFormField) => `${ids}-${key}`;
  const describe = (key: BpProfileFormField) => (errors[key] ? messageId(key) : undefined);
  const message = (key: BpProfileFormField) => <FieldMessage id={messageId(key)} message={errors[key]} />;

  const focusFirstError = (root: HTMLElement | null) => {
    requestAnimationFrame(() => (root?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
  };

  const clearVerifyError = (key: VerifyFormField) =>
    setVerifyErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const setVerify = (key: VerifyFormField, value: string) => {
    verifyNumber.current++;
    setVerifyForm((f) => (f ? { ...f, [key]: value } : f));
    clearVerifyError(key);
  };

  /** 점포 사업자정보와 같은 동작(store-form-view.tsx handleClearPending) — 칸을 저장된 값으로 되돌린다.
   * 아직 저장한 적 없으면 빈 값으로 돌아간다. 서버는 부르지 않는다 — 저장 전엔 전부 로컬 상태라서다
   * (2026-10-22 사용자 결정). 인증 전엔 "지우기", 인증완료 뒤엔 "사용안함"으로 문구만 가른다. */
  const clearVerify = () => {
    verifyNumber.current++;
    setVerifyForm((f) =>
      f
        ? {
            ...f,
            bizRegistrationNumber: f.savedBizNumber,
            bizCeoName: f.savedCeoName,
            bizOpenDate: f.savedOpenDate,
            verification: null,
          }
        : f,
    );
    setVerifyErrors({});
    setVerifyEditing(false);
  };

  // 점포 사업자정보 인증(store-form-view.tsx handleVerify)과 같은 메시지 — 번호 중복은 사업자등록번호 칸에,
  // 국세청 불일치는 대표자명 칸에 api 문구 그대로 붙인다(띠로 따로 보이지 않는다). 성공해도 저장하지 않는다 —
  // 받은 토큰을 verification 으로 들고 있다가 전체 저장에 싣는다.
  const handleVerify = () => {
    if (!verifyForm) return;
    const found = validateVerifyForm(verifyForm);
    setVerifyErrors(found);
    if (Object.keys(found).length) return;
    const requested = toVerifyInput(verifyForm);
    const startedAt = Date.now();
    const mine = ++verifyNumber.current;
    startVerifying(async () => {
      const result = await verifyBpBusinessAction(requested).catch((error: unknown) => {
        console.error("사업자 번호 인증 호출 실패", error);
        return {
          ok: false as const,
          status: undefined,
          message: "인증 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        };
      });
      // 기다리는 사이 칸을 고쳤으면 이 응답은 옛 값의 것이다 — 버린다.
      if (mine !== verifyNumber.current) return;
      if (!result.ok) {
        if (result.status === 422) return setVerifyErrors((e) => ({ ...e, bizCeoName: result.message }));
        return setVerifyErrors((e) => ({ ...e, bizRegistrationNumber: result.message }));
      }
      setVerifyForm((f) => (f ? { ...f, verification: { token: result.verificationToken, verifiedAt: startedAt, ...requested } } : f));
      setVerifyEditing(false);
    });
  };

  const handleSave = () => {
    if (!form || !verifyForm || updatedAt === null) return;
    const found = validateBpProfileForm(form);
    setErrors(found);
    setFailure(null);
    const unverified = hasUnverifiedChange(verifyForm);
    if (unverified) {
      setVerifyEditing(true);
      setVerifyErrors((e) => ({ bizRegistrationNumber: UNVERIFIED_CHANGE_MESSAGE, ...e }));
    }
    if (Object.keys(found).length || unverified) return focusFirstError(document.getElementById(ids));
    startSaving(async () => {
      try {
        const result = await updateBpProfileAction(toUpdateBpProfileInput(form, updatedAt, basicPhone, basicEmail, verifyForm));
        if (!result.ok) {
          const field = serverErrorField(result.status, result.message);
          if (!field) return setFailure(result.message);
          setErrors((e) => ({ ...e, [field]: result.message }));
          return focusFirstError(document.getElementById(ids));
        }
        toast("saved");
        const refreshed = await getBpProfileAction();
        if (refreshed.ok) {
          setUpdatedAt(refreshed.profile.updatedAt);
          setForm(formOf(refreshed.profile, basicPhone, basicEmail));
          setVerifyForm(verifyFormOf(refreshed.profile));
          setVerifyEditing(false);
        }
      } catch (error: unknown) {
        console.error("사업자정보 저장 처리 실패", error);
        setFailure("저장 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  useImperativeHandle(ref, () => ({ save: handleSave }));

  if (loadFailure) return <FailedBand title={loadFailure} />;
  if (!form || !verifyForm) return <p className="text-erp-muted">불러오는 중입니다.</p>;

  const verified = isVerified(verifyForm);
  const pending = hasPendingVerification(verifyForm);
  const locked = verified && !verifyEditing;
  // 비어 있어서 걸린 칸은 칸 아래가 아니라 한 줄 안내(missingMessage)로 모은다 — 칸 아래에는 형식 오류 · api 문구만 남는다
  const emptyErrored = emptyVerifyFields(verifyForm).filter((key) => verifyErrors[key]);
  const missingMessage = missingVerifyMessage(emptyErrored);
  const missingId = `${ids}-v-missing`;
  const hasVerifyInput = emptyVerifyFields(verifyForm).length < 3;
  const showClear = Boolean(verifyForm.savedBizNumber) || hasVerifyInput;
  const messageIdV = (key: VerifyFormField) => `${ids}-v-${key}`;
  const describeV = (key: VerifyFormField) => (!verifyErrors[key] ? undefined : emptyErrored.includes(key) ? missingId : messageIdV(key));
  const invalidV = (key: VerifyFormField) => (verifyErrors[key] ? true : undefined);
  const messageV = (key: VerifyFormField) => (emptyErrored.includes(key) ? null : <FieldMessage id={messageIdV(key)} message={verifyErrors[key]} />);

  return (
    <div id={ids} className="flex flex-col gap-[18px]">
      {/* 기본정보 탭의 계정 정보 칸과 같은 모양 — 타이틀을 회색 박스로 두르고, 본문은 흰 박스로 아래에
          잇는다(사용자 지정, 2026-10-22). 제목 줄에 인증 상태를 같이 둔다. 아래 상호명 묶음과는 다른 카드라
          따로 둔다(사용자 지정, 2026-10-22).*/}
      <div className="flex flex-col">
        <h4 className="flex h-[42px] items-center justify-between rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">
          <span>사업자정보</span>
          {verified ? (
            <span className="text-[14px] font-medium text-erp-on">
              인증 완료{pending ? " · 저장하면 반영됩니다" : verifyForm.savedVerifiedAt ? ` · ${formatDate(verifyForm.savedVerifiedAt)}` : ""}
            </span>
          ) : (
            <span className="text-[14px] font-medium text-erp-off">미인증</span>
          )}
        </h4>
        <div className="flex flex-col gap-[12px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[20px]">
          <div className="flex flex-col">
            <Field label="사업자등록번호">
              <TextField
                value={verifyForm.bizRegistrationNumber}
                // 점포 쪽(store-form-view.tsx)과 같다 — 타이핑 중에는 하이픈도 그대로 두고(숫자 · 하이픈만
                // 거른다), 서버로 보낼 때(toVerifyInput)·검사할 때(validateVerifyForm)만 하이픈을 뗀다.
                // maxLength 는 숫자 10자리 + 하이픈 2개 = 12(store-form-view.tsx 와 같은 값) — 붙여넣은
                // 글자 그대로에 먼저 걸리므로, 하이픈 없이 숫자만 붙여넣어도 10자가 넉넉히 다 들어간다.
                onChange={(e) => setVerify("bizRegistrationNumber", e.target.value.replace(/[^0-9-]/g, ""))}
                readOnly={locked}
                placeholder="숫자 10자리"
                maxLength={12}
                aria-invalid={invalidV("bizRegistrationNumber")}
                aria-describedby={describeV("bizRegistrationNumber")}
              />
            </Field>
            {messageV("bizRegistrationNumber")}
          </div>
          <div className="flex flex-col">
            <Field label="대표자명">
              <TextField
                value={verifyForm.bizCeoName}
                onChange={(e) => setVerify("bizCeoName", e.target.value)}
                readOnly={locked}
                placeholder="대표자 이름"
                maxLength={50}
                aria-invalid={invalidV("bizCeoName")}
                aria-describedby={describeV("bizCeoName")}
              />
            </Field>
            {messageV("bizCeoName")}
          </div>
          <div className="flex flex-col">
            <Labeled label="개업일자">
              {locked ? (
                <TextField value={verifyForm.bizOpenDate} readOnly aria-label="개업일자" />
              ) : (
                <DateField value={verifyForm.bizOpenDate} onChange={(v) => setVerify("bizOpenDate", v)} aria-label="개업일자" />
              )}
            </Labeled>
            {messageV("bizOpenDate")}
          </div>
          <FieldMessage id={missingId} message={missingMessage ?? undefined} />
          <div className="flex gap-[6px]">
            {locked ? (
              <>
                <Button variant="soft" onClick={() => setVerifyEditing(true)}>
                  재인증
                </Button>
                <Button variant="soft" onClick={clearVerify}>
                  사용안함
                </Button>
              </>
            ) : (
              <>
                <Button variant="soft" onClick={handleVerify} disabled={verifying}>
                  {verifying ? "인증 중…" : verifyForm.savedBizNumber ? "재인증" : "인증하기"}
                </Button>
                {showClear && (
                  <Button variant="soft" onClick={clearVerify} disabled={verifying}>
                    {verifyForm.savedBizNumber ? "사용안함" : "지우기"}
                  </Button>
                )}
              </>
            )}
          </div>
          {/* 안내는 버튼 아래에 둔다(사용자 지정, 2026-10-22) */}
          <p className="text-[13px] leading-[1.6] text-erp-label">사업자정보가 국세청에 등록된 정보와 일치하는지 확인합니다.</p>
        </div>
      </div>

      {/* 상호명부터는 별도 카드다(사용자 지정, 2026-10-22) — 칸과 그 오류 문구 사이에는 여백을 두지 않는다. */}
      <section aria-label="상호명 등" className="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">
        <div className="flex flex-col">
          <Field label="상호명" required>
            <TextField
              value={form.tradeName}
              onChange={(e) => set("tradeName", e.target.value)}
              maxLength={50}
              aria-invalid={invalid("tradeName")}
              aria-describedby={describe("tradeName")}
              aria-required
            />
          </Field>
          {message("tradeName")}
        </div>

        <div className="flex flex-col">
          <Labeled
            label="대표자 연락처"
            labelExtra={<Checkbox label="기본정보와 동일" checked={form.sameAsBasicPhone} onChange={(e) => set("sameAsBasicPhone", e.target.checked)} />}
          >
            <FormRow>
              {(["앞자리", "가운데자리", "끝자리"] as const).map((label, i) => (
                <TextField
                  key={label}
                  value={(form.sameAsBasicPhone ? splitPhone(basicPhone) : form.bizCeoPhone)[i]}
                  onChange={(e) => {
                    const next = [...form.bizCeoPhone] as BpProfileForm["bizCeoPhone"];
                    next[i] = e.target.value.replace(/[^0-9]/g, "");
                    set("bizCeoPhone", next);
                  }}
                  // 「기본정보와 동일」이면 고칠 수 없다. disabled 는 공통 입력칸에 회색이 없어(DESIGN.md) 막힌 줄 모르므로
                  // 읽기 전용 바탕(#f8f9fb)이 깔리는 readOnly 를 함께 건다(사용자 지정, 2026-10-22)
                  readOnly={form.sameAsBasicPhone}
                  disabled={form.sameAsBasicPhone}
                  inputMode="numeric"
                  maxLength={i === 0 ? 3 : 4}
                  aria-label={`대표자 연락처 ${label}`}
                  aria-invalid={invalid("bizCeoPhone")}
                  aria-describedby={describe("bizCeoPhone")}
                />
              ))}
            </FormRow>
          </Labeled>
          {message("bizCeoPhone")}
        </div>

        <div className="flex flex-col">
          <Labeled
            label="대표자 이메일"
            labelExtra={<Checkbox label="기본정보와 동일" checked={form.sameAsBasicEmail} onChange={(e) => set("sameAsBasicEmail", e.target.checked)} />}
          >
            <TextField
              type="email"
              value={form.sameAsBasicEmail ? basicEmail : form.bizCeoEmail}
              onChange={(e) => set("bizCeoEmail", e.target.value)}
              readOnly={form.sameAsBasicEmail}
              disabled={form.sameAsBasicEmail}
              maxLength={100}
              aria-invalid={invalid("bizCeoEmail")}
              aria-describedby={describe("bizCeoEmail")}
            />
          </Labeled>
          {message("bizCeoEmail")}
        </div>

        <FormRow>
          <div className="flex min-w-px flex-1 flex-col">
            <Field label="업태">
              <TextField
                value={form.bizCategory}
                onChange={(e) => set("bizCategory", e.target.value)}
                maxLength={50}
                aria-invalid={invalid("bizCategory")}
                aria-describedby={describe("bizCategory")}
              />
            </Field>
            {message("bizCategory")}
          </div>
          <div className="flex min-w-px flex-1 flex-col">
            <Field label="종목">
              <TextField
                value={form.bizItem}
                onChange={(e) => set("bizItem", e.target.value)}
                maxLength={50}
                aria-invalid={invalid("bizItem")}
                aria-describedby={describe("bizItem")}
              />
            </Field>
            {message("bizItem")}
          </div>
        </FormRow>

        {/* 업태 · 종목 다음에 둔다(사용자 지정, 2026-10-22) */}
        <AddressField label="사업자주소" value={form.address} onChange={(next) => set("address", next)} detailError={errors.bizAddressDetail} />

        {failure && <FailedBand title={failure} />}
      </section>
    </div>
  );
});
