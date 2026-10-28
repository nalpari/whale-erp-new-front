"use client";

import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { Button, Checkbox, ConfirmDialog, Field, FormGroup, FormRow, RequiredMark, SlidePanel, Tag, TextField } from "@/components/common";
import { AddressField } from "@/components/address-field";
import { BizVerificationBox } from "@/components/site/biz-verification-box";
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
import { BIZ_MESSAGE, bizVerifyFailure, type BizVerifyField } from "@/lib/biz-verification-rules";
import type { BpMasterDetail, CreateBpMasterResult } from "@/lib/bp-masters";
import { loginIdError, type LoginIdCheck } from "@/lib/platform-admin-form";
import { formatDate } from "@/lib/format";
import { formatBizNumber } from "@/lib/store-view";
import { EmailAvailability, FailedBand, FieldMessage, LoginIdAvailability } from "../platform-admins/admin-parts";
import { checkBpMasterEmailAction, checkBpMasterLoginIdAction,createBpMasterAction, updateBpMasterAction, verifyBpBusinessAction } from "./actions";
import { BpStatusBadge, unknownResult } from "./bp-master-parts";

// BP 마스터 계정 등록(S-OJEYQJ) · 수정(S-CQGGZS) 슬라이드 패널. 패널 폭(464)이라 칸을 한 줄에 하나씩 쌓고,
// 기본정보 / 사업자정보 두 묶음으로 나눈다(데모와 같다, 2026-10-22).
// 사업자정보는 MY PAGE 사업자정보 탭과 같은 모양이다(2026-10-28 사용자 지정 — 전엔 [사업자 번호 인증하기]로 상자를 펼쳤다):
// 공통 인증 상자(BizVerificationBox, 세 칸 한 줄)가 처음부터 열려 있고, 인증하면 칸이 잠긴다. [재인증]은 확인을 한 번 받는다.
// 상호명부터는 따로 카드이고, 대표자 연락처 · 이메일에 「기본정보와 동일」이 있다. 번호 중복 · 확인 불가 · 처리 오류여도 인증 없이 저장할 수 있다.
// 수정은 BP 코드를 제목 옆에 보여 주기만 하고(아이디 · 가입경로 칸은 2026-10-28 사용자 지정으로 뺐다), BP 상태는 상세의 [BP 상태 변경]에서만 바꾼다. 마지막 저장이 남는다(409 없음).

/** 아이디 중복 문구 — 칸을 벗어날 때 중복 확인에 보인다. 저장 409 는 api 문구 그대로라 다를 수 있다(칸은 「아이디」 포함으로 가른다) */
// 관리자 등록 세 화면(플랫폼 · BP 관리자 · BP 마스터)이 같은 문구(2026-10-28 사용자 지정)
const LOGIN_ID_TAKEN = "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.";
/** 이메일 중복 문구 — 중복 확인에 보인다. 저장 409 는 api 문구 그대로 */
const EMAIL_TAKEN = "이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요."; // 네 화면 같은 문구(2026-10-28 사용자 지정)

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
  /**
   * 아이디 중복확인 대기 · 성공 · 실패 상태(platform-admins 와 같다). 오류는 errors.loginId 에 두고, 오류를 달 때는 "idle" 로 내린다.
   * 플랫폼 관리자 등록과 같은 문구를 칸 아래에 보인다(2026-10-28 사용자 지정).
   */
  const [loginIdCheck, setLoginIdCheck] = useState<LoginIdCheck>("idle");
  /** 이메일 중복확인 대기 · 성공 · 실패 상태 — 아이디와 같다. 오류는 errors.email 에 둔다(2026-10-28 사용자 지정) */
  const [emailCheck, setEmailCheck] = useState<LoginIdCheck>("idle");
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
      // 되돌린 빈 칸에 이전에 확인했던 "사용가능합니다."가 남지 않게 아이디 · 이메일 확인 표시도 내린다
      setLoginIdCheck("idle");
      setEmailCheck("idle");
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
    // 아이디가 거절됐거나 칸을 가를 수 없는 거절(띠)이면 아이디의 "사용가능합니다."를 내리고 떠 있던 확인 답도 버린다(platform-admins 와 같다)
    if (!field || field === "loginId") {
      checkNumber.current.loginId++;
      setLoginIdCheck("idle");
    }
    // 이메일도 같다(2026-10-28 사용자 지정)
    if (!field || field === "email") {
      checkNumber.current.email++;
      setEmailCheck("idle");
    }
    if (!field) return setFailure(text);
    setErrors((e) => ({ ...e, [field]: text }));
    focusFirstError();
  };

  /**
   * 아이디(등록만) · 이메일 중복 확인 — 칸을 벗어나거나 Enter 를 칠 때. 플랫폼 관리자 · BP 관리자 등록과 같은 규칙이다.
   * 이메일 확인은 자기 계정을 빼지 않으므로, 수정에서 원래 이메일 그대로면 묻지 않는다.
   * 아이디는 묻는 동안 · 쓸 수 있을 때 · 확인하지 못했을 때(429 · 5xx · 연결)를 칸 아래에 플랫폼 관리자 등록과 같은 문구로
   * 보인다(LoginIdAvailability, 2026-10-28 사용자 지정). 이메일도 같은 세 상태를 이메일 문구로 보인다(EmailAvailability, 2026-10-28 사용자 지정).
   */
  const checkAvailable = (key: "loginId" | "email", raw: string) => {
    const value = key === "email" ? raw.trim().toLowerCase() : raw.trim();
    if (!value || (key === "loginId" && mode !== "create")) return;
    if (key === "email" && props.mode === "edit" && value === (props.bp.email ?? "").toLowerCase()) return;
    const isLoginId = key === "loginId";
    const setCheck = isLoginId ? setLoginIdCheck : setEmailCheck;
    const formatError = isLoginId ? loginIdError(raw) : emailError(raw);
    if (formatError) {
      setCheck("idle");
      return setErrors((e) => ({ ...e, [key]: formatError }));
    }
    const what = isLoginId ? "아이디" : "이메일";
    const mine = ++checkNumber.current[key];
    // 같은 값을 다시 물을 때(Enter 재확인 등)도 앞서 달렸던 오류를 지운다 — 안 그러면 묻는 동안 확인 중 문구 대신 옛 오류가 보인다
    clearError(key);
    setCheck("checking");
    (isLoginId ? checkBpMasterLoginIdAction : checkBpMasterEmailAction)(value)
      .then((result) => {
        if (mine !== checkNumber.current[key]) return;
        if (result.ok) {
          if (!result.available) setErrors((e) => ({ ...e, [key]: isLoginId ? LOGIN_ID_TAKEN : EMAIL_TAKEN }));
          setCheck(result.available ? "available" : "idle");
          return;
        }
        setCheck(result.status === 400 || result.status === 401 ? "idle" : "failed");
        if (result.status === 400) setErrors((e) => ({ ...e, [key]: result.message }));
        else if (result.status === 401) setFailure(result.message);
        else console.warn(`${what} 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다`, result.status, result.message);
      })
      .catch((error: unknown) => {
        if (mine !== checkNumber.current[key]) return;
        setCheck("failed");
        console.warn(`${what} 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다`, error);
      });
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
  /** 세 칸을 비운다. 인증이 있으면(재인증 중) 잠긴 인증으로 돌아가고(재인증 취소), 없으면 빈 칸으로 열어 둔다(지우기) */
  const closeVerification = () => {
    verifyNumber.current++;
    setForm((f) => ({ ...f, verifying: !f.verified, bizNumber: "", ceoName: "", openDate: "" }));
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
    setForm((f) => {
      const verified = props.mode === "edit" ? formOfBpMaster(props.bp).verified : null;
      // 돌아간 인증이 없으면 상자를 다시 연다(처음부터 열려 있는 모양)
      return { ...f, verified, verifying: !verified };
    });
    setFailure(`${reason} 다시 인증하거나 인증 없이 저장할 수 있습니다.`);
  };

  const handleSave = () => {
    const found = validateBpMasterForm(form, mode);
    setErrors(found);
    if (found.loginId) setLoginIdCheck("idle");
    if (found.email) setEmailCheck("idle");
    setFailure(null);
    if (Object.keys(found).length) return focusFirstError();
    // 펼친 상자의 값은 인증해야만 저장된다 — 그대로 저장하면 적은 값이 말없이 사라진다
    if (hasPendingVerification(form)) {
      return setFailure(
        `인증하지 않은 사업자등록번호 · 대표자명 · 개업일자는 저장되지 않습니다. [인증하기]를 누르거나 ${form.verified ? "[재인증 취소]" : "[지우기]"}를 누른 뒤 저장해 주세요.`,
      );
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
  // 인증 상자(BizVerificationBox) — 인증이 있고 재인증 중이 아니면 잠근다. 잠긴 동안 보이는 값은 인증된 세 값이다
  const bizLocked = Boolean(form.verified) && !form.verifying;
  const bizValues =
    bizLocked && form.verified
      ? { bizNumber: form.verified.bizNumber, ceoName: form.verified.ceoName, openDate: form.verified.openDate }
      : { bizNumber: form.bizNumber, ceoName: form.ceoName, openDate: form.openDate };
  // 비어서 걸린 칸은 버튼 위 한 줄로 모으고(missing), 칸 아래에는 형식 오류만 둔다(MY PAGE 와 같다)
  const bizKeys: BizVerifyField[] = ["bizNumber", "ceoName", "openDate"];
  const bizMissing = bizKeys.filter((key) => errors[key] && !bizValues[key].trim());
  const bizFieldErrors: Partial<Record<BizVerifyField, string>> = Object.fromEntries(
    bizKeys.filter((key) => errors[key] && !bizMissing.includes(key)).map((key) => [key, errors[key]]),
  );

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
          <span className="ml-[6px] inline-flex items-center gap-[6px] align-middle">
            <Tag>
              BP 코드 · <b className="font-semibold">{props.bp.bpCode}</b>
            </Tag>
            {/* 계정상태는 고칠 수 없어 칸 대신 제목 줄 배지로만(2026-10-28 사용자 지정 — 전엔 기본정보 안 「계정상태」 칸 · 변경 일시 · 안내) */}
            <BpStatusBadge status={props.bp.accountStatus} />
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
                  setLoginIdCheck("idle");
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
                aria-describedby={describe("loginId") ?? (loginIdCheck !== "idle" ? messageId("loginId") : undefined)}
                aria-busy={loginIdCheck === "checking" || undefined}
                aria-required
                autoComplete="off"
              />
            </Field>
            <LoginIdAvailability id={messageId("loginId")} check={loginIdCheck} message={errors.loginId} />
          </Stack>
        ) : null /* 수정은 아이디 · 가입경로 칸을 두지 않는다 — 바꿀 수 없는 값이라 상세에서 본다(2026-10-28 사용자 지정) */}
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
                setEmailCheck("idle");
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
              aria-describedby={describe("email") ?? (emailCheck !== "idle" ? messageId("email") : undefined)}
              aria-busy={emailCheck === "checking" || undefined}
              aria-required
            />
          </Field>
          <EmailAvailability id={messageId("email")} check={emailCheck} message={errors.email} />
        </Stack>
        {/* 계정상태 칸 대신 안내 한 줄만 — 상태는 제목 줄 배지(2026-10-28 사용자 지정) */}
        {props.mode === "edit" && <Note>계정상태는 상세의 [BP 상태 변경]에서 바꿉니다.</Note>}
      </FormGroup>

      {/* 사업자정보 — MY PAGE 사업자정보 탭과 같은 모양(2026-10-28 사용자 지정): 회색 제목 바(오른쪽 인증 상태) + 세 칸 한 줄 인증 상자 */}
      <BizVerificationBox
        layout="row"
        compactRow
        titleBar
        values={bizValues}
        onChange={(key, value) => setVerification(key, value)}
        locked={{ bizNumber: bizLocked, ceoName: bizLocked, openDate: bizLocked }}
        lockedDisplay={bizValues.bizNumber ? { bizNumber: formatBizNumber(bizValues.bizNumber) } : {}}
        verified={bizLocked}
        // 저장돼 있던 인증만 날짜를 보인다 — 이번 화면에서 받은 인증은 아직 저장 전이다
        verifiedDate={bizLocked && !form.verified?.token && props.mode === "edit" && props.bp.bizVerifiedAt ? formatDate(props.bp.bizVerifiedAt) : ""}
        verifying={verifying}
        fieldErrors={bizFieldErrors}
        missing={bizMissing}
        boxError={verifyFailure}
        // 잠겼을 때 누르면 재인증 확인창, 열렸을 때는 실제 인증 요청
        onVerify={bizLocked ? () => setReverifyAsk(true) : handleVerify}
        onClear={closeVerification}
        showClear={!form.verified && Boolean(form.bizNumber || form.ceoName || form.openDate)}
        // 재인증 중이면 잠긴 인증으로 되돌린다(점포 수정 · MY PAGE 와 같다)
        onRevert={form.verified && form.verifying ? closeVerification : undefined}
        {...(form.verified?.token && !form.verifying
          ? { note: mode === "edit" ? "인증 결과는 저장해야 반영됩니다." : undefined }
          : { note: mode === "edit" && form.verified && form.verifying ? "인증 실패 시 기존 정보가 유지됩니다." : undefined })}
      />

      {/* 상호명부터는 따로 카드 — MY PAGE 와 같은 테두리 · 여백(2026-10-28 사용자 지정) */}
      <section aria-label="상호명 등" className="flex flex-col gap-[18px] rounded-[2px] border border-erp-panel-line bg-white px-[16px] py-[20px]">
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
        <Stack>
          {/* 「기본정보와 동일」이면 기본정보 연락처를 보이고 고칠 수 없다 — 풀면 적던 값으로 돌아온다(MY PAGE 와 같다) */}
          <PhoneGroup
            label="대표자 연락처"
            extra={<Checkbox label="기본정보와 동일" checked={form.sameAsBasicPhone} onChange={(e) => set("sameAsBasicPhone", e.target.checked, "ceoPhone")} />}
            value={form.sameAsBasicPhone ? form.phone : form.ceoPhone}
            onChange={(v) => set("ceoPhone", v, "ceoPhone")}
            readOnly={form.sameAsBasicPhone}
            invalid={invalid("ceoPhone")}
            describedBy={describe("ceoPhone")}
          />
          {message("ceoPhone")}
        </Stack>
        <Stack>
          <LabelWithExtra
            label="대표자 이메일"
            extra={<Checkbox label="기본정보와 동일" checked={form.sameAsBasicEmail} onChange={(e) => set("sameAsBasicEmail", e.target.checked, "ceoEmail")} />}
          >
            <TextField
              type="email"
              value={form.sameAsBasicEmail ? form.email : form.ceoEmail}
              onChange={(e) => set("ceoEmail", e.target.value, "ceoEmail")}
              // 공통 입력칸은 disabled 회색이 없어(DESIGN.md) 읽기 전용 바탕이 깔리는 readOnly 를 함께 건다(MY PAGE 와 같다)
              readOnly={form.sameAsBasicEmail}
              disabled={form.sameAsBasicEmail}
              maxLength={100}
              aria-label="대표자 이메일"
              aria-invalid={invalid("ceoEmail")}
              aria-describedby={describe("ceoEmail")}
            />
          </LabelWithExtra>
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
      </section>

      {/* 등록 안내는 한 줄로 줄였고(권한 그룹 · 약관 동의 안내 삭제), 수정 화면의 「사유는 받지 않습니다 …」 안내는 지웠다(2026-10-28 사용자 지정) */}
      {mode === "create" && (
        <Note>초기화 비밀번호는 등록한 이메일로 발송됩니다.</Note>
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

/** 라벨 오른쪽에 체크박스를 붙이는 칸 — Field 는 라벨이 입력칸 하나를 감싸 체크박스를 둘 수 없다(MY PAGE Labeled 와 같다) */
function LabelWithExtra({ label, extra, children }: { label: string; extra: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
        {label}
        {extra}
      </span>
      {children}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
}

/** 연락처 세 칸. Field 는 라벨이 입력칸 하나를 감싸므로 묶음 이름만 단다(admin-form-panel.tsx 의 Group 과 같다). */
function PhoneGroup({
  label,
  required,
  extra,
  value,
  onChange,
  readOnly,
  invalid,
  describedBy,
}: {
  label: string;
  required?: boolean;
  /** 라벨 오른쪽에 붙는 것(「기본정보와 동일」) */
  extra?: ReactNode;
  value: [string, string, string];
  onChange: (next: [string, string, string]) => void;
  /** 고칠 수 없게(읽기 전용 바탕) — 「기본정보와 동일」 */
  readOnly?: boolean;
  invalid?: true;
  describedBy?: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-[8px]">
      <span className="flex items-center gap-[10px] text-[14px] font-medium text-erp-label">
        <span>
          {label}
          {required && <RequiredMark />}
        </span>
        {extra}
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
            readOnly={readOnly}
            disabled={readOnly}
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
