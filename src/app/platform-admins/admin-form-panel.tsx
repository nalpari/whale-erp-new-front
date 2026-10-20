"use client";

import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { Button, Field, FormGroup, FormRow, RequiredMark, Select, SlidePanel, TextField } from "@/components/common";
import { useAccount, useCodes } from "@/components/site/session-gate";
import { labelOf } from "@/lib/enums";
import {
  EMPTY_FORM,
  emailError,
  formOf,
  loginIdError,
  serverErrorField,
  toCreateInput,
  toUpdateInput,
  validateAdminForm,
  type AdminForm,
  type AdminFormField,
} from "@/lib/platform-admin-form";
import type { PlatformAdminDetail, PlatformRoleGroup } from "@/lib/platform-admins";
import { checkLoginIdAvailableAction, createPlatformAdminAction, updatePlatformAdminAction } from "./actions";
import { AddressField } from "@/components/address-field";
import { EmailFormatValid, FailedBand, FieldMessage, LoginIdAvailability, unknownResult } from "./admin-parts";

// 플랫폼 관리자 등록(S-FOJJKB) · 수정(S-CZGHBS) 슬라이드 패널. 패널 폭(464)이라 칸을 한 줄에 하나씩 쌓는다(데모와 같다).
// 등록에는 상태 · 비밀번호 칸이 없다 — 사용으로 생기고 초기 비밀번호가 등록 이메일로 간다.
// 수정에서 아이디는 읽기 전용이고, 본인 계정은 권한 · 상태를 바꿀 수 없다(칸을 막는다 · api 도 막는다).
// 사용자 권한 선택지는 api 가 준 목록이다 — 플랫폼 관리자에게는 플랫폼 마스터 권한이 빠져 온다.
/** 동시 수정 409 문구(api platform-admins.service). 이때만 최신 정보를 다시 불러온다. */
const STALE = "먼저 수정했습니다";
/** 아이디 중복 문구 — 저장할 때 api 가 주는 409 문구와 같게 둔다. */
const LOGIN_ID_TAKEN = "이미 사용 중인 아이디입니다. 삭제된 계정의 아이디도 다시 쓸 수 없습니다";

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  roleGroups: PlatformRoleGroup[];
} & (
  | { mode: "create"; admin?: never; onSaved: (result: { adminAccountId: number; isMailSent: boolean }) => void; onStale?: never }
  | { mode: "edit"; admin: PlatformAdminDetail; onSaved: () => void; onStale: () => void }
);

export function AdminFormPanel(props: Props) {
  const { id, mode, open, onClose, trigger, roleGroups } = props;
  const me = useAccount();
  // 권한 유형 이름은 로그인 정보의 공통코드 ROLE_TYPE 에서 읽는다(네이밍 규칙 화면 문구)
  const roleTypes = useCodes("ROLE_TYPE");
  const isSelf = mode === "edit" && me.adminAccountId === props.admin.adminAccountId;
  const initialForm = () => (mode === "edit" ? formOf(props.admin) : EMPTY_FORM);
  const [form, setForm] = useState<AdminForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<AdminFormField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  /** 아이디 중복 확인 차례 — 고치거나 다시 물으면(패널을 다시 열어도) 올라가, 앞선 답을 버린다 */
  const checkNumber = useRef(0);
  /** 중복확인 대기·성공 상태(코드 리뷰 반영) — 오류는 기존대로 errors.loginId 에 둔다 */
  const [checkingLoginId, setCheckingLoginId] = useState(false);
  const [loginIdAvailable, setLoginIdAvailable] = useState(false);
  /** 이메일 형식 확인 성공 — api 호출이 없어 아이디처럼 확인 중 차례를 둘 필요가 없다. 오류는 errors.email 에 둔다. */
  const [emailValid, setEmailValid] = useState(false);
  /** 칸을 되돌릴 때마다 올라간다 — 아래 effect 가 이 값을 보고 중복확인 상태 · 차례를 함께 되돌린다 */
  const [resetSignal, setResetSignal] = useState(0);

  // 열 때마다(취소한 입력을 남기지 않는다) · 최신 정보를 다시 받았을 때(동시 수정 409 뒤) 칸을 새로 채운다.
  // 패널을 다시 마운트(key)하면 처음부터 열린 자리에 그려져 밀려 나오는 전환이 사라지므로, 그리는 중에 값만 되돌린다.
  const updatedAt = mode === "edit" ? props.admin.updatedAt : null;
  const [filledFor, setFilledFor] = useState({ open, updatedAt });
  const [openCount, setOpenCount] = useState(0);
  if (filledFor.open !== open || filledFor.updatedAt !== updatedAt) {
    setFilledFor({ open, updatedAt });
    const reopened = open && !filledFor.open;
    // 주소 검색칸의 글자 · 목록도 비우도록 새로 그린다(그 칸만 다시 마운트해도 패널 전환에는 영향이 없다)
    if (reopened) setOpenCount((n) => n + 1);
    if (reopened || filledFor.updatedAt !== updatedAt) {
      setForm(initialForm());
      setErrors({});
      // 최신 정보만 새로 받은 때는 띠를 남긴다 — 결과를 모른 채 새로 받은 경우 그 안내가 사라지면 안 된다
      if (reopened) setFailure(null);
      // 아이디 중복확인 상태도 같이 되돌린다 — 안 그러면 되돌린 빈 칸에 이전에 확인했던 "사용 가능한 아이디입니다"가
      // 그대로 남는다. 닫는 사이 떠 있던 요청이 늦게 도착해 새로 연 칸에 옛 결과를 칠하는 것은 ref 차례로 막는데,
      // ref 는 그리는 중에 건드릴 수 없어(react-hooks/refs) 아래 effect 에서만 차례를 올린다.
      setCheckingLoginId(false);
      setLoginIdAvailable(false);
      setEmailValid(false);
      setResetSignal((n) => n + 1);
    }
  }
  // DOM이 반영된 뒤 바로(페인트 전) 중복확인 차례만 올린다 — 그 사이 늦게 온 응답이 되돌린 칸에 옛 결과를 칠하지 못하게 한다.
  // 상태는 위 그리는 중에 이미 지웠으므로 여기서는 ref 만 건드린다(react-hooks/set-state-in-effect).
  useLayoutEffect(() => {
    if (resetSignal === 0) return;
    checkNumber.current++;
  }, [resetSignal]);
  const [saving, startSaving] = useTransition();
  const router = useRouter();

  const ids = useId();
  // 칸을 고치면 그 칸의 오류는 바로 지운다
  const clearError = (key: AdminFormField) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const set = <K extends keyof AdminForm>(key: K, value: AdminForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key as AdminFormField);
  };
  const invalid = (key: AdminFormField) => (errors[key] ? true : undefined);
  /** 칸 아래 오류 문구의 id — 입력칸이 aria-describedby 로 가리킨다 */
  const messageId = (key: AdminFormField) => `${ids}-${key}`;
  const describe = (key: AdminFormField) => (errors[key] ? messageId(key) : undefined);
  const message = (key: AdminFormField) => <FieldMessage id={messageId(key)} message={errors[key]} />;

  /** 오류가 생기면 첫 오류 칸으로 커서를 옮긴다 — 패널이 길어 아래 칸 오류는 보이지 않을 수 있다 */
  const focusFirstError = () =>
    requestAnimationFrame(() => (document.getElementById(id)?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());

  /** api 가 거절한 이유가 한 칸의 것이면(아이디 · 이메일 중복 등) 그 칸 아래에 붙인다. 아니면 위 띠로. */
  const applyServerError = (status: number | undefined, message: string) => {
    const field = serverErrorField(status, message, mode);
    if (!field) return setFailure(message);
    setErrors((e) => ({ ...e, [field]: message }));
    focusFirstError();
  };

  /**
   * 아이디 중복 확인(등록만) — 칸을 벗어나거나 Enter 를 칠 때. 형식이 틀리면 api 에 묻지 않고 형식 문구를 단다.
   * 비어 있으면 저장할 때 알린다. 묻는 사이 아이디를 고쳤으면 늦게 온 답은 버린다.
   * 400(형식)이면 그 문구를 칸 아래에, 401(로그인 만료)이면 위 띠로 바로 알린다 — 다 채운 뒤에야 알면 늦다.
   * 그 밖(403 · 5xx · 연결 실패)은 칸에 아무것도 달지 않고 넘어간다 — 저장할 때 api 가 다시 본다. 원인은 콘솔에 남긴다.
   */
  const checkLoginId = (value: string) => {
    if (mode !== "create" || !value.trim()) return;
    const formatError = loginIdError(value);
    if (formatError) {
      setErrors((e) => ({ ...e, loginId: formatError }));
      return;
    }
    const mine = ++checkNumber.current;
    // 같은 값을 다시 물을 때(Enter 재확인 등, 칸을 고치지 않아 onChange 의 초기화를 타지 않는다)도 앞서 달렸던
    // 오류를 지운다 — 안 그러면 묻는 동안에도 "확인 중입니다." 대신 옛 오류 문구가 그대로 보인다.
    clearError("loginId");
    setLoginIdAvailable(false);
    setCheckingLoginId(true);
    checkLoginIdAvailableAction(value.trim())
      .then((result) => {
        if (mine !== checkNumber.current) return;
        setCheckingLoginId(false);
        if (result.ok) {
          if (result.available) setLoginIdAvailable(true);
          else setErrors((e) => ({ ...e, loginId: LOGIN_ID_TAKEN }));
        } else if (result.status === 400) setErrors((e) => ({ ...e, loginId: result.message }));
        else if (result.status === 401) setFailure(result.message);
        else console.warn("아이디 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다", result.status, result.message);
      })
      .catch((error: unknown) => {
        if (mine !== checkNumber.current) return;
        setCheckingLoginId(false);
        console.warn("아이디 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다", error);
      });
  };

  /**
   * 이메일 형식 즉시 확인(등록 · 수정 모두) — 칸을 벗어날 때. 아이디와 달리 바로 물어볼 중복확인 API 가 없어
   * (등록 시점에만 api 가 409 로 막는다) 형식만 본다 — 그래서 확인 중 차례나 네트워크 호출이 없다.
   */
  const checkEmail = (value: string) => {
    if (!value.trim()) return;
    const formatError = emailError(value);
    if (formatError) {
      setErrors((e) => ({ ...e, email: formatError }));
      setEmailValid(false);
    } else {
      clearError("email");
      setEmailValid(true);
    }
  };

  // 수정할 계정이 지금 권한 목록에 없으면(플랫폼 관리자가 보는 마스터 등) 그 권한도 선택지에 남겨 값이 비지 않게 한다
  const options =
    mode === "edit" && !roleGroups.some((r) => r.roleGroupId === props.admin.roleGroup.roleGroupId) ? [props.admin.roleGroup, ...roleGroups] : roleGroups;

  const handleSave = () => {
    const found = validateAdminForm(form, mode);
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) return focusFirstError();

    startSaving(async () => {
      if (props.mode === "create") {
        const result = await createPlatformAdminAction(toCreateInput(form)).catch(unknownResult("등록"));
        if (!result.ok) {
          // 결과를 모르면 목록을 새로 받아, 이미 만들어졌는지 사용자가 볼 수 있게 한다
          if (result.status === undefined) router.refresh();
          return applyServerError(result.status, result.message);
        }
        return props.onSaved(result);
      }
      const result = await updatePlatformAdminAction(props.admin.adminAccountId, toUpdateInput(form, props.admin.updatedAt)).catch(unknownResult("수정"));
      if (result.ok) return props.onSaved();
      if (result.status === undefined) router.refresh();
      // 다른 사람이 먼저 고쳤으면 저장하지 않고 최신 정보를 불러온다(S-CZGHBS) — 칸은 새 값으로 다시 채워진다
      // 패널이 곧 새로 그려지므로 띠는 세우지 않는다(알림은 화면이 토스트로 한다)
      if (result.status === 409 && result.message.includes(STALE)) return props.onStale();
      applyServerError(result.status, result.message);
    });
  };

  const title = mode === "create" ? "플랫폼 관리자 등록" : "플랫폼 관리자 수정";

  return (
    <SlidePanel id={id} open={open} onClose={onClose} label={title} trigger={trigger}>
      <h2 className="text-[18px] font-semibold text-erp-ink">
        {title}
        {mode === "edit" && (
          <span className="ml-[6px] text-[13px] font-normal text-erp-label">
            {props.admin.name ?? props.admin.loginId} · {props.admin.loginId}
          </span>
        )}
      </h2>
      {failure && <FailedBand message={failure} detail="입력한 값은 그대로 두었습니다." />}

      <FormGroup title="기본정보">
        <div className="flex flex-col gap-[8px]">
          <Field label="아이디" required>
            {mode === "create" ? (
              <TextField
                value={form.loginId}
                onChange={(e) => {
                  checkNumber.current++;
                  setCheckingLoginId(false);
                  setLoginIdAvailable(false);
                  set("loginId", e.target.value);
                }}
                onBlur={(e) => checkLoginId(e.currentTarget.value)}
                onKeyDown={(e) => {
                  // 한글 조합 중 Enter 는 글자 확정이라 넘긴다
                  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  checkLoginId(e.currentTarget.value);
                }}
                maxLength={20}
                placeholder="영문 또는 영문·숫자 조합 4~20자"
                aria-invalid={invalid("loginId")}
                aria-describedby={describe("loginId") ?? (checkingLoginId || loginIdAvailable ? messageId("loginId") : undefined)}
                aria-busy={checkingLoginId || undefined}
                aria-required
                autoComplete="off"
              />
            ) : (
              <TextField value={form.loginId} readOnly />
            )}
          </Field>
          {mode === "create" ? (
            <LoginIdAvailability id={messageId("loginId")} checking={checkingLoginId} available={loginIdAvailable} message={errors.loginId} />
          ) : (
            message("loginId")
          )}
        </div>
        <div className="flex flex-col gap-[8px]">
          <Field label="이름" required>
            <TextField value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={20} placeholder="한글 또는 영문 2~20자" aria-invalid={invalid("name")} aria-describedby={describe("name")} aria-required />
          </Field>
          {message("name")}
        </div>
        <Group label="연락처" required>
          <FormRow>
            {(["앞자리", "가운데자리", "끝자리"] as const).map((label, i) => (
              <TextField
                key={label}
                value={form.phone[i]}
                onChange={(e) => {
                  const next = [...form.phone] as AdminForm["phone"];
                  next[i] = e.target.value.replace(/[^0-9]/g, "");
                  set("phone", next);
                }}
                inputMode="numeric"
                maxLength={i === 0 ? 3 : 4}
                aria-label={`연락처 ${label}`}
                aria-invalid={invalid("phone")}
                aria-describedby={describe("phone")}
                aria-required
              />
            ))}
          </FormRow>
          {message("phone")}
        </Group>
        <div className="flex flex-col gap-[8px]">
          <Field label="이메일" required>
            <TextField
              type="email"
              value={form.email}
              onChange={(e) => {
                setEmailValid(false);
                set("email", e.target.value);
              }}
              onBlur={(e) => checkEmail(e.currentTarget.value)}
              maxLength={100}
              aria-invalid={invalid("email")}
              aria-describedby={describe("email") ?? (emailValid ? messageId("email") : undefined)}
              aria-required
            />
          </Field>
          <EmailFormatValid id={messageId("email")} valid={emailValid} message={errors.email} />
        </div>
        <div className="flex flex-col gap-[8px]">
          <Field label="소속 부서">
            <TextField value={form.department} onChange={(e) => set("department", e.target.value)} maxLength={30} aria-invalid={invalid("department")} aria-describedby={describe("department")} />
          </Field>
          {message("department")}
        </div>
        <div className="flex flex-col gap-[8px]">
          <Field label="직책">
            <TextField value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} maxLength={30} aria-invalid={invalid("jobTitle")} aria-describedby={describe("jobTitle")} />
          </Field>
          {message("jobTitle")}
        </div>
        <AddressField
          key={openCount}
          value={{ zipCode: form.zipCode, address: form.address, addressDetail: form.addressDetail }}
          onChange={(a) => {
            setForm((f) => ({ ...f, ...a }));
            clearError("addressDetail");
          }}
          detailError={errors.addressDetail}
        />
      </FormGroup>

      <FormGroup title={mode === "create" ? "사용자 권한" : "사용자 권한 · 계정 상태"}>
        <div className="flex flex-col gap-[8px]">
          <Field label="사용자 권한" required>
            <Select
              value={form.roleGroupId}
              onChange={(e) => set("roleGroupId", e.target.value)}
              disabled={isSelf}
              title={isSelf ? "본인 계정의 권한은 바꿀 수 없습니다" : undefined}
              aria-invalid={invalid("roleGroupId")}
              aria-describedby={describe("roleGroupId")}
              aria-required
            >
              {mode === "create" && <option value="">선택</option>}
              {options.map((r) => (
                <option key={r.roleGroupId} value={r.roleGroupId}>
                  {r.name} · {r.roleCode} ({labelOf(roleTypes, r.roleTypeCode)})
                </option>
              ))}
            </Select>
          </Field>
          {message("roleGroupId")}
        </div>
        {mode === "edit" && (
          <Field label="계정 상태" required>
            <Select
              value={form.accountStatus}
              onChange={(e) => set("accountStatus", e.target.value as AdminForm["accountStatus"])}
              disabled={isSelf}
              title={isSelf ? "본인 계정의 상태는 바꿀 수 없습니다" : undefined}
            >
              <option value="ACTIVE">사용</option>
              <option value="INACTIVE">미사용</option>
            </Select>
          </Field>
        )}
        {isSelf && <Note>본인 계정의 권한 · 상태는 바꿀 수 없습니다. 기본정보는 고칠 수 있습니다.</Note>}
      </FormGroup>

      {mode === "create" && <Note>초기 비밀번호를 등록 이메일로 발송합니다.</Note>}
      {mode === "edit" && form.accountStatus === "INACTIVE" && props.admin.accountStatus === "ACTIVE" && (
        <Note>미사용으로 저장하면 바로 로그인 · ERP 접근이 막힙니다. 로그인 중인 세션은 끊지 않습니다.</Note>
      )}

      <div className="flex justify-center gap-[6px]">
        <Button variant="off" onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          저장
        </Button>
      </div>
    </SlidePanel>
  );
}

/** 입력칸이 여럿인 칸(연락처). Field 는 라벨이 입력칸 하나를 감싸므로 묶음 이름만 단다. */
function Group({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-label">
        {label}
        {required && <RequiredMark />}
      </span>
      {children}
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-[1.6] text-erp-label">{children}</p>;
}
