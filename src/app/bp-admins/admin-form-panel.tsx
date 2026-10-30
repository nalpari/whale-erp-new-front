"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type KeyboardEvent, type ReactNode, type RefObject } from "react";
import { Button, ConfirmDialog, DataTable, Field, FormGroup, FormRow, RequiredMark, Select, SlidePanel, Tag, TextField } from "@/components/common";
import { useCodeLabel } from "@/components/site/code-label";
import { useCurrentBpStatus } from "@/components/site/current-bp-status";
import { useAccount, useCurrentBp } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { FailedBand, FieldMessage, InfoBand, WarnBand } from "@/components/site/side-parts";
import { StoreMappingPicker, type MappingStoreOption } from "@/components/site/store-mapping-picker";
import { StoreStatusBadge } from "@/app/stores/store-parts";
import {
  bpAdminFormOf,
  bpAdminServerErrorField,
  EMPTY_BP_ADMIN_FORM,
  emailError,
  toCreateBpAdminInput,
  toUpdateBpAdminInput,
  validateBpAdminForm,
  withRole,
  type BpAdminForm,
  type BpAdminFormField,
} from "@/lib/bp-admin-form";
import { allowsAllStores, andOthers, cascadeOf, creatableRolesOf, editLocksOf } from "@/lib/bp-admin-rules";
import type {
  BpAdminDetail,
  BpAdminRoleGroup,
  BpAdminRoleType,
  BpAdminStore,
  BpAdminStoreOption,
  BpAdminUpdateImpact,
  UpdateBpAdminInput,
} from "@/lib/bp-admins";
import { loginIdError, type LoginIdCheck } from "@/lib/platform-admin-form";
import { EmailAvailability, LoginIdAvailability } from "@/app/platform-admins/admin-parts";
import type { StoreStatus } from "@/lib/store-types";
import {
  checkBpAdminEmailAction,
  checkBpAdminLoginIdAction,
  createBpAdminAction,
  getBpAdminStoreOptionsAction,
  getBpAdminUpdateImpactAction,
  updateBpAdminAction,
} from "./actions";
import { unknownResult } from "./bp-admin-parts";

// BP 관리자 등록(S-NIMSMQ) · 수정(S-OENTFQ) 슬라이드 패널(데모 config/admins-new · admins-edit). 패널 폭(464)이라 칸을 한 줄에 하나씩 쌓는다.
// 묶음은 기본정보 · 계정 역할 · 대상 점포 셋이다. 등록에는 상태 칸이 없다 — 사용으로 생기고 초기 비밀번호가 등록 이메일로 간다.
// 수정에서 아이디는 제목 줄 띠지로만 보이고(칸 없음), 계정 역할은 읽기 전용 칸이다. 본인 계정은 기본정보만 고친다(권한 그룹 · 상태 · 범위 · 점포를 막는다 — api 도 막는다).
// 대상 점포 후보는 api 의 store-options 다 — 수정하는 사람의 관리 범위 안에서 고를 수 있는 점포만 온다(폐점 · 다른 가맹 마스터 담당은 빠진다).
// 수정하는 사람의 범위 밖에 이미 매핑된 점포는 칩이 아니라 아래 읽기 전용 표로 보이고, 저장해도 api 가 그대로 둔다(목업 확정 2026-09-29).
// 가맹 마스터를 미사용으로 바꾸거나 점포를 빼면 연결된 가맹 관리자도 같은 저장에서 바뀐다(연쇄는 api 가 한다). 미사용을 고르면 상태 칸 아래 띠로,
// 저장을 누르면 확인창으로 함께 바뀌는 계정을 첫 아이디와 「외 N명」으로 알린다 — 함께 바뀌는 계정이 없으면 확인창 없이 저장한다(2026-10-27 사용자 결정).

/** 동시 수정 409 문구(작업 지시서). 이때만 최신 정보를 다시 불러온다. */
const STALE = "먼저 바꿨습니다";
/** 중복 확인에서 쓸 수 없다고 온 아이디의 문구 */
// 관리자 등록 세 화면(플랫폼 · BP 관리자 · BP 마스터)이 같은 문구 — 탈퇴 · 삭제 계정 아이디 안내는 길어 뺐다(2026-10-28 사용자 지정)
const LOGIN_ID_TAKEN = "이미 사용 중인 아이디입니다. 다른 아이디를 입력해 주세요.";
/** 중복 확인에서 쓸 수 없다고 온 이메일의 문구 */
const EMAIL_TAKEN = "이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요."; // 네 화면 같은 문구(2026-10-28 사용자 지정)

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  /** 바탕창 클릭 — 겹친 패널을 모두 닫는다(admins-screen.tsx closeAll). 저장하는 동안은 닫히지 않는다 */
  onBackdropClose: () => void;
  trigger: RefObject<HTMLElement | null>;
  /** null 이면 권한 그룹 목록을 받지 못했다 — 선택지가 비어 저장할 수 없는 이유를 띠로 알린다 */
  roleGroups: BpAdminRoleGroup[] | null;
} & (
  | { mode: "create"; admin?: never; onSaved: (result: { adminAccountId: number; isMailSent: boolean }) => void; onStale?: never }
  | { mode: "edit"; admin: BpAdminDetail; onSaved: () => void; onStale: () => void }
);

/** api 점포 선택지를 고르기 칸의 후보로 */
const optionOf = (s: BpAdminStoreOption): MappingStoreOption => ({
  storeId: s.storeId,
  name: s.name,
  storeCode: s.storeCode,
  storeTypeCode: s.storeTypeCode,
});

export function AdminFormPanel(props: Props) {
  const { id, mode, open, onClose, onBackdropClose, trigger, roleGroups } = props;
  const me = useAccount();
  const currentBp = useCurrentBp();
  const roleType = useCodeLabel("ROLE_TYPE");
  const locks =
    mode === "edit" ? editLocksOf(props.admin) : { roleGroup: false, status: false, scope: false, stores: false };
  const outOfScope: BpAdminStore[] = mode === "edit" && !props.admin.isAllStores ? props.admin.stores.filter((s) => s.isOutOfScope) : [];
  const roles = creatableRolesOf(me);
  const groupsFailed = roleGroups === null;
  const groups = roleGroups ?? [];
  const initialForm = (): BpAdminForm =>
    mode === "edit" ? bpAdminFormOf(props.admin) : roles.length === 1 ? withRole(EMPTY_BP_ADMIN_FORM, roles[0], groups) : EMPTY_BP_ADMIN_FORM;
  const [form, setForm] = useState<BpAdminForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<BpAdminFormField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  /**
   * 아이디 중복확인 대기 · 성공 · 실패 상태(platform-admins 와 같다). 오류는 errors.loginId 에 두고, 오류를 달 때는 "idle" 로 내린다.
   * 플랫폼 관리자 등록과 같은 문구를 칸 아래에 보인다(2026-10-28 사용자 지정).
   */
  const [loginIdCheck, setLoginIdCheck] = useState<LoginIdCheck>("idle");
  /** 이메일 중복확인 대기 · 성공 · 실패 상태 — 아이디와 같다. 오류는 errors.email 에 둔다(2026-10-28 사용자 지정) */
  const [emailCheck, setEmailCheck] = useState<LoginIdCheck>("idle");
  /** 칸을 되돌릴 때마다 올라간다 — 아래 layout effect 가 이 값을 보고 중복 확인 차례(ref)를 올린다(platform-admins 와 같다) */
  const [resetSignal, setResetSignal] = useState(0);

  // 열 때마다(취소한 입력을 남기지 않는다) · 최신 정보를 다시 받았을 때(동시 수정 409 뒤) 칸을 새로 채운다(platform-admins 와 같다).
  const updatedAt = mode === "edit" ? props.admin.updatedAt : null;
  const [filledFor, setFilledFor] = useState({ open, updatedAt });
  const [openCount, setOpenCount] = useState(0);
  if (filledFor.open !== open || filledFor.updatedAt !== updatedAt) {
    setFilledFor({ open, updatedAt });
    const reopened = open && !filledFor.open;
    if (reopened) setOpenCount((n) => n + 1);
    if (reopened || filledFor.updatedAt !== updatedAt) {
      setForm(initialForm());
      setErrors({});
      if (reopened) setFailure(null);
      // 되돌린 빈 칸에 이전에 확인했던 "사용가능합니다."가 남지 않게 아이디 · 이메일 확인 표시도 내린다
      setLoginIdCheck("idle");
      setEmailCheck("idle");
      // 닫는 사이 떠 있던 중복 확인이 늦게 와 되돌린 칸에 옛 결과를 칠하지 않게 차례를 올린다 — ref 는 그리는 중에 건드릴 수 없어
      // (react-hooks/refs) 아래 layout effect 가 올린다(platform-admins 4f17a7c3 와 같다)
      setResetSignal((n) => n + 1);
    }
  }
  const [saving, startSaving] = useTransition();
  const router = useRouter();
  /** 칸별 중복 확인 차례 — 고치거나 다시 묻거나 칸을 되돌리면 올라가, 앞선 답을 버린다 */
  const checkNumber = useRef({ loginId: 0, email: 0 });
  useLayoutEffect(() => {
    if (resetSignal === 0) return;
    checkNumber.current.loginId++;
    checkNumber.current.email++;
  }, [resetSignal]);
  /**
   * 저장 요청이 떠 있는 동안 보낸 값과 달라진 칸 — 입력칸은 저장 중에도 잠기지 않는다. 늦게 온 거절은 보낸 값(sentForm)의 것이라
   * 바뀐 값에 붙이면 틀린 문구가 된다. 그런 칸의 거절은 위 띠로만 알린다(platform-admins 97d55377 와 같다).
   */
  const editedWhileSaving = useRef(new Set<BpAdminFormField>());
  const sentForm = useRef<BpAdminForm | null>(null);

  // 대상 점포 후보 — 패널이 열려 있고 점포를 고를 수 있을 때, 계정 역할마다 받는다(가맹 마스터면 다른 가맹 마스터 담당 점포가 빠져 온다)
  const optionsRole = open && !locks.stores && form.roleTypeCode ? form.roleTypeCode : "";
  // 고치는 계정 — api 가 그 계정이 맡은 점포를 「다른 가맹 마스터 담당」으로 빼지 않게 함께 보낸다
  const editingId = mode === "edit" ? props.admin.adminAccountId : undefined;
  /** [다시 불러오기]를 누른 횟수 — 패널을 닫았다 열면 입력이 지워지므로 그 자리에서 다시 받는다 */
  const [optionsRetry, setOptionsRetry] = useState(0);
  // 받은 값 · 실패는 그 요청(역할 · 연 횟수 · 다시 받기)에 묶는다 — 앞 요청의 값 · 띠가 새로 받는 동안 남지 않게
  const optionsKey = `${optionsRole}|${openCount}|${optionsRetry}`;
  const [options, setOptions] = useState<{ key: string; items: MappingStoreOption[] } | null>(null);
  const [failedOptions, setFailedOptions] = useState<{ key: string; message: string } | null>(null);
  const optionsFailure = failedOptions?.key === optionsKey ? failedOptions.message : null;
  useEffect(() => {
    if (!optionsRole) return;
    let live = true;
    getBpAdminStoreOptionsAction(optionsRole as BpAdminRoleType, editingId)
      .then((result) => {
        if (!live) return;
        if (result.ok) setOptions({ key: optionsKey, items: result.items.map(optionOf) });
        else setFailedOptions({ key: optionsKey, message: result.message });
      })
      .catch((error: unknown) => {
        console.error("BP 관리자 점포 선택지 호출 실패", error);
        if (live) setFailedOptions({ key: optionsKey, message: "점포 목록을 받지 못했습니다." });
      });
    return () => {
      live = false;
    };
  }, [optionsRole, optionsKey, editingId]);
  const optionsReady = options?.key === optionsKey;

  const editing = mode === "edit" ? props.admin : null;
  // 사용 중인 가맹 마스터를 미사용으로 고르면 함께 멈출 가맹 관리자를 미리 센다 — 받은 값은 그 계정 · 연 횟수 · 최신 정보에 묶는다.
  // 점포는 원래 값으로 보낸다: 띠는 미사용 수만 보이고 api 는 그 수를 점포와 상관없이 센다. 점포까지 반영한 수는 저장할 때 다시 센다
  const watchDeactivation = open && editing?.roleTypeCode === "FM" && editing.accountStatus === "ACTIVE" && form.accountStatus === "INACTIVE";
  const impactKey = `${editingId}|${openCount}|${updatedAt}`;
  const [deactivation, setDeactivation] = useState<{ key: string; impact: BpAdminUpdateImpact } | null>(null);
  useEffect(() => {
    if (!watchDeactivation || !editing) return;
    let live = true;
    const storeIds = editing.stores.filter((s) => !s.isOutOfScope).map((s) => s.storeId);
    // 띠는 미리 알리는 것뿐이다 — 못 받으면 띠 없이 두고, 저장을 누를 때 다시 센다
    getBpAdminUpdateImpactAction(editing.adminAccountId, { accountStatus: "INACTIVE", storeIds })
      .then((result) => {
        if (!live) return;
        if (result.ok) setDeactivation({ key: impactKey, impact: result });
        // 로그인이 끝났으면 띠가 없는 것이 「연결된 계정 없음」으로 읽히지 않게 알린다(중복 확인과 같다)
        else if (result.status === 401) setFailure(result.message);
        else console.warn("함께 미사용이 될 가맹 관리자를 세지 못했습니다 — 저장할 때 다시 센다", result.status, result.message);
      })
      .catch((error: unknown) => console.warn("함께 미사용이 될 가맹 관리자 조회 호출 실패 — 저장할 때 다시 센다", error));
    return () => {
      live = false;
    };
  }, [watchDeactivation, editing, impactKey]);
  const deactivationImpact = watchDeactivation && deactivation?.key === impactKey ? deactivation.impact : null;

  /** 저장 전 확인창 — 함께 바뀌는 가맹 관리자가 있을 때만 뜬다. 보낼 값을 쥐고 있다가 [저장]에서 그대로 보낸다 */
  const [cascade, setCascade] = useState<{
    input: UpdateBpAdminInput;
    impact: BpAdminUpdateImpact;
    deactivating: boolean;
    removed: BpAdminStore[];
  } | null>(null);
  // 확인창은 네이티브 <dialog>(최상위 레이어)라 뒤로 가기처럼 클릭 아닌 길로 패널이 닫히면 혼자 남는다 — 함께 닫는다
  if (!open && cascade) setCascade(null);

  const ids = useId();
  const clearError = (key: BpAdminFormField) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const set = <K extends keyof BpAdminForm>(key: K, value: BpAdminForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    const sent = sentForm.current?.[key];
    if (sent !== undefined && JSON.stringify(sent) === JSON.stringify(value)) editedWhileSaving.current.delete(key as BpAdminFormField);
    else editedWhileSaving.current.add(key as BpAdminFormField);
    clearError(key as BpAdminFormField);
  };
  const invalid = (key: BpAdminFormField) => (errors[key] ? true : undefined);
  const messageId = (key: BpAdminFormField) => `${ids}-${key}`;
  const describe = (key: BpAdminFormField) => (errors[key] ? messageId(key) : undefined);
  const message = (key: BpAdminFormField) => <FieldMessage id={messageId(key)} message={errors[key]} />;

  const focusFirstError = () =>
    requestAnimationFrame(() => (document.getElementById(id)?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());

  const applyServerError = (status: number | undefined, text: string) => {
    const field = bpAdminServerErrorField(status, text, mode);
    // 보낸 뒤 고친 칸의 거절이면 지금 값에 붙이지 않고 띠로만 알린다. 점포 칸이 숨어 있으면(전체 점포 · 본인 계정) 붙여도 안 보이므로 띠로
    // 범위는 저장을 누른 때의 값이라, 그 뒤 범위를 바꿨으면(editedWhileSaving) 지금 점포 칸이 숨었을 수 있다
    const hidden = field === "stores" && (form.isAllStores || locks.stores || editedWhileSaving.current.has("isAllStores" as BpAdminFormField));
    // 아이디가 거절됐거나 칸을 가를 수 없는 거절(띠)이면 아이디의 "사용가능합니다."를 내리고 떠 있던 확인 답도 버린다(platform-admins 와 같다).
    // 보낸 뒤 고친 아이디의 거절이면 고친 값은 따로 확인되므로 그대로 둔다.
    if ((!field || field === "loginId") && !editedWhileSaving.current.has("loginId")) {
      checkNumber.current.loginId++;
      setLoginIdCheck("idle");
    }
    // 이메일도 같다(2026-10-28 사용자 지정)
    if ((!field || field === "email") && !editedWhileSaving.current.has("email")) {
      checkNumber.current.email++;
      setEmailCheck("idle");
    }
    if (!field || hidden || editedWhileSaving.current.has(field)) return setFailure(text);
    setErrors((e) => ({ ...e, [field]: text }));
    focusFirstError();
  };

  /**
   * 아이디 · 이메일 중복 확인(등록만) — 칸을 벗어나거나 Enter 를 칠 때, 두 칸 모두 같은 때에 묻는다(2026-10-26 사용자 요청).
   * 형식이 틀리면 api 에 묻지 않는다. 그 밖의 실패(403 · 404 · 5xx)는 칸에 달지 않고 넘어간다 — 저장할 때 api 가 다시 본다.
   * 아이디는 묻는 동안 · 쓸 수 있을 때 · 확인하지 못했을 때를 칸 아래에 플랫폼 관리자 등록과 같은 문구로 보인다(LoginIdAvailability,
   * 2026-10-28 사용자 지정). 이메일도 같은 세 상태를 이메일 문구로 보인다(EmailAvailability, 2026-10-28 사용자 지정).
   */
  const CHECKS = {
    loginId: { formatError: loginIdError, ask: checkBpAdminLoginIdAction, taken: LOGIN_ID_TAKEN, value: (v: string) => v.trim() },
    email: { formatError: emailError, ask: checkBpAdminEmailAction, taken: EMAIL_TAKEN, value: (v: string) => v.trim().toLowerCase() },
  };
  const checkAvailable = (field: "loginId" | "email", raw: string) => {
    if (mode !== "create" || !raw.trim()) return;
    const check = CHECKS[field];
    const setCheck = field === "loginId" ? setLoginIdCheck : setEmailCheck;
    const formatError = check.formatError(raw);
    if (formatError) {
      setErrors((e) => ({ ...e, [field]: formatError }));
      setCheck("idle");
      return;
    }
    const mine = ++checkNumber.current[field];
    // 같은 값을 다시 물을 때(Enter 재확인 등)도 앞서 달렸던 오류를 지운다 — 안 그러면 묻는 동안 확인 중 문구 대신 옛 오류가 보인다
    clearError(field);
    setCheck("checking");
    check
      .ask(check.value(raw))
      .then((result) => {
        if (mine !== checkNumber.current[field]) return;
        if (result.ok) {
          if (!result.available) setErrors((e) => ({ ...e, [field]: check.taken }));
          setCheck(result.available ? "available" : "idle");
          return;
        }
        setCheck(result.status === 400 || result.status === 401 ? "idle" : "failed");
        if (result.status === 400) setErrors((e) => ({ ...e, [field]: result.message }));
        else if (result.status === 401) setFailure(result.message);
        else console.warn(`${field} 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다`, result.status, result.message);
      })
      .catch((error: unknown) => {
        if (mine !== checkNumber.current[field]) return;
        setCheck("failed");
        console.warn(`${field} 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다`, error);
      });
  };
  /** Enter 로 중복을 묻는다 — 한글 조합 중 Enter 는 글자 확정이라 넘긴다 */
  const isEnter = (e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && !e.nativeEvent.isComposing;

  /** 계정 역할을 바꾸면 그 역할의 권한 그룹 · 점포로 새로 고른다 — 가맹 마스터는 고정 그룹 하나이고 늘 일부 점포다. */
  const changeRole = (role: BpAdminRoleType | "") => {
    setForm((f) => withRole(f, role, groups));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !["roleTypeCode", "roleGroupId", "stores"].includes(k))));
  };

  const groupOptions = groups.filter((r) => r.roleTypeCode === form.roleTypeCode);
  // 고른 역할에 붙일 그룹이 없으면 저장할 수 없다 — 가맹 마스터가 가맹 관리자 그룹을 아직 만들지 않은 때 등(BP 관리자 등록 정책)
  const noGroupForRole = mode === "create" && !groupsFailed && !!form.roleTypeCode && !groupOptions.length;
  // 탈퇴 · 미사용 BP 에는 등록하지 않는다 — 점포 등록과 같다(플랫폼 계정만 본다, 2026-10-29 사용자 지정). 확인하지 못하면(null) 막지 않는다
  const bpStatus = useCurrentBpStatus();
  const bpBlocked = mode === "create" && bpStatus !== null && bpStatus !== "ACTIVE";
  // 지금 권한 그룹이 선택지에 없으면(보는 사람이 고를 수 없는 그룹) 그 그룹도 남겨 값이 비지 않게 한다
  if (mode === "edit" && !groupOptions.some((r) => r.roleGroupId === props.admin.roleGroup.roleGroupId)) groupOptions.unshift(props.admin.roleGroup);

  const handleSave = () => {
    const found = validateBpAdminForm(form, { mode, outOfScopeCount: outOfScope.length, storesLocked: locks.stores });
    setErrors(found);
    if (found.loginId) setLoginIdCheck("idle");
    if (found.email) setEmailCheck("idle");
    setFailure(null);
    if (Object.keys(found).length) return focusFirstError();

    editedWhileSaving.current = new Set();
    sentForm.current = form;
    startSaving(async () => {
      if (props.mode === "create") {
        const result = await createBpAdminAction(toCreateBpAdminInput(form)).catch(unknownResult("등록"));
        if (!result.ok) {
          // 결과를 모르면 목록을 새로 받아, 이미 만들어졌는지 사용자가 볼 수 있게 한다
          if (result.status === undefined) router.refresh();
          return applyServerError(result.status, result.message);
        }
        return props.onSaved(result);
      }
      const admin = props.admin;
      const input = toUpdateBpAdminInput(form, admin.updatedAt);
      // 가맹 마스터 저장은 늘 함께 바뀔 가맹 관리자를 먼저 센다 — 패널을 연 뒤 점포 등록으로 매핑이 늘면(가맹 마스터 updatedAt 은 그대로)
      // 화면은 뺀 점포가 없다고 보지만 저장은 그 점포를 뺀다. 판단은 api 에 맡기고 cascadeOf 는 확인창 문구에만 쓴다
      const { deactivating, removed } = cascadeOf(admin, input);
      // 본인은 상태 · 점포를 바꾸지 못해(api 도 막는다) 번질 것이 없다 — 세지 않는다
      if (admin.roleTypeCode === "FM" && !admin.actions.isSelf) {
        const impact = await getBpAdminUpdateImpactAction(admin.adminAccountId, input).catch((error: unknown) => {
          console.error("BP 관리자 함께 바뀌는 계정 조회 호출 실패", error);
          return { ok: false as const, status: undefined, message: "" };
        });
        // 모르고 저장하면 가맹 관리자가 말없이 바뀔 수 있다 — 세지 못하면 저장하지 않는다. 로그인 만료는 할 일이 다르므로 그 문구를 그대로 둔다
        if (!impact.ok)
          return setFailure(
            impact.status === 401 ? impact.message : `저장하지 않았습니다. 함께 바뀌는 가맹 관리자를 확인하지 못했습니다. ${impact.status ? impact.message : "잠시 후 다시 시도해 주세요."}`,
          );
        if (impact.deactivatedCount || impact.unmappedCount) return setCascade({ input, impact, deactivating, removed });
      }
      await submitUpdate(input);
    });
  };

  const submitUpdate = async (input: UpdateBpAdminInput) => {
    if (props.mode !== "edit") return;
    const result = await updateBpAdminAction(props.admin.adminAccountId, input).catch(unknownResult("수정"));
    if (result.ok) return props.onSaved();
    if (result.status === undefined) router.refresh();
    // 다른 사람이 먼저 고쳤으면 저장하지 않고 최신 정보를 불러온다 — 칸은 새 값으로 다시 채워진다(알림은 화면이 토스트로 한다)
    if (result.status === 409 && result.message.includes(STALE)) return props.onStale();
    applyServerError(result.status, result.message);
  };
  const confirmCascade = () =>
    startSaving(async () => {
      if (!cascade) return;
      await submitUpdate(cascade.input);
      setCascade(null);
    });

  // 저장하는 동안은 Esc · 바탕 클릭으로도 닫히지 않는다 — 닫히면 저장 결과를 사용자가 못 보고 패널이 먼저 사라진다.
  // 확인창(<dialog>)이 떠 있으면 Esc 는 그 창만 닫아야 한다 — 패널은 data-dismiss-open · keydown 의 defaultPrevented 로 거르는데,
  // 확인창은 그 표시가 없고 Esc 를 cancel 이벤트에서야 막아 패널까지 온다
  const safeClose = () => {
    // 이 패널이 띄운 확인창만 본다 — 일괄 검색 창 등 data-dismiss-open 층은 패널이 먼저 거른다
    if (!saving && !cascade) onClose();
  };
  const title = mode === "create" ? "관리자 등록" : "관리자 수정";

  return (
    // 등록 · 수정 모두 바탕창을 깔고, 바탕을 누르면 겹친 패널을 모두 닫는다(플랫폼 관리자와 같다, 2026-10-23 사용자 확인).
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
          // 고칠 수 없는 아이디를 제목 줄 띠지로 — 플랫폼 관리자 수정과 같다(2026-10-27 사용자 지정 — 전엔 「이름 · 아이디 · 역할」 회색 글자와 기본정보의 읽기 전용 아이디 칸)
          <span className="ml-[6px] inline-flex">
            <Tag>
              아이디 · <b className="font-semibold">{props.admin.loginId}</b>
            </Tag>
          </span>
        )}
      </h2>
      {bpBlocked && <WarnBand>BP가 탈퇴 또는 미사용 상태로, 관리자를 등록할 수 없습니다.</WarnBand>}
      {failure && <FailedBand message={failure} detail="입력한 값은 그대로 두었습니다." />}

      {/* 막힌 칸만 회색으로 그린다 — 공통 입력칸 토큰은 그대로 두고 이 화면 테두리에서만 셈한다(platform-admins 와 같다) */}
      <div className="flex flex-col gap-[24px] [&_select:disabled]:bg-erp-thead-bg">
        <FormGroup title="기본정보">
          {mode === "create" ? (
            <Labeled label="아이디" required message={<LoginIdAvailability id={messageId("loginId")} check={loginIdCheck} message={errors.loginId} />}>
              <TextField
                value={form.loginId}
                onChange={(e) => {
                  checkNumber.current.loginId++;
                  setLoginIdCheck("idle");
                  set("loginId", e.target.value);
                }}
                onBlur={(e) => checkAvailable("loginId", e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (!isEnter(e)) return;
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
            </Labeled>
          ) : null}
          <Labeled label="이름" required message={message("name")}>
            <TextField
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={20}
              placeholder="한글 또는 영문 2~20자"
              aria-invalid={invalid("name")}
              aria-describedby={describe("name")}
              aria-required
            />
          </Labeled>
          <Group label="연락처" required>
            <FormRow>
              {(["앞자리", "가운데자리", "끝자리"] as const).map((label, i) => (
                <TextField
                  key={label}
                  value={form.phone[i]}
                  onChange={(e) => {
                    const next = [...form.phone] as BpAdminForm["phone"];
                    next[i] = e.target.value.replace(/[^0-9]/g, "");
                    set("phone", next);
                  }}
                  inputMode="numeric"
                  maxLength={4}
                  aria-label={`연락처 ${label}`}
                  aria-invalid={invalid("phone")}
                  aria-describedby={describe("phone")}
                  aria-required
                />
              ))}
            </FormRow>
            {message("phone")}
          </Group>
          <Labeled label="이메일" required message={<EmailAvailability id={messageId("email")} check={emailCheck} message={errors.email} />}>
            <TextField
              type="email"
              value={form.email}
              onChange={(e) => {
                checkNumber.current.email++;
                setEmailCheck("idle");
                set("email", e.target.value);
              }}
              onBlur={(e) => checkAvailable("email", e.currentTarget.value)}
              onKeyDown={(e) => {
                if (!isEnter(e)) return;
                e.preventDefault();
                checkAvailable("email", e.currentTarget.value);
              }}
              maxLength={100}
              aria-invalid={invalid("email")}
              aria-describedby={describe("email") ?? (emailCheck !== "idle" ? messageId("email") : undefined)}
              aria-busy={emailCheck === "checking" || undefined}
              aria-required
            />
          </Labeled>
          {mode === "edit" && (
            <>
              <Field label="계정상태" required>
                <Select
                  value={form.accountStatus}
                  onChange={(e) => set("accountStatus", e.target.value as BpAdminForm["accountStatus"])}
                  disabled={locks.status}
                  title={locks.status ? "내 계정의 상태는 바꿀 수 없습니다." : undefined}
                  aria-required
                >
                  <option value="ACTIVE">사용</option>
                  <option value="INACTIVE">미사용</option>
                </Select>
              </Field>
              {deactivationImpact && deactivationImpact.deactivatedCount > 0 && (
                <InfoBand>
                  <p>가맹 마스터를 미사용으로 저장하면 연결된 가맹 관리자 계정도 함께 멈춥니다.</p>
                  <p className="font-normal text-erp-label">
                    가맹 관리자 {andOthers(deactivationImpact.firstDeactivatedLoginId, deactivationImpact.deactivatedCount)} → 미사용
                  </p>
                </InfoBand>
              )}
              {/* 등록일시 · 최근 로그인은 상세에서 본다 — 수정에는 두지 않는다(2026-10-27 사용자 지정) */}
            </>
          )}
          {/* 계정 역할 · 권한명은 기본정보 안 맨 아래 — 따로 있던 「계정 역할」 묶음 제목은 없앴다(2026-10-27 사용자 지정) */}
          {/* 계정 역할 · 권한명은 한 줄에 나란히(2026-10-27 사용자 지정 — 전엔 두 줄). 역할 이름은 7자를 넘지 않아
              계정 역할 칸은 그 폭(글자 + 화살표 30, 150 → 130)으로 줄이고 권한명이 남는 폭을 쓴다(2026-10-27 사용자 지정) */}
          {/* 위쪽 정렬 — 한 칸에만 오류 문구가 붙어 줄이 높아져도 두 입력칸이 같은 높이에 선다(사용자가 찾음). FormRow 는 늘여 세워 옆 칸이 가운데로 내려갔다 */}
          <div className="flex w-full items-start gap-[6px]">
            {mode === "create" && roles.length > 1 ? (
              <Labeled label="계정 역할" width="w-[130px]" required message={message("roleTypeCode")}>
                <Select
                  value={form.roleTypeCode}
                  onChange={(e) => changeRole(e.target.value as BpAdminRoleType | "")}
                  aria-invalid={invalid("roleTypeCode")}
                  aria-describedby={describe("roleTypeCode")}
                  aria-required
                >
                  <option value="">선택</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {roleType(r)}
                    </option>
                  ))}
                </Select>
              </Labeled>
            ) : (
              <Field label="계정 역할" width="w-[130px]">
                <TextField value={form.roleTypeCode ? roleType(form.roleTypeCode) : ""} readOnly />
              </Field>
            )}
            {/* 권한명을 고를 수 없는 이유(목록을 못 받음 · 이 역할의 권한명이 없음)는 위 띠 대신 이 칸 아래에 둔다(2026-10-28 사용자 지정 — 전엔 계정 역할 줄 위 띠) */}
            <Labeled
              label="권한명"
              required={!locks.roleGroup}
              message={
                groupsFailed ? (
                  <FieldMessage id={messageId("roleGroupId")} message="권한명 목록을 불러오지 못했습니다. 화면을 새로 고쳐 주세요." />
                ) : noGroupForRole ? (
                  // [이동]은 환경설정 > 권한그룹 관리(/bp-role-groups, 이 탭 BP 주소)로 간다 — 권한명이 없으면 어차피 저장할 수 없다(2026-10-28 사용자 지정 문구)
                  <span className="flex items-center gap-[10px]">
                    <FieldMessage id={messageId("roleGroupId")} message="선택할 수 있는 권한명이 없습니다. 먼저 권한명을 등록해 주세요." />
                    <Button variant="soft" href={bpPath(currentBp.bpCodeId, "/bp-role-groups")}>
                      이동
                    </Button>
                  </span>
                ) : (
                  message("roleGroupId")
                )
              }
            >
              <Select
                value={form.roleGroupId}
                onChange={(e) => set("roleGroupId", e.target.value)}
                disabled={locks.roleGroup || !form.roleTypeCode}
                title={locks.roleGroup ? "이 계정의 권한명은 여기서 바꿀 수 없습니다." : undefined}
                aria-invalid={invalid("roleGroupId")}
                aria-describedby={groupsFailed || noGroupForRole ? messageId("roleGroupId") : describe("roleGroupId")}
                aria-required
              >
                {!form.roleGroupId && <option value="">{form.roleTypeCode ? "선택" : "계정역할을 먼저 선택하세요."}</option>}
                {groupOptions.map((r) => (
                  <option key={r.roleGroupId} value={r.roleGroupId}>
                    {r.name} · {r.roleCode}
                  </option>
                ))}
              </Select>
            </Labeled>
          </div>
        </FormGroup>

        {/* 상세와 같은 「대상점포」(2026-10-27 사용자 지정) */}
        <FormGroup title="대상점포">
          {/* 「전체 점포」가 막힌 이유를 라벨 옆에 둔다(2026-10-27 사용자 지정 문구 · 자리). 공통코드 이름은 띄어 쓰지 않아(가맹마스터) 문구를 적어 둔다 */}
          {/* 점포를 고칠 수 없는 계정(본인 계정)은 범위 칸을 두지 않고 맡은 점포만 글로 보인다(2026-10-29 사용자 지정) */}
          {!locks.stores && (
            <HintedField
              label="범위"
              required={!locks.scope}
              hint={form.roleTypeCode === "FM" || form.roleTypeCode === "FA" ? `${form.roleTypeCode === "FM" ? "가맹마스터" : "가맹관리자"}는 '일부 점포'만 선택할 수 있습니다.` : undefined}
            >
              <Select
                value={form.isAllStores ? "ALL" : "PART"}
                onChange={(e) => {
                  set("isAllStores", e.target.value === "ALL");
                  clearError("stores");
                }}
                disabled={locks.scope || !allowsAllStores(form.roleTypeCode)}
                aria-required={!locks.scope}
                title={
                  locks.scope && mode === "edit" && props.admin.isAllStores
                    ? "관리 범위가 일부 점포인 사용자는 전체 점포 계정의 범위를 바꿀 수 없습니다."
                    : undefined
                }
              >
                <option value="ALL">전체 점포</option>
                <option value="PART">일부 점포</option>
              </Select>
            </HintedField>
          )}
          {!form.isAllStores && !locks.stores && (
            <div className="flex flex-col gap-[8px]">
              {optionsFailure && (
                <div className="flex flex-col items-start gap-[6px]">
                  <FailedBand message={optionsFailure} detail="고른 점포와 입력한 값은 그대로 두었습니다." />
                  <Button variant="soft" onClick={() => setOptionsRetry((n) => n + 1)}>
                    다시 불러오기
                  </Button>
                </div>
              )}
              <StoreMappingPicker
                panelOpen={open}
                options={optionsReady ? options.items : []}
                picked={form.stores}
                onChange={(next) => set("stores", next)}
                loading={!!optionsRole && !optionsReady && !optionsFailure}
                failed={!!optionsFailure}
                // 후보는 계정 역할마다 다르다(가맹 마스터면 다른 가맹 마스터 담당 점포가 빠진다) — 역할을 고르기 전엔 받지 않으니 찾기를 막는다. 권한명은 상관없다
                blocked={form.roleTypeCode ? undefined : "계정역할을 먼저 선택하세요."}
                invalid={invalid("stores")}
                describedBy={describe("stores")}
              />
              {message("stores")}
            </div>
          )}
          {/* 고칠 수 없으면 맡은 점포를 한 줄씩 — 점포명 + 점포 상태(2026-10-29 사용자 지정, 전엔 쉼표로 이은 이름만). 유형은 api 가 주지 않아 두지 않는다.
              위의 막힌 칸(계정 역할 · 권한명)과 같은 회색 바탕 · 회색 글자 상자에 담아 고칠 수 없다는 것을 보인다(2026-10-29 사용자 지정) */}
          {locks.stores &&
            mode === "edit" &&
            (props.admin.isAllStores || !props.admin.stores.length ? (
              <p className="rounded-[2px] border border-erp-field-line bg-erp-thead-bg px-[10px] py-[7px] text-[14px] text-erp-label">
                {props.admin.isAllStores ? "전체 점포" : "매핑된 점포가 없습니다."}
              </p>
            ) : (
              <ul className="flex flex-col gap-[8px] rounded-[2px] border border-erp-field-line bg-erp-thead-bg px-[10px] py-[8px] text-[14px] text-erp-label">
                {props.admin.stores.map((s) => (
                  <li key={s.storeId} className="flex items-center justify-between gap-[10px]">
                    <span className="min-w-0 truncate">{s.name}</span>
                    <StoreStatusBadge status={s.storeStatusCode as StoreStatus} />
                  </li>
                ))}
              </ul>
            ))}
          {outOfScope.length > 0 && !locks.stores && (
            <div className="flex flex-col gap-[8px]">
              <p className="text-[14px] font-medium text-erp-ink">
                범위 밖 매핑 <span className="font-normal text-erp-label">{outOfScope.length}개점</span>
              </p>
              <Note>내 관리 범위 밖이라 여기서 빼거나 바꿀 수 없습니다. 저장해도 그대로 남습니다.</Note>
              <DataTable
                columns={[
                  { header: "점포명", align: "left", cell: (s: BpAdminStore) => s.name },
                  { header: "점포코드", width: "w-[100px]", cell: (s: BpAdminStore) => s.storeCode },
                  { header: "상태", width: "w-[80px]", cell: (s: BpAdminStore) => <StoreStatusBadge status={s.storeStatusCode as StoreStatus} /> },
                ]}
                rows={outOfScope}
                rowKey={(s) => s.storeId}
              />
            </div>
          )}
        </FormGroup>
      </div>

      {/* 안내 문구는 플랫폼 관리자 등록 · 수정과 같다(2026-10-27 사용자 지정) */}
      {mode === "create" && <Note>초기화 비밀번호는 등록한 이메일로 발송됩니다.</Note>}
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
        {/* 권한 그룹을 받지 못하면 등록은 고를 그룹이 없어 저장할 수 없다(수정은 지금 그룹을 그대로 둔다) */}
        <Button onClick={handleSave} disabled={saving || bpBlocked || (mode === "create" && (groupsFailed || noGroupForRole))}>
          저장
        </Button>
      </div>

      {mode === "edit" && cascade && (
        <ConfirmDialog
          open
          title={cascadeTitle(cascade)}
          confirmLabel={cascade.deactivating ? "미사용으로 저장" : "저장"}
          wide
          busy={saving}
          onConfirm={confirmCascade}
          onCancel={() => setCascade(null)}
        >
          <div className="flex flex-col gap-[12px] break-keep">
            <dl className="grid grid-cols-[84px_1fr] gap-y-[6px] rounded-[2px] border border-erp-thead-line bg-erp-thead-bg p-[12px]">
              <dt className="text-erp-label">대상</dt>
              <dd>
                {props.admin.loginId} {props.admin.name} · {roleType(props.admin.roleTypeCode)}
              </dd>
              {cascade.removed.length > 0 && (
                <>
                  <dt className="text-erp-label">빼는 점포</dt>
                  <dd>{cascade.removed.map((s) => `${s.name} ${s.storeCode}`).join(" · ")}</dd>
                </>
              )}
              {cascade.impact.unmappedCount > 0 && (
                <>
                  <dt className="text-erp-label">매핑 해제</dt>
                  <dd>가맹 관리자 {andOthers(cascade.impact.firstUnmappedLoginId, cascade.impact.unmappedCount)} · 뺀 점포의 매핑만 풀립니다.</dd>
                </>
              )}
              {cascade.impact.deactivatedCount > 0 && (
                <>
                  <dt className="text-erp-label">함께 미사용</dt>
                  <dd>가맹 관리자 {andOthers(cascade.impact.firstDeactivatedLoginId, cascade.impact.deactivatedCount)}</dd>
                </>
              )}
            </dl>
            <p className="text-[13px] text-erp-label">아이디는 첫 계정만 보입니다.</p>
            {cascade.impact.unmappedCount > 0 && (
              <p>점포가 하나도 남지 않는 가맹 관리자도 계정상태는 사용 그대로입니다. 그 계정을 다음에 수정할 때 관리 점포를 한 곳 이상 골라야 저장됩니다.</p>
            )}
            {cascade.impact.deactivatedCount > 0 && (
              <p>
                함께 미사용이 되는 계정의 로그인이 막힙니다. 열려 있는 세션은 닫지 않습니다. 나중에 가맹 마스터를 사용으로 돌려도 가맹 관리자는 미사용으로
                남습니다.
              </p>
            )}
            <p>가맹 관리자 변경이력에는 저장하는 사람이 처리자로 남고, 변경 후 값에 사유가 붙습니다.</p>
          </div>
        </ConfirmDialog>
      )}
    </SlidePanel>
  );
}

/** 확인창 제목 — 점포 빼기 · 미사용 중 이번 저장이 하는 것(목업 pop-cascade). 버튼 문구와 같은 deactivating 을 본다 */
const cascadeTitle = ({ deactivating, removed }: { deactivating: boolean; removed: BpAdminStore[] }) =>
  removed.length && deactivating
    ? "가맹 마스터 점포를 빼고 미사용으로 저장"
    : removed.length
      ? "가맹 마스터 점포를 빼고 저장"
      : deactivating
        ? "가맹 마스터를 미사용으로 저장"
        : // 화면은 바꾼 것이 없다고 보지만 api 가 함께 바뀌는 계정을 센 때(패널을 연 뒤 매핑이 바뀜)
          "가맹 마스터 저장";

/** 입력칸 하나와 그 아래 오류 문구 */
function Labeled({
  label,
  width,
  required,
  message,
  children,
}: {
  label: string;
  /** 한 줄에 나란히 둘 때의 고정 폭. 없으면 Field 처럼 남는 폭을 나눠 가진다(계정 역할 · 권한명) */
  width?: `w-[${number}px]`;
  required?: boolean;
  message: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-[8px] ${width ? `shrink-0 ${width}` : "min-w-px flex-1"}`}>
      <Field label={label} required={required}>
        {children}
      </Field>
      {message}
    </div>
  );
}

/** 라벨 옆에 짧은 도움말을 붙이는 칸 — 공통 Field 는 라벨에 글자만 받아(공통 수정은 1팀과 먼저 맞춘다) 같은 모양으로 그린다. */
function HintedField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col justify-center gap-[8px]">
      <span className="flex min-w-0 items-baseline gap-[10px] text-[14px] font-medium text-erp-label">
        <span className="shrink-0">
          {label}
          {required && <RequiredMark />}
        </span>
        {hint && <span className="truncate text-[13px] font-normal">{hint}</span>}
      </span>
      {children}
    </label>
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
