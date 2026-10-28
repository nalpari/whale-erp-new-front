"use client";

import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { Badge, Button, ConfirmDialog, DateField, Field, FormGroup, FormRow, RequiredMark, SlidePanel, Tag, TextField } from "@/components/common";
import { AddressField } from "@/components/address-field";
import {
  bpMasterServerErrorField,
  emailError,
  EMPTY_BP_MASTER_FORM,
  formOfBpMaster,
  hasPendingVerification,
  isVerificationExpired,
  toCreateBpMasterInput,
  toUpdateBpMasterInput,
  validateBpMasterForm,
  verificationErrors,
  verificationRejection,
  verificationValuesOf,
  type BpMasterForm,
  type BpMasterFormErrors,
  type BpMasterFormField,
} from "@/lib/bp-master-form";
import { BIZ_MESSAGE, bizVerifyFailure } from "@/lib/biz-verification-rules";
import type { BpMasterDetail, CreateBpMasterResult } from "@/lib/bp-masters";
import { loginIdError } from "@/lib/platform-admin-form";
import { formatDateTime } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { FailedBand, FieldMessage } from "../platform-admins/admin-parts";
import { checkBpMasterEmailAction, checkBpMasterLoginIdAction,createBpMasterAction, updateBpMasterAction, verifyBpBusinessAction } from "./actions";
import { BpStatusBadge, unknownResult } from "./bp-master-parts";

// BP 마스터 계정 등록(S-OJEYQJ) · 수정(S-CQGGZS) 슬라이드 패널. 패널 폭(464)이라 칸을 한 줄에 하나씩 쌓고,
// 기본정보 / 사업자정보 두 묶음으로 나눈다(데모와 같다, 2026-10-22).
// 사업자 인증은 [사업자 번호 인증하기]로 상자를 펼쳐 한다(데모처럼 처음부터 펼치지 않는다). 인증하면 같은 자리가 읽기 전용 완료 카드가 되고,
// [재인증]은 확인을 한 번 받는다. 번호 중복 · 확인 불가 · 처리 오류여도 인증 없이 저장할 수 있다.
// 수정은 BP 코드 · 아이디 · 가입경로를 보여 주기만 하고, BP 상태는 상세의 [상태 변경]에서만 바꾼다. 마지막 저장이 남는다(409 없음).

/** 아이디 중복 문구 — 저장할 때 api 가 주는 409 문구와 같게 둔다 */
const LOGIN_ID_TAKEN = "이미 사용 중인 아이디입니다. 탈퇴 · 삭제된 계정의 아이디도 다시 쓸 수 없습니다";
/** 이메일 중복 문구 — 저장 409(EMAIL_TAKEN)와 같게 둔다 */
const EMAIL_TAKEN = "사용 중이거나 미사용인 다른 관리자 계정의 이메일입니다";

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다(bp-masters-screen.tsx closeAll). 저장하는 동안은 onClose 처럼 닫히지 않는다 */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
} & (
  | { mode: "create"; bp?: never; onSaved: (result: CreateBpMasterResult) => void }
  | { mode: "edit"; bp: BpMasterDetail; onSaved: () => void }
);

export function BpMasterFormPanel(props: Props) {
  const { id, mode, open, onClose, onBackdropClose, trigger } = props;
  const initialForm = () => (props.mode === "edit" ? formOfBpMaster(props.bp) : EMPTY_BP_MASTER_FORM);
  const [form, setForm] = useState<BpMasterForm>(initialForm);
  const [errors, setErrors] = useState<BpMasterFormErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  /** 진위확인 실패 문구(중복 · 불일치 · 장애) — 인증 상자 아래 한 줄 */
  const [verifyFailure, setVerifyFailure] = useState<string | null>(null);
  const [reverifyAsk, setReverifyAsk] = useState(false);
  // 재인증 확인창은 네이티브 <dialog> 라 패널이 뒤로 가기 등으로 닫혀도 혼자 남는다 — 함께 닫는다
  if (!open && reverifyAsk) setReverifyAsk(false);

  /** 칸별 중복 확인 차례 — 고치거나 다시 물으면 올라가, 앞선 답을 버린다 */
  const checkNumber = useRef({ loginId: 0, email: 0 });
  /** 진위확인 차례 — 세 칸을 고치면 올라가, 기다리던 인증 응답을 버린다(옛 값이 「인증 완료」로 되살아나지 않게) */
  const verifyNumber = useRef(0);

  // 열 때마다 칸을 새로 채운다(취소한 입력을 남기지 않는다). 다시 마운트하면 밀려 나오는 전환이 사라지므로 그리는 중에 값만 되돌린다.
  const [filledFor, setFilledFor] = useState(open);
  const [openCount, setOpenCount] = useState(0);
  if (filledFor !== open) {
    setFilledFor(open);
    if (open) {
      setOpenCount((n) => n + 1);
      setForm(initialForm());
      setErrors({});
      setFailure(null);
      setVerifyFailure(null);
    }
  }

  // 닫기 전에 보낸 진위확인 · 중복 확인의 늦은 응답이 새로 채운 칸에 붙지 않게, 다시 연 직후(페인트 전) 차례를 올린다.
  // 그리는 중에는 ref 를 못 건드려(react-hooks/refs) platform-admins(admin-form-panel.tsx)처럼 layout effect 에서 한다.
  useLayoutEffect(() => {
    if (openCount === 0) return;
    verifyNumber.current++;
    checkNumber.current.loginId++;
    checkNumber.current.email++;
  }, [openCount]);

  const [saving, startSaving] = useTransition();
  const [verifying, startVerifying] = useTransition();
  const router = useRouter();

  const ids = useId();
  const clearError = (key: BpMasterFormField) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const set = <K extends keyof BpMasterForm>(key: K, value: BpMasterForm[K], field?: BpMasterFormField) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (field) clearError(field);
  };
  const invalid = (key: BpMasterFormField) => (errors[key] ? true : undefined);
  const messageId = (key: BpMasterFormField) => `${ids}-${key}`;
  const describe = (key: BpMasterFormField) => (errors[key] ? messageId(key) : undefined);
  const message = (key: BpMasterFormField) => <FieldMessage id={messageId(key)} message={errors[key]} />;

  /** 오류가 생기면 첫 오류 칸으로 커서를 옮긴다 — 패널이 길어 아래 칸 오류는 보이지 않을 수 있다 */
  const focusFirstError = () =>
    requestAnimationFrame(() => (document.getElementById(id)?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());

  const applyServerError = (status: number | undefined, text: string) => {
    const field = bpMasterServerErrorField(status, text, mode);
    if (!field) return setFailure(text);
    setErrors((e) => ({ ...e, [field]: text }));
    focusFirstError();
  };

  /**
   * 아이디(등록만) · 이메일 중복 확인 — 칸을 벗어나거나 Enter 를 칠 때. 플랫폼 관리자 · BP 관리자 등록과 같은 규칙이다.
   * 이메일 확인은 자기 계정을 빼지 않으므로, 수정에서 원래 이메일 그대로면 묻지 않는다.
   */
  const checkAvailable = (key: "loginId" | "email", raw: string) => {
    const value = key === "email" ? raw.trim().toLowerCase() : raw.trim();
    if (!value || (key === "loginId" && mode !== "create")) return;
    if (key === "email" && props.mode === "edit" && value === (props.bp.email ?? "").toLowerCase()) return;
    const formatError = key === "loginId" ? loginIdError(raw) : emailError(raw);
    if (formatError) return setErrors((e) => ({ ...e, [key]: formatError }));
    const what = key === "loginId" ? "아이디" : "이메일";
    const mine = ++checkNumber.current[key];
    (key === "loginId" ? checkBpMasterLoginIdAction : checkBpMasterEmailAction)(value)
      .then((result) => {
        if (mine !== checkNumber.current[key]) return;
        if (result.ok) {
          if (!result.available) setErrors((e) => ({ ...e, [key]: key === "loginId" ? LOGIN_ID_TAKEN : EMAIL_TAKEN }));
        } else if (result.status === 400) setErrors((e) => ({ ...e, [key]: result.message }));
        else if (result.status === 401) setFailure(result.message);
        else console.warn(`${what} 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다`, result.status, result.message);
      })
      .catch((error: unknown) => console.warn(`${what} 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다`, error));
  };

  /** 진위확인 칸을 고치면 기다리던 응답은 버리고 그 칸 오류 · 실패 문구를 지운다 */
  const setVerification = (key: "bizNumber" | "ceoName" | "openDate", value: string) => {
    verifyNumber.current++;
    set(key, value, key);
    setVerifyFailure(null);
  };

  const openVerification = () => {
    // 재인증은 저장된 값을 채워 열어 고칠 칸만 고치게 한다
    setForm((f) => ({ ...f, verifying: true, bizNumber: f.verified?.bizNumber ?? "", ceoName: f.verified?.ceoName ?? "", openDate: f.verified?.openDate ?? "" }));
    setVerifyFailure(null);
  };
  const closeVerification = () => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, verifying: false, bizNumber: "", ceoName: "", openDate: "" }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !["bizNumber", "ceoName", "openDate"].includes(k))));
    setVerifyFailure(null);
  };

  const handleVerify = () => {
    const found = verificationErrors(form);
    setErrors((e) => ({ ...e, ...found }));
    if (Object.keys(found).length) return focusFirstError();
    const values = verificationValuesOf(form);
    const mine = ++verifyNumber.current;
    // 10분은 요청을 보내기 직전부터 잰다 — api 는 그 뒤에 서명하니 화면이 먼저 만료로 본다(biz-verification-rules.ts)
    const verifiedAt = Date.now();
    startVerifying(async () => {
      const result = await verifyBpBusinessAction({
        bizRegistrationNumber: values.bizNumber,
        bizCeoName: values.ceoName,
        bizOpenDate: values.openDate,
        ...(props.mode === "edit" ? { bpCodeId: props.bp.bpCodeId } : {}),
      }).catch((error: unknown) => {
        // 진위확인은 저장이 아니라 다시 받을 화면이 없다 — unknownResult 의 「화면을 새로 받았으니」 문구를 쓰지 않는다
        console.error("BP 마스터 계정 사업자정보 인증 호출 실패", error);
        return { ok: false as const, status: undefined, message: "사업자정보를 인증하지 못했습니다. 잠시 후 다시 시도해 주세요." };
      });
      if (mine !== verifyNumber.current) return;
      if (!result.ok) {
        // 로그인 만료(401) · 권한 없음(403) · 입력 형식(400)은 api 문구 그대로 — 401 · 403 은 저장도 막혀 「인증 없이 저장」을 붙이지 않는다.
        // 그 밖은 점포 · 회원가입과 같은 글자가 보이도록 상태 코드로 공통 문구를 고른다(bizVerifyFailure, S-VRNTHD)
        if (result.status === 401 || result.status === 403) return setVerifyFailure(result.message);
        const text = result.status === 400 ? result.message : bizVerifyFailure(result.status).message;
        return setVerifyFailure(`${text} 인증 없이도 저장할 수 있습니다.`);
      }
      setVerifyFailure(null);
      setForm((f) => ({ ...f, verifying: false, verified: { ...values, token: result.verificationToken, verifiedAt }, bizNumber: "", ceoName: "", openDate: "" }));
    });
  };

  /**
   * 이번 화면에서 받은 인증을 버린다 — 등록은 미인증으로, 수정은 저장돼 있던 인증으로 돌아간다. 띠에 이유와 다음 길을 알린다.
   * 점포 · 회원가입처럼 만료 · 번호 중복으로 쓸 수 없는 인증을 화면에 남겨 두지 않는다(그대로면 저장이 같은 이유로 계속 거절된다).
   */
  const releaseVerification = (reason: string) => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, verified: props.mode === "edit" ? formOfBpMaster(props.bp).verified : null }));
    setFailure(`${reason} 다시 인증하거나 인증 없이 저장할 수 있습니다.`);
  };

  const handleSave = () => {
    const found = validateBpMasterForm(form, mode);
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) return focusFirstError();
    // 펼친 상자의 값은 인증해야만 저장된다 — 그대로 저장하면 적은 값이 말없이 사라진다
    if (hasPendingVerification(form)) {
      return setFailure("인증하지 않은 사업자등록번호 · 대표자명 · 개업일자는 저장되지 않습니다. [인증하기]를 누르거나 인증 상자를 닫은 뒤 저장해 주세요.");
    }
    if (isVerificationExpired(form, Date.now())) return releaseVerification(BIZ_MESSAGE.EXPIRED);

    startSaving(async () => {
      if (props.mode === "create") {
        const result = await createBpMasterAction(toCreateBpMasterInput(form)).catch(unknownResult("등록"));
        if (!result.ok) {
          // 결과를 모르면 목록을 새로 받아, 이미 만들어졌는지 사용자가 볼 수 있게 한다
          if (result.status === undefined) router.refresh();
          const rejected = verificationRejection(form, result.status, result.message);
          return rejected ? releaseVerification(rejected) : applyServerError(result.status, result.message);
        }
        return props.onSaved(result);
      }
      const result = await updateBpMasterAction(props.bp.bpCodeId, toUpdateBpMasterInput(form)).catch(unknownResult("수정"));
      if (result.ok) return props.onSaved();
      // 결과를 모름 · 그 사이 탈퇴(409) · 지움(404)이면 상세를 다시 받는다
      const rejected = verificationRejection(form, result.status, result.message);
      if (rejected) return releaseVerification(rejected);
      if (result.status === undefined || result.status === 404 || result.status === 409) router.refresh();
      applyServerError(result.status, result.message);
    });
  };

  // 저장하는 동안은 Esc · 바탕 클릭으로도 닫히지 않는다(admin-form-panel.tsx 와 같다)
  // 재인증 확인창(<dialog>) 안의 Esc 는 확인창만 닫는다 — SlidePanel 의 문서 Esc 도 같이 받아 패널까지 닫히던 것을 막는다(상세의 dismissDetail 과 같다)
  const safeClose = () => {
    if (!saving && !document.querySelector("dialog[open]")) onClose();
  };

  const title = mode === "create" ? "BP 마스터 계정 등록" : "BP 마스터 계정 수정";
  const verified = Boolean(form.verified);
  const verifyErrorId = `${ids}-verify`;

  return (
    // 등록 · 수정 모두 바탕창을 깔고, 바탕을 누르면 겹친 패널을 모두 닫는다(platform-admins 와 같다, 2026-10-22 사용자 요청).
    // 등록은 바깥을 잘못 누르면 입력이 사라진다 — 알고 고른 것이다.
    <SlidePanel
      id={id}
      open={open}
      onClose={safeClose}
      onBackdropClose={() => {
        if (!saving) onBackdropClose();
      }}
      label={title}
      trigger={trigger}
      closeOnBackdrop
    >
      <h2 className="text-[18px] font-semibold text-erp-ink">
        {title}
        {props.mode === "edit" && (
          <span className="ml-[6px] inline-flex">
            <Tag>
              BP 코드 · <b className="font-semibold">{props.bp.bpCode}</b>
            </Tag>
          </span>
        )}
      </h2>
      {failure && <FailedBand message={failure} detail="입력한 값은 그대로 두었습니다." />}

      <FormGroup title="기본정보">
        {props.mode === "create" ? (
          <Stack>
            <Field label="아이디" required>
              <TextField
                value={form.loginId}
                onChange={(e) => {
                  checkNumber.current.loginId++;
                  set("loginId", e.target.value, "loginId");
                }}
                onBlur={(e) => checkAvailable("loginId", e.currentTarget.value)}
                onKeyDown={(e) => {
                  // 한글 조합 중 Enter 는 글자 확정이라 넘긴다
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  checkAvailable("loginId", e.currentTarget.value);
                }}
                maxLength={20}
                placeholder="영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요."
                aria-invalid={invalid("loginId")}
                aria-describedby={describe("loginId")}
                aria-required
                autoComplete="off"
              />
            </Field>
            {message("loginId")}
          </Stack>
        ) : (
          <>
            <Field label="아이디">
              <TextField value={props.bp.loginId} readOnly />
            </Field>
            <Field label="가입경로">
              <TextField value={props.bp.joinPath === "SIGNUP" ? "회원가입" : "플랫폼등록"} readOnly />
            </Field>
          </>
        )}
        <Stack>
          <Field label="이름" required>
            <TextField
              value={form.name}
              onChange={(e) => set("name", e.target.value, "name")}
              maxLength={20}
              placeholder="한글 또는 영문 2~20자로 입력해 주세요."
              aria-invalid={invalid("name")}
              aria-describedby={describe("name")}
              aria-required
            />
          </Field>
          {message("name")}
        </Stack>
        <PhoneGroup label="연락처" required value={form.phone} onChange={(v) => set("phone", v, "phone")} invalid={invalid("phone")} describedBy={describe("phone")} />
        {message("phone")}
        <Stack>
          <Field label="이메일" required>
            <TextField
              type="email"
              value={form.email}
              onChange={(e) => {
                checkNumber.current.email++;
                set("email", e.target.value, "email");
              }}
              onBlur={(e) => checkAvailable("email", e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                checkAvailable("email", e.currentTarget.value);
              }}
              maxLength={100}
              aria-invalid={invalid("email")}
              aria-describedby={describe("email")}
              aria-required
            />
          </Field>
          {message("email")}
        </Stack>
        {props.mode === "edit" && (
          <Stack>
            <span className="text-[14px] font-medium text-erp-label">상태</span>
            <span className="flex items-center gap-[6px] text-[14px] text-erp-ink">
              <BpStatusBadge status={props.bp.accountStatus} />
              {props.bp.statusChangedAt && <span className="text-erp-label">{formatDateTime(props.bp.statusChangedAt)} 부터</span>}
            </span>
            <Note>상태는 여기서 바꾸지 않습니다. 상세의 상태 줄 [상태 변경]에서 사용 · 미사용을 바꿉니다.</Note>
          </Stack>
        )}
      </FormGroup>

      <FormGroup
        title={
          <>
            사업자정보
            <span className="ml-[10px] inline-flex align-middle">
              {verified ? <Badge tone="on">인증완료</Badge> : <Badge tone="off">미인증</Badge>}
            </span>
          </>
        }
      >
        {form.verifying ? (
          <Stack>
            <Field label="사업자등록번호">
              <TextField
                value={form.bizNumber}
                onChange={(e) => setVerification("bizNumber", e.target.value.replace(/[^0-9-]/g, ""))}
                placeholder="숫자 10자리"
                maxLength={12}
                inputMode="numeric"
                aria-invalid={invalid("bizNumber")}
                aria-describedby={describe("bizNumber") ?? (verifyFailure ? verifyErrorId : undefined)}
              />
            </Field>
            {message("bizNumber")}
            <Field label="대표자명">
              <TextField
                value={form.ceoName}
                onChange={(e) => setVerification("ceoName", e.target.value)}
                placeholder="대표자 이름"
                maxLength={50}
                aria-invalid={invalid("ceoName")}
                aria-describedby={describe("ceoName")}
              />
            </Field>
            {message("ceoName")}
            <Labeled label="개업일자">
              <DateField value={form.openDate} onChange={(v) => setVerification("openDate", v)} aria-label="개업일자" />
            </Labeled>
            {message("openDate")}
            {verifyFailure && (
              <p id={verifyErrorId} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
                {verifyFailure}
              </p>
            )}
            <div className="flex justify-end gap-[6px]">
              <Button variant="off" onClick={closeVerification} disabled={verifying}>
                취소
              </Button>
              <Button variant="soft" onClick={handleVerify} disabled={verifying}>
                인증하기
              </Button>
            </div>
            <Note>
              사업자등록번호 · 대표자명 · 개업일자가 국세청에 등록된 정보와 일치하는지 확인합니다.
              {/* 점포 수정(store-form-view.tsx)과 같은 문구 */}
              {mode === "edit" && verified && " 인증 실패 시 기존 정보가 유지됩니다."}
            </Note>
          </Stack>
        ) : form.verified ? (
          <Stack>
            <div className="flex flex-col gap-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px] text-[14px]">
              <Line label="사업자등록번호" value={formatBizNumber(form.verified.bizNumber)} />
              <Line label="대표자명" value={form.verified.ceoName} />
              <Line label="개업일자" value={form.verified.openDate} />
            </div>
            <div className="flex justify-end">
              <Button variant="soft" onClick={() => setReverifyAsk(true)}>
                재인증
              </Button>
            </div>
            {mode === "edit" && form.verified.token && <Note>인증 결과는 저장해야 반영됩니다.</Note>}
          </Stack>
        ) : (
          <Stack>
            <div className="flex justify-start">
              <Button variant="soft" onClick={openVerification}>
                사업자 번호 인증하기
              </Button>
            </div>
            <Note>사업자 인증은 선택입니다. 인증하면 사업자등록번호 · 대표자명 · 개업일자가 채워집니다.</Note>
          </Stack>
        )}
        {/* 성공은 화면이 완료 카드로 바뀌는 것으로 보여 주고, 화면 낭독기에만 알린다(점포 등록과 같다) */}
        <span role="status" className="sr-only">
          {form.verified?.token ? "사업자정보 인증이 완료되었습니다." : ""}
        </span>

        <Stack>
          <Field label="상호명" required>
            <TextField
              value={form.tradeName}
              onChange={(e) => set("tradeName", e.target.value, "tradeName")}
              maxLength={50}
              placeholder="50자 이내로 입력해 주세요."
              aria-invalid={invalid("tradeName")}
              aria-describedby={describe("tradeName")}
              aria-required
            />
          </Field>
          {message("tradeName")}
        </Stack>
        <PhoneGroup label="대표자 연락처" value={form.ceoPhone} onChange={(v) => set("ceoPhone", v, "ceoPhone")} invalid={invalid("ceoPhone")} describedBy={describe("ceoPhone")} />
        {message("ceoPhone")}
        <Stack>
          <Field label="대표자 이메일">
            <TextField
              type="email"
              value={form.ceoEmail}
              onChange={(e) => set("ceoEmail", e.target.value, "ceoEmail")}
              maxLength={100}
              aria-invalid={invalid("ceoEmail")}
              aria-describedby={describe("ceoEmail")}
            />
          </Field>
          {message("ceoEmail")}
        </Stack>
        <FormRow>
          <Field label="업태">
            <TextField value={form.category} onChange={(e) => set("category", e.target.value, "category")} maxLength={50} aria-invalid={invalid("category")} aria-describedby={describe("category")} />
          </Field>
          <Field label="종목">
            <TextField value={form.item} onChange={(e) => set("item", e.target.value, "item")} maxLength={50} aria-invalid={invalid("item")} aria-describedby={describe("item")} />
          </Field>
        </FormRow>
        {message("category")}
        {message("item")}
        <AddressField
          key={openCount}
          label="사업자주소"
          value={{ zipCode: form.zipCode, address: form.address, addressDetail: form.addressDetail }}
          onChange={(a) => {
            setForm((f) => ({ ...f, ...a }));
            clearError("addressDetail");
          }}
          detailError={errors.addressDetail}
        />
      </FormGroup>

      {mode === "create" ? (
        <Note>BP 마스터 계정의 초기 비밀번호는 등록한 이메일로 발송됩니다. 권한 그룹은 BP 마스터 기본 권한으로 정해지고, 약관 동의는 첫 로그인 때 받습니다.</Note>
      ) : (
        <Note>정보를 고칠 때 사유는 받지 않습니다. 여럿이 같은 BP 를 고치면 마지막에 저장한 내용이 남습니다.</Note>
      )}

      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving || verifying}>
          저장
        </Button>
      </div>

      <ConfirmDialog
        open={reverifyAsk}
        title="사업자정보를 다시 인증하시겠습니까?"
        confirmLabel="재인증"
        onConfirm={() => {
          setReverifyAsk(false);
          openVerification();
        }}
        onCancel={() => setReverifyAsk(false)}
      >
        <p>
          {mode === "edit"
            ? "새 값으로 인증에 성공하고 저장해야 바뀝니다. 실패하거나 취소하면 저장된 사업자정보는 그대로입니다."
            : "지금 인증한 사업자등록번호 · 대표자명 · 개업일자로 다시 확인합니다. 인증에 성공해야 새 값이 쓰입니다."}
        </p>
      </ConfirmDialog>
    </SlidePanel>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-[8px]">{children}</div>;
}

/** 입력칸 하나를 감싸지 않는 칸(날짜 · 상태 표시)의 라벨 */
function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-label">{label}</span>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-[10px]">
      <span className="w-[100px] shrink-0 text-erp-label">{label}</span>
      <span className="text-erp-ink">{value}</span>
    </p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
}

/** 연락처 세 칸. Field 는 라벨이 입력칸 하나를 감싸므로 묶음 이름만 단다(admin-form-panel.tsx 의 Group 과 같다). */
function PhoneGroup({
  label,
  required,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  label: string;
  required?: boolean;
  value: [string, string, string];
  onChange: (next: [string, string, string]) => void;
  invalid?: true;
  describedBy?: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-label">
        {label}
        {required && <RequiredMark />}
      </span>
      <FormRow>
        {(["앞자리", "가운데자리", "끝자리"] as const).map((part, i) => (
          <TextField
            key={part}
            value={value[i]}
            onChange={(e) => {
              const next = [...value] as [string, string, string];
              next[i] = e.target.value.replace(/[^0-9]/g, "");
              onChange(next);
            }}
            inputMode="numeric"
            // 1팀 연락처는 숫자 9~12자리(0505 같은 4자리 앞자리 포함) — platform-admins 와 같게 칸마다 4자리까지
            maxLength={4}
            aria-label={`${label} ${part}`}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-required={required || undefined}
          />
        ))}
      </FormRow>
    </div>
  );
}
