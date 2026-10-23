"use client";

import { useRouter } from "next/navigation";
import { useId, useLayoutEffect, useRef, useState, useTransition, type ReactNode, type RefObject } from "react";
import { Button, Field, FormGroup, FormRow, RequiredMark, Select, SlidePanel, Tag, TextField } from "@/components/common";
import { useAccount, useCodes } from "@/components/site/session-gate";
import { labelOf } from "@/lib/enums";
import {
  EMPTY_FORM,
  emailError,
  formOf,
  isOriginalEmail,
  loginIdCheckOutcome,
  loginIdError,
  saveBlockingErrors,
  serverErrorField,
  serverFieldMessage,
  toCreateInput,
  toUpdateInput,
  type AdminForm,
  type AdminFormField,
  type LoginIdCheck,
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

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다(admins-screen.tsx closeAll). 저장하는 동안은 onClose 처럼 닫히지 않는다 */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  roleGroups: PlatformRoleGroup[];
} & (
  | { mode: "create"; admin?: never; onSaved: (result: { adminAccountId: number; isMailSent: boolean }) => void; onStale?: never }
  | { mode: "edit"; admin: PlatformAdminDetail; onSaved: () => void; onStale: () => void }
);

export function AdminFormPanel(props: Props) {
  const { id, mode, open, onClose, onBackdropClose, trigger, roleGroups } = props;
  const me = useAccount();
  // 권한 유형 이름은 로그인 정보의 공통코드 ROLE_TYPE 에서 읽는다(네이밍 규칙 화면 문구)
  const roleTypes = useCodes("ROLE_TYPE");
  const isSelf = mode === "edit" && me.adminAccountId === props.admin.adminAccountId;
  const initialForm = () => (mode === "edit" ? formOf(props.admin) : EMPTY_FORM);
  const [form, setForm] = useState<AdminForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<AdminFormField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  /** 아이디 중복 확인 차례 — 고치거나 다시 물으면(패널을 다시 열거나 새로 받거나, 저장이 거절되어도) 올라가, 앞선 답을 버린다 */
  const checkNumber = useRef(0);
  /** 중복확인 대기 · 성공 · 실패 상태. 오류는 errors.loginId(서버의 답이면 serverErrors.loginId 에도)에 둔다 */
  const [loginIdCheck, setLoginIdCheck] = useState<LoginIdCheck>("idle");
  /** 이메일 형식 확인 성공 — api 호출이 없어 아이디처럼 확인 중 차례를 둘 필요가 없다. 오류는 errors.email 에 둔다. */
  const [emailValid, setEmailValid] = useState(false);
  /**
   * 서버가 칸에 붙인 오류 — 저장 때 받은 아이디 · 이메일 중복(아이디는 400 형식도)과, 아이디 중복확인의 「사용 중」 · 400 답.
   * 그 칸을 고칠 때까지 남긴다 — 다시 저장하거나 같은 값을
   * 다시 확인하는 것으로 지워지면, 서버가 방금 거절한 값 아래에 "사용 가능" 같은 성공 문구가 다시 보인다.
   */
  const [serverErrors, setServerErrors] = useState<Partial<Record<AdminFormField, string>>>({});
  /** 칸을 되돌릴 때마다 올라간다 — 아래 layout effect 가 이 값을 보고 중복확인 차례(ref)를 올린다. 상태는 그리는 중에 지운다 */
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
      setServerErrors({});
      // 최신 정보만 새로 받은 때는 띠를 남긴다 — 결과를 모른 채 새로 받은 경우 그 안내가 사라지면 안 된다
      if (reopened) setFailure(null);
      // 아이디 · 이메일 확인 표시도 같이 되돌린다 — 안 그러면 되돌린 빈 칸에 이전에 확인했던 "사용 가능한 아이디입니다"가
      // 그대로 남는다. 닫는 사이 떠 있던 요청이 늦게 도착해 새로 연 칸에 옛 결과를 칠하는 것은 ref 차례로 막는데,
      // ref 는 그리는 중에 건드릴 수 없어(react-hooks/refs) 되돌릴 때의 차례는 아래 effect 가 올린다.
      setLoginIdCheck("idle");
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
  const without = (key: AdminFormField) => (e: Partial<Record<AdminFormField, string>>) =>
    key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e;
  const clearError = (key: AdminFormField) => setErrors(without(key));
  const set = <K extends keyof AdminForm>(key: K, value: AdminForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    clearError(key as AdminFormField);
    setServerErrors(without(key as AdminFormField));
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
    // 저장이 거절되면 거절된 칸의 성공 표시(사용 가능 · 올바른 형식)를 내린다 — 「아이디 또는 이메일」처럼 칸을 가를 수
    // 없는 중복은 띠로만 가서, 남겨 두면 띠는 중복이라는데 칸 아래는 "사용 가능"이라고 한다. 그때는 둘 다 내린다.
    // 이메일 중복처럼 다른 칸의 거절이면 아이디의 "사용 가능"은 그대로 둔다(아이디는 멀쩡하다).
    const field = serverErrorField(status, message, mode);
    if (field !== "email") {
      checkNumber.current++; // 떠 있던 아이디 확인 답도 버린다
      setLoginIdCheck("idle");
    }
    if (field !== "loginId") setEmailValid(false);
    if (!field) return setFailure(message);
    // 아이디는 화면 문구로 바꿔 붙인다 — 중복확인 때의 「사용 중」과 같은 문구여야 한다
    const text = serverFieldMessage(field, status, message);
    if (text !== message) console.warn("api 문구를 화면 문구로 바꿔 붙였다", status, message);
    setServerErrors((e) => ({ ...e, [field]: text }));
    setErrors((e) => ({ ...e, [field]: text }));
    focusFirstError();
  };

  /**
   * 아이디 중복 확인(등록만) — 칸을 벗어나거나 Enter 를 칠 때. 형식이 틀리면 api 에 묻지 않고 형식 문구를 단다.
   * 비어 있으면 저장할 때 알린다. 서버가 거절한 값(저장 때 중복 · 400, 확인 때 「사용 중」 · 400)을 고치지 않았으면 다시 묻지 않는다.
   * 묻는 사이 아이디를 고치거나 · 패널을 되돌리거나 · 저장이 거절되면 늦게 온 답은 버린다.
   * 400(형식)이면 화면의 형식 문구를 칸 아래에(고칠 때까지 남긴다), 401(로그인 만료)이면 위 띠로 바로 알린다 — 다 채운 뒤에야 알면 늦다.
   * 그 밖(403 · 429 · 5xx · 연결 실패)은 칸 아래에 회색으로 "확인하지 못했다"고만 알린다 — 저장은 막지 않고 api 가 다시 본다.
   * 원인은 콘솔에 남긴다.
   */
  const checkLoginId = (value: string) => {
    if (mode !== "create" || !value.trim()) return;
    // 서버가 거절한 값을 고치지 않고 다시 벗어난 것이면 묻지 않는다 — 아래에서 그 오류를 먼저 지우므로,
    // 확인이 실패하면 거절한 값 아래에 "확인하지 못했습니다"만 남는다(이메일의 errors.email 확인과 같은 취지).
    if (serverErrors.loginId) return;
    const formatError = loginIdError(value);
    if (formatError) {
      setErrors((e) => ({ ...e, loginId: formatError }));
      return;
    }
    const mine = ++checkNumber.current;
    // 같은 값을 다시 물을 때(Enter 재확인 등, 칸을 고치지 않아 onChange 의 초기화를 타지 않는다)도 앞서 달렸던
    // 오류를 지운다 — 안 그러면 묻는 동안에도 "아이디를 확인하는 중입니다." 대신 옛 오류 문구가 그대로 보인다.
    // 서버가 거절한 값은 위에서 이미 돌려보냈으므로, 여기서 지워지는 것은 그 밖의 칸 오류뿐이다.
    clearError("loginId");
    setLoginIdCheck("checking");
    checkLoginIdAvailableAction(value.trim())
      .then((result) => {
        if (mine !== checkNumber.current) return;
        const { check, fieldError, failure } = loginIdCheckOutcome(result);
        setLoginIdCheck(check);
        if (fieldError) {
          // 「사용 중」 · 400 도 서버의 답이다 — 저장 때 받은 중복처럼 아이디를 고칠 때까지 남긴다.
          // 400 은 api 문구 대신 화면 형식 문구로 보이므로(같은 규칙) 원문은 콘솔에 남긴다.
          if (!result.ok) console.warn("아이디 중복 확인 400 — 화면 형식 문구로 보인다", result.message);
          setServerErrors((e) => ({ ...e, loginId: fieldError }));
          setErrors((e) => ({ ...e, loginId: fieldError }));
        }
        if (failure) setFailure(failure);
        if (check === "failed" && !result.ok) console.warn("아이디 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다", result.status, result.message);
      })
      .catch((error: unknown) => {
        if (mine !== checkNumber.current) return;
        setLoginIdCheck("failed");
        console.warn("아이디 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다", error);
      });
  };

  /**
   * 이메일 형식 즉시 확인(등록 · 수정 모두) — 칸을 벗어나거나 Enter 를 칠 때. 아이디와 달리 바로 물어볼 중복확인 API 가 없어
   * (중복은 저장할 때 — 등록 · 수정 모두 — api 가 409 로 막는다) 형식만 본다 — 그래서 확인 중 차례나 네트워크 호출이 없다.
   * 수정 화면에서 원래 이메일 그대로면 아무것도 띄우지 않는다 — 바꾸지 않은 값은 확인 대상이 아니다(MY PAGE 와 같다).
   * 원래 값이 형식에 맞지 않는 옛 데이터여도 여기서는 조용하고, 저장할 때 형식 문구로 막는다.
   */
  const checkEmail = (value: string) => {
    if (!value.trim()) return;
    if (mode === "edit" && isOriginalEmail(value, props.admin.email)) return;
    const formatError = emailError(value);
    if (formatError) {
      setErrors((e) => ({ ...e, email: formatError }));
      setEmailValid(false);
      return;
    }
    // 형식은 맞지만 이미 다른 오류(저장할 때 서버가 돌려준 중복 등)가 달려 있으면 그대로 둔다 — 고치지 않고
    // 칸만 다시 벗어나는 것으로 그 안내가 사라지면 안 된다(고치면 onChange 가 먼저 지운다).
    if (errors.email) return;
    setEmailValid(true);
  };

  // 수정할 계정이 지금 권한 목록에 없으면(플랫폼 관리자가 보는 마스터 등) 그 권한도 선택지에 남겨 값이 비지 않게 한다
  const options =
    mode === "edit" && !roleGroups.some((r) => r.roleGroupId === props.admin.roleGroup.roleGroupId) ? [props.admin.roleGroup, ...roleGroups] : roleGroups;

  const handleSave = () => {
    // 서버가 거절한 아이디는 고치기 전까지 막고, 이메일 중복 같은 다른 칸의 서버 오류는 보이기만 한다(saveBlockingErrors)
    const found = saveBlockingErrors(form, mode, serverErrors);
    setErrors({ ...serverErrors, ...found });
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

  // 저장하는 동안은 Esc · 바탕 클릭으로도 닫히지 않는다 — 취소 버튼의 disabled={saving} 과 같은 뜻이다.
  // 닫히면 저장 결과(성공 · 실패 띠)를 사용자가 못 보고 패널이 먼저 사라진다(코드 리뷰로 찾음, 2026-10-20).
  const safeClose = () => {
    if (!saving) onClose();
  };

  return (
    // 등록 · 수정 모두 상세처럼 바탕창을 깔고, 바탕을 누르면 겹친 패널을 모두 닫는다(2026-10-22 사용자 요청, 데모와 같다).
    // 등록은 빈 칸부터 쓰는 패널이라 바깥을 잘못 누르면 입력이 사라지고, 연 동안 목록이 막혀 상세를 그 위에 겹쳐 열 수 없다 — 알고 고른 것이다.
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
        {mode === "edit" && (
          // 아이디 칸을 없앤 대신(위 FormGroup 주석) 제목 줄에 라벨을 달아 값만으로는 안 보이던 것을 바로
          // 알게 한다(점포코드 ST000123 처럼 라벨+값, 2026-10-20 디자인 수정 — 이름은 중복이라 뺀다). 상세
          // 제목 줄의 사용자 권한 꼬리표와 같은 뱃지 모양으로 맞췄다.
          <span className="ml-[6px] inline-flex">
            <Tag>
              아이디 · <b className="font-semibold">{props.admin.loginId}</b>
            </Tag>
          </span>
        )}
      </h2>
      {failure && <FailedBand message={failure} detail="입력한 값은 그대로 두었습니다." />}

      <FormGroup title="기본정보">
        {/* 아이디는 고칠 수 없고 패널 제목 줄에 이미 보이므로(위 h2) 칸을 다시 두지 않는다(2026-10-20 디자인 수정). */}
        {mode === "create" && (
          <div className="flex flex-col gap-[8px]">
            <Field label="아이디" required>
              <TextField
                value={form.loginId}
                onChange={(e) => {
                  checkNumber.current++;
                  setLoginIdCheck("idle");
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
                placeholder="영문 또는 영문·숫자 조합으로 4~20자 입력해 주세요."
                aria-invalid={invalid("loginId")}
                aria-describedby={describe("loginId") ?? (loginIdCheck !== "idle" ? messageId("loginId") : undefined)}
                aria-busy={loginIdCheck === "checking" || undefined}
                aria-required
                autoComplete="off"
              />
            </Field>
            <LoginIdAvailability id={messageId("loginId")} check={loginIdCheck} message={errors.loginId} />
          </div>
        )}
        <div className="flex flex-col gap-[8px]">
          <Field label="이름" required>
            <TextField value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={20} placeholder="한글 또는 영문 2~20자로 입력해 주세요." aria-invalid={invalid("name")} aria-describedby={describe("name")} aria-required />
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
              onKeyDown={(e) => {
                // 한글 조합 중 Enter 는 글자 확정이라 넘긴다(아이디 칸과 같다)
                if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                e.preventDefault();
                checkEmail(e.currentTarget.value);
              }}
              maxLength={100}
              aria-invalid={invalid("email")}
              aria-describedby={describe("email") ?? (emailValid ? messageId("email") : undefined)}
              aria-required
            />
          </Field>
          <EmailFormatValid id={messageId("email")} valid={emailValid} message={errors.email} />
        </div>
        <div className="flex flex-col gap-[8px]">
          <Field label="소속부서">
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
        {/* 본인 계정은 이 칸들을 고칠 수 없어 비활성 처리한다 — 흰 바탕과 구별되게 막힌 칸만 회색으로 그린다
            (공통 입력칸 토큰은 그대로 두고 이 화면 테두리에서만 셈한다, contract-form.tsx 와 같은 방식). */}
        <div className="flex flex-col gap-[12px] [&_select:disabled]:bg-erp-thead-bg">
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
        </div>
        {isSelf && <Note>본인 계정의 권한 및 상태는 변경할 수 없으며, 기본정보만 수정할 수 있습니다.</Note>}
      </FormGroup>

      {mode === "create" && <Note>관리자 계정의 초기 비밀번호는 등록된 이메일로 발송됩니다.</Note>}
      {mode === "edit" && form.accountStatus === "INACTIVE" && props.admin.accountStatus === "ACTIVE" && (
        <Note>
          미사용으로 변경하면 해당 계정의 로그인 및 서비스 접근이 즉시 차단됩니다.
          <br />단, 현재 로그인 중인 세션은 유지됩니다.
        </Note>
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
