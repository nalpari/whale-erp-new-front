"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { Button, Field, FormGroup, FormRow, RequiredMark, Select, SlidePanel, TextField } from "@/components/common";
import type { CurrentAdmin } from "@/lib/current-admin";
import {
  EMPTY_FORM,
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
import { FailedBand, FieldMessage, ROLE_TYPE_LABEL, unknownResult } from "./admin-parts";

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
  me: CurrentAdmin | null;
} & (
  | { mode: "create"; admin?: never; onSaved: (result: { adminAccountId: number; isMailSent: boolean }) => void; onStale?: never }
  | { mode: "edit"; admin: PlatformAdminDetail; onSaved: () => void; onStale: () => void }
);

export function AdminFormPanel(props: Props) {
  const { id, mode, open, onClose, trigger, roleGroups, me } = props;
  const isSelf = mode === "edit" && me?.adminAccountId === props.admin.adminAccountId;
  const initialForm = () => (mode === "edit" ? formOf(props.admin) : EMPTY_FORM);
  const [form, setForm] = useState<AdminForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<AdminFormField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

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
    }
  }
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  /** 아이디 중복 확인 차례 — 고치거나 다시 물으면 올라가, 앞선 답을 버린다 */
  const checkNumber = useRef(0);

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
    checkLoginIdAvailableAction(value.trim())
      .then((result) => {
        if (mine !== checkNumber.current) return;
        if (result.ok) {
          if (!result.available) setErrors((e) => ({ ...e, loginId: LOGIN_ID_TAKEN }));
        } else if (result.status === 400) setErrors((e) => ({ ...e, loginId: result.message }));
        else if (result.status === 401) setFailure(result.message);
        else console.warn("아이디 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다", result.status, result.message);
      })
      .catch((error: unknown) => console.warn("아이디 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다", error));
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
                aria-describedby={describe("loginId")}
                aria-required
                autoComplete="off"
              />
            ) : (
              <TextField value={form.loginId} readOnly />
            )}
          </Field>
          {message("loginId")}
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
            <TextField type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={100} aria-invalid={invalid("email")} aria-describedby={describe("email")} aria-required />
          </Field>
          {message("email")}
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
                  {r.name} · {r.roleCode} ({ROLE_TYPE_LABEL[r.roleTypeCode]})
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
