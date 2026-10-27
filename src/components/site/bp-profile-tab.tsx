"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState, useTransition } from "react";
import { AddressField } from "@/components/address-field";
import { Checkbox, Field, FormRow, RequiredMark, TextField, useToast } from "@/components/common";
import { BizVerificationBox } from "@/components/site/biz-verification-box";
import { formatDate } from "@/lib/format";
import { splitPhone } from "@/lib/my-profile-form";
import { formatBizNumber } from "@/lib/store-view";
import { BIZ_MESSAGE, bizVerifyFailure, type BizVerifyField } from "@/lib/biz-verification-rules";
import {
  emptyVerifyFields,
  expireVerification,
  formOf,
  hasPendingVerification,
  hasUnverifiedChange,
  isVerified,
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

/** VerifyFormField(api 모양) ↔ BizVerifyField(상자 공통 모양) 키 대응 — 두 타입이 어근은 같지만
 * 이름이 달라서(사업자등록번호 필드가 하나는 bizRegistrationNumber, 하나는 bizNumber) 상자에 넘길 때 바꿔 준다. */
const VERIFY_TO_BIZ: Record<VerifyFormField, BizVerifyField> = {
  bizRegistrationNumber: "bizNumber",
  bizCeoName: "ceoName",
  bizOpenDate: "openDate",
};
const BIZ_TO_VERIFY: Record<BizVerifyField, VerifyFormField> = {
  bizNumber: "bizRegistrationNumber",
  ceoName: "bizCeoName",
  openDate: "bizOpenDate",
};

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

/** 입력칸이 여럿이거나 입력칸이 아닌 칸(연락처 세 칸). Field 는 입력칸 하나만 감싸고 labelExtra 가
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
 * ("인증을 마친 사업자정보"가 그 예다). "지우기"(clearVerify, 아직 저장한 적 없는 값을 비운다)와 "사용안함
 * 취소"(clearVerify 가 그대로 맡는다, 저장된 값으로 되돌리고 pendingClear 도 끈다)는 서버를 부르지 않고
 * 로컬 상태만 되돌린다. "사용안함"(handleClearSaved) 은 되돌리는 쪽이 아니라 저장된 값을 지우기로
 * "표시"만 한다(pendingClear) — 실제로 지워지는 건 전체 "저장"을 눌러야다.
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
    // my-page-panel.tsx 는 탭을 바꿔도 이 컴포넌트를 내리지 않고 숨기기만 한다(always-mounted, 코드
    // 리뷰로 찾음, 2026-10-23) — 이 cleanup 은 패널을 다시 열 때(bizTabGeneration 이 올라 key 가 바뀌어
    // 실제로 unmount 될 때)를 위한 것이다. 그때 저장 중이었다면 cleanup 없이는 부모의 bizSaving 이 true 로
    // 멈춰 [닫기]가 영영 잠긴다.
    return () => onSavingChange(false);
  }, [saving, onSavingChange]);

  const [verifyForm, setVerifyForm] = useState<VerifyForm | null>(null);
  const [verifyErrors, setVerifyErrors] = useState<Partial<Record<VerifyFormField, string>>>({});
  // 특정 칸 탓이 아닌 인증 실패(불일치 · 장애 · 한도 초과) — 상자 맨 아래 한 줄로 보인다(boxError)
  const [verifyFailure, setVerifyFailure] = useState<string | null>(null);
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
    // 조회는 마운트될 때(패널을 열 때) 한 번만 — basicPhone · basicEmail 은 이 컴포넌트가 떠 있는 동안에도
    // 기본정보 탭에서 고쳐 저장하면 바뀔 수 있다(always-mounted, 코드 리뷰로 찾음, 2026-10-23). 그 최신
    // 값은 화면 표시(대표자 연락처·이메일의 "기본정보와 동일" 칸)와 저장(toUpdateBpProfileInput)이 매 렌더
    // 그대로 읽는다 — 여기서 쓰는 건 처음 조회 한 번뿐이라 깊이 의존하지 않아도 된다.
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
    setVerifyFailure(null);
  };

  /** 점포 사업자정보와 같은 동작(store-form-view.tsx handleClearPending) — 칸을 저장된 값으로 되돌린다.
   * 아직 저장한 적 없으면 빈 값으로 돌아간다. 서버는 부르지 않는다 — 저장 전엔 전부 로컬 상태라서다
   * (2026-10-22 사용자 결정). onClear("지우기")와 onRevert("재인증 취소" · "사용안함 취소")가 함께 쓴다 —
   * pendingClear 도 끈다("사용안함"으로 연 상태를 되돌릴 때). */
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
            pendingClear: false,
          }
        : f,
    );
    setVerifyErrors({});
    setVerifyFailure(null);
    setVerifyEditing(false);
  };

  /** "사용안함" — 확인창 없이 바로 pendingClear 를 켠다(2026-10-23 사용자 지정). 칸 값은 지우지 않고
   * 그대로 둔 채(아래 setVerifyForm) 상자가 struck 로 취소선을 긋고 읽기 전용으로 바꾼다 — 재인증처럼
   * 칸을 열어 고치는 게 아니다. 서버는 부르지 않는다(인증 · 재인증과 같은 두 단계) — 전체 "저장"을 눌러야
   * clearBusinessVerification 으로 실제 반영된다. "사용안함 취소"는 clearVerify 가 그대로 맡는다(재인증
   * 취소와 같은 복귀 — 저장된 값으로 되돌리고 pendingClear 도 끈다). */
  const handleClearSaved = () => {
    verifyNumber.current++;
    // 칸 값은 그대로 둔다 — 지워질 저장된 값에 취소선을 그어 보여준다(입력칸이 아니다, 2026-10-23 사용자 지정).
    setVerifyForm((f) => (f ? { ...f, verification: null, pendingClear: true } : f));
    setVerifyErrors({});
    setVerifyFailure(null);
  };

  // 점포 사업자정보 인증(store-form-view.tsx handleVerify)과 같은 분류(bizVerifyFailure) — 번호 중복(409)만
  // 사업자등록번호 칸 아래에 붙이고, 국세청 불일치(422) · 연동 장애(503) · 한도 초과(429) · 그 밖의 실패는
  // 특정 칸 탓이 아니라서 상자 맨 아래 한 줄(verifyFailure → boxError)로 보인다. 전엔 불일치를 대표자명
  // 칸에 붙였는데, 실제로 틀린 게 대표자명이 아니어도(예: 개업일자) 대표자명만 빨갛게 보여 헷갈렸다
  // (코드 리뷰로 찾음, 2026-10-23). 성공해도 저장하지 않는다 — 받은 토큰을 verification 으로 들고 있다가
  // 전체 저장에 싣는다.
  const handleVerify = () => {
    if (!verifyForm) return;
    const found = validateVerifyForm(verifyForm);
    setVerifyErrors(found);
    setVerifyFailure(null);
    if (Object.keys(found).length) return;
    const requested = toVerifyInput(verifyForm);
    const startedAt = Date.now();
    const mine = ++verifyNumber.current;
    startVerifying(async () => {
      const result = await verifyBpBusinessAction(requested).catch((error: unknown) => {
        console.error("사업자 번호 인증 호출 실패", error);
        return { ok: false as const, status: undefined, message: "" };
      });
      // 기다리는 사이 칸을 고쳤으면 이 응답은 옛 값의 것이다 — 버린다.
      if (mine !== verifyNumber.current) return;
      if (!result.ok) {
        // 로그인 만료(401) · 형식(400) · 권한(403) · 계정 없음(404)은 할 일을 알리는 api 문구라 그대로 보인다
        // (점포 store-form-view.tsx keepApiText 와 같다, 코드 리뷰로 찾음 — 전엔 이 네 상태도 bizVerifyFailure
        // 를 타서 "확인하지 못했습니다" 기본 문구로 뭉개졌다)
        const keepApiText = result.status === 400 || result.status === 401 || result.status === 403 || result.status === 404;
        const failure = keepApiText ? { field: null, message: result.message } : bizVerifyFailure(result.status);
        if (failure.field) return setVerifyErrors((e) => ({ ...e, bizRegistrationNumber: failure.message }));
        return setVerifyFailure(failure.message);
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
    // 인증 10분이 지났으면 저장 직전에 풀어 둔다(점포 store-form-view.tsx handleSave 와 같다, 코드 리뷰로
    // 찾음, 2026-10-23) — 그대로 두고 보내면 api BusinessVerificationService 가 토큰을 트랜잭션보다 먼저
    // 검사해 저장 전체를 막는다(상호명 등 무관한 칸까지). effective 를 쓰면 이번 호출에서만 비운 값으로
    // 나가고, 화면 상태는 아래서 한 번에 반영한다.
    const effective = expireVerification(verifyForm, Date.now());
    const expired = effective !== verifyForm;
    if (expired) {
      verifyNumber.current++;
      setVerifyForm(effective);
    }
    const unverified = hasUnverifiedChange(effective);
    if (unverified) {
      setVerifyEditing(true);
      // 사업자등록번호 칸에 붙이던 것을 상자 맨 아래 한 줄로 — 안 바뀐 칸은 대표자명 · 개업일자일 수도 있어
      // 특정 칸 탓이 아니다(422 처리와 같은 이유, 코드 리뷰로 찾음, 2026-10-23). 문구도 점포와 같은
      // BIZ_MESSAGE.UNVERIFIED/EXPIRED 로 — 전엔 같은 뜻의 로컬 상수를 따로 뒀다.
      setVerifyFailure(expired ? BIZ_MESSAGE.EXPIRED : BIZ_MESSAGE.UNVERIFIED);
    }
    if (Object.keys(found).length || unverified) return focusFirstError(document.getElementById(ids));
    startSaving(async () => {
      try {
        const result = await updateBpProfileAction(toUpdateBpProfileInput(form, updatedAt, basicPhone, basicEmail, effective));
        if (!result.ok) {
          const field = serverErrorField(result.status, result.message);
          if (!field) return setFailure(result.message);
          setErrors((e) => ({ ...e, [field]: result.message }));
          return focusFirstError(document.getElementById(ids));
        }
      } catch (error: unknown) {
        console.error("사업자정보 저장 호출 실패", error);
        setFailure("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      // 저장은 이미 끝났다 — 뒤이은 다시 불러오기가 실패해도 저장이 안 된 것처럼 알리지 않는다(코드 리뷰로
      // 찾음, 2026-10-23 — 전엔 둘을 한 try 로 묶어 저장 뒤 불러오기만 실패해도 "저장 결과를 확인하지
      // 못했습니다"가 떠, 다시 저장을 누르면 이미 반영된 updatedAt·토큰으로 409 가 났다). 화면은 다시 열어야
      // 최신값을 받으므로 그렇게 안내한다.
      toast("saved");
      try {
        const refreshed = await getBpProfileAction();
        if (refreshed.ok) {
          setUpdatedAt(refreshed.profile.updatedAt);
          setForm(formOf(refreshed.profile, basicPhone, basicEmail));
          setVerifyForm(verifyFormOf(refreshed.profile));
          setVerifyEditing(false);
        } else {
          console.error("사업자정보 저장 후 다시 불러오기 실패", refreshed.status, refreshed.message);
          setFailure("저장했지만 최신 정보를 불러오지 못했습니다. 패널을 닫았다 다시 열어 주세요.");
        }
      } catch (error: unknown) {
        console.error("사업자정보 저장 후 다시 불러오기 호출 실패", error);
        setFailure("저장했지만 최신 정보를 불러오지 못했습니다. 패널을 닫았다 다시 열어 주세요.");
      }
    });
  };

  useImperativeHandle(ref, () => ({ save: handleSave }));

  if (loadFailure) return <FailedBand title={loadFailure} />;
  if (!form || !verifyForm) return <p className="text-erp-muted">불러오는 중입니다.</p>;

  const verified = isVerified(verifyForm);
  const pending = hasPendingVerification(verifyForm);
  // pendingClear("사용안함")도 editing 에 들어간다 — 칸을 고칠 수 있게 여는 게 아니라(상자가 struck 로
  // 읽기 전용으로 바꾼다), locked · savedLocked 를 꺼서 onRevert("사용안함 취소")가 나오고 onClearSaved
  // ("사용안함")는 숨게 하기 위해서다(2026-10-23 사용자 지정).
  const editing = verifyEditing || verifyForm.pendingClear;
  const locked = verified && !editing;
  // 점포(store-form-view.tsx savedLocked)와 같다 — locked 와 달리 pending 을 뺀다. 재인증을 통과했지만
  // 아직 저장하지 않은 상태(pending)는 locked 가 true 라도 "되돌리기"로 그 새 인증을 버리고 저장된
  // 값으로 바로 돌아갈 수 있어야 한다(코드 리뷰로 찾음, 2026-10-23 — 전엔 locked 를 그대로 써서 pending
  // 일 때 onRevert 가 사라지고 [재인증]을 다시 눌러야만 되돌릴 길이 열렸다).
  const savedLocked = Boolean(verifyForm.savedBizNumber) && !editing && !pending;
  // 비어 있어서 걸린 칸은 칸 아래가 아니라 한 줄 안내로 모은다 — 칸 아래에는 형식 오류 · api 문구만 남는다
  // (BizVerificationBox 가 missing 과 fieldErrors 를 받아 이 가름을 그 안에서 한다)
  const emptyErrored = emptyVerifyFields(verifyForm).filter((key) => verifyErrors[key]);
  const hasVerifyInput = emptyVerifyFields(verifyForm).length < 3;
  // 점포(store-form-view.tsx showBizClear)와 같은 기준 — 상자의 "지우기"는 아직 저장한 적 없는(비어
  // 있던) 값을 입력하다 마는 경우에만 쓴다. 저장된 값이 있으면 지우기 대신 아래 onRevert("되돌리기")를
  // 쓴다(코드 리뷰로 찾음, 2026-10-23 — 전 버전의 "사용안함"은 잠긴 상태에서 눌러도 아무 일도 안 일어나는
  // 빈 버튼이었다).
  const showClear = !verifyForm.savedBizNumber && hasVerifyInput;
  // 네 화면 공통 상자(BizVerificationBox, S-VRNTHD)가 쓰는 키(BizVerifyField)로 옮긴다 — VERIFY_TO_BIZ 참고
  const bizValues = { bizNumber: verifyForm.bizRegistrationNumber, ceoName: verifyForm.bizCeoName, openDate: verifyForm.bizOpenDate };
  const bizMissing = emptyErrored.map((key) => VERIFY_TO_BIZ[key]);
  const bizFieldErrors: Partial<Record<BizVerifyField, string>> = {};
  (Object.keys(BIZ_TO_VERIFY) as BizVerifyField[]).forEach((biz) => {
    const key = BIZ_TO_VERIFY[biz];
    if (!emptyErrored.includes(key) && verifyErrors[key]) bizFieldErrors[biz] = verifyErrors[key];
  });

  return (
    <div id={ids} className="flex flex-col gap-[18px]">
      {/* 상자는 네 화면 공통(BizVerificationBox, S-VRNTHD) — 세 칸을 한 줄에 나란히 둔다(layout="row",
          점포와 같은 배치, 2026-10-23 사용자 지정). "사용안함"은 확인창 없이 바로 struck(취소선 ·
          읽기 전용)으로 바꾸고, 되돌리기 버튼("사용안함 취소") 하나로 되돌린다(2026-10-23 사용자 지정
          — 전엔 확인창 + 별도 카드, 그 다음엔 칸을 비우고 여는 안이었다). */}
      <BizVerificationBox
        layout="row"
        // 좁은 슬라이드 패널 전용 비율 — 회원가입 · 점포는 그대로(2026-10-23 사용자 지정)
        compactRow
        // 머리를 기본정보 탭 「계정 정보」와 같은 회색 제목 바로 뗀다(2026-10-26 사용자 지정)
        titleBar
        values={bizValues}
        onChange={(key, value) => setVerify(BIZ_TO_VERIFY[key], value)}
        locked={{ bizNumber: locked, ceoName: locked, openDate: locked }}
        // 잠겼을 때(일반 잠금 · 사용안함 취소선) 보이는 사업자등록번호는 하이픈을 넣어 보인다(점포와
        // 같다, 코드 리뷰로 찾음, 2026-10-23) — 안 넣으면 values.bizNumber가 하이픈 없이 그대로 보인다.
        // savedBizNumber(서버 값)가 아니라 지금 칸 값(verifyForm.bizRegistrationNumber)으로 만든다 — 다른
        // 번호로 재인증에 성공한 뒤(pending, 아직 저장 전) locked 가 true 가 되는데, savedBizNumber 를 쓰면
        // 옛 번호가 보여 "안 바뀌었다"고 믿고 저장하면 실제론 새 번호가 저장되는 화면·실제 값 불일치가
        // 생겼다(ip-code-review-claude 적대적 리뷰로 찾음, 2026-10-23). locked=true 인 동안은 칸을 못 고치므로
        // 지금 칸 값이 savedLocked·pending 둘 다에서 항상 맞는 값이다.
        lockedDisplay={verifyForm.bizRegistrationNumber ? { bizNumber: formatBizNumber(verifyForm.bizRegistrationNumber) } : {}}
        // "사용안함"을 누르면 입력칸 대신 지워질 저장된 값에 취소선을 긋고, 인증하기 버튼도 숨긴다(2026-10-23 사용자 지정)
        struck={verifyForm.pendingClear}
        // 상자에 넘기는 verified 는 "지금 잠겨서 보이는가"다(locked) — 원본 isVerified(verifyForm)
        // 가 아니다. 재인증을 열거나(verifyEditing) 사용안함을 누르면(pendingClear) 서버엔 여전히
        // 인증된 값이 남아 있어도 화면은 "미인증"으로 보여야 버튼이 재인증→인증하기로 바뀐다(점포
        // store-form-view.tsx 의 verified = pending || savedLocked 와 같다, 코드 리뷰로 찾음, 2026-10-23).
        verified={locked}
        // pending(재인증은 통과했지만 아직 저장 전)일 때 저장된 옛 인증일자를 보이면 "지금 보이는 값이
        // 이 날짜에 인증됐다"로 잘못 읽힌다 — savedLocked 일 때만 보인다(점포와 같다, 코드 리뷰로 찾음, 2026-10-23)
        verifiedDate={savedLocked && verifyForm.savedVerifiedAt ? formatDate(verifyForm.savedVerifiedAt) : ""}
        verifying={verifying}
        fieldErrors={bizFieldErrors}
        missing={bizMissing}
        boxError={verifyFailure}
        // 잠겼을 때(인증 완료, 재인증·사용안함 전) 누르면 재인증하려고 칸을 연다 — 점포(store-form-view.tsx
        // handleReverify)와 같은 패턴. 열린 뒤에는 실제 인증 요청(handleVerify)으로 바뀐다. struck 일
        // 때는 상자가 인증하기 버튼 자체를 숨기므로(!struck) 이 onVerify 는 안 쓰인다 — 재인증으로
        // 바꿔 타려면 먼저 "사용안함 취소"로 되돌려야 한다.
        onVerify={locked ? () => setVerifyEditing(true) : handleVerify}
        onClear={clearVerify}
        showClear={showClear}
        // 재인증 중이거나 사용안함을 누른 뒤(pendingClear)만 — 눌러도 저장된 값은 그대로 두고 칸·잠금만
        // 그 값으로 되돌린다. 문구만 상황에 맞게 가른다(핸들러는 같다 — clearVerify 가 pendingClear 도 끈다).
        onRevert={verifyForm.savedBizNumber && !savedLocked ? clearVerify : undefined}
        revertLabel={verifyForm.pendingClear ? "사용안함 취소" : "재인증 취소"}
        // 저장된 값을 아예 지울 수 있는 건 BP 뿐이다(점포는 재인증으로 바꾸기만 된다, 2026-10-23
        // 사용자 결정) — 재인증 버튼 오른쪽에 둔다. 확인창 없이 바로 struck 으로 바꾼다(칸은 비우지 않는다).
        onClearSaved={savedLocked ? handleClearSaved : undefined}
        // pendingClear 는 저장하면 지워진다는 걸 알리는 전용 안내로 바꾼다 — 그 밖엔 공통 안내 +
        // 저장 전 통과 상태 한 줄(사용자 지정, 2026-10-22).
        {...(verifyForm.pendingClear
          ? { guide: "하단의 [저장] 버튼을 클릭하면 인증 정보가 삭제됩니다." }
          : { note: pending ? "저장하면 반영됩니다" : undefined })}
      />

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
                  maxLength={4}
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
        <AddressField
          label="사업자주소"
          value={form.address}
          onChange={(next) => {
            // "address" 는 BpProfileFormField 가 아니다 — 100자 제한 오류는 bizAddressDetail 에 붙으므로
            // set("address", …)의 clearError(key as …) 캐스트는 아무것도 못 지운다(점포 store-form-view.tsx
            // 의 사업자주소 onChange 와 같은 이유로 여기서 직접 지운다, 코드 리뷰로 찾음, 2026-10-23).
            setForm((f) => (f ? { ...f, address: next } : f));
            clearError("bizAddressDetail");
          }}
          detailError={errors.bizAddressDetail}
        />

        {failure && <FailedBand title={failure} />}
      </section>
    </div>
  );
});
