"use client";

import { useEffect, useId, useRef, useState, useTransition, type RefObject } from "react";
import { Button, Field, FormGroup, FormRow, RequiredMark, SlidePanel, TextField, useToast } from "@/components/common";
import { formatDate, formatDateTime } from "@/lib/format";
import { formOf, serverErrorField, toUpdateInput, validateMyProfileForm, type MyProfileForm, type MyProfileFormField } from "@/lib/my-profile-form";
import type { MyProfile } from "@/lib/my-profile";
import { checkMyEmailAvailableAction, getMyProfileAction, updateMyProfileAction, type ActionResult } from "./my-page-actions";
import { useCodeLabel } from "./code-label";
import { usePatchAccount } from "./session-gate";

/** 저장할 때 api 가 주는 409 문구와 같게 둔다(serverErrorField 가 이 문구를 "이메일" 포함으로 가른다). */
const EMAIL_TAKEN = "이미 등록된 이메일입니다.";

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[13px] leading-[1.5] text-erp-off">
      {message}
    </p>
  );
}

function FailedBand({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-[2px] border border-erp-off-bg bg-erp-off-bg px-[16px] py-[12px] text-[14px] leading-[1.6] text-erp-off">
      {message}
    </div>
  );
}

/** 바꿀 수 없는 계정 정보 칸 — 입력칸 테두리 없이 라벨 위 · 값 아래로만 보인다(사용자 디자인 참고, 2026-10-21).
 * 글자 크기 · 색은 새로 짓지 않고 DetailTable 의 라벨 · 값 토큰을 그대로 쓴다(기존 정책, 2026-10-21 피드백).
 * bold 는 아이디처럼 눈에 먼저 띄어야 하는 값에만 켠다. */
function ReadonlyField({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex min-w-px flex-1 flex-col gap-[4px]">
      <span className="truncate text-[14px] font-medium text-erp-label">{label}</span>
      <span className={`truncate text-[14px] text-erp-ink ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

/** GNB 「내정보 관리」가 여는 슬라이드 패널(S-JXKHCM). 열릴 때마다 api 에서 최신 값을 받는다.
 * 저장은 패널을 닫지 않고 토스트로만 알린다 — 닫기는 따로 있다(데모 site.mjs saveRow 와 같다, 2026-10-06 피드백). */
export function MyPagePanel({ id, open, onClose, trigger }: { id: string; open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null> }) {
  const toast = useToast();
  const roleTypeLabel = useCodeLabel("ROLE_TYPE");
  const patchAccount = usePatchAccount();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [form, setForm] = useState<MyProfileForm | null>(null);
  const [errors, setErrors] = useState<Partial<Record<MyProfileFormField, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  /** 확인을 통과한 이메일 값 — 이 값과 같으면 저장 버튼을 켠다. 원래 이메일도 통과로 친다(바꾸지 않았으면 확인 대상이 아니다). */
  const [emailChecked, setEmailChecked] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  /** 중복 확인 자체가 실패해 통과시킨 값 — "확인됨"과 다른 문구로 보여야 한다(코드 리뷰로 찾음, 2026-10-21). */
  const [emailCheckSkipped, setEmailCheckSkipped] = useState(false);
  const [saving, startSaving] = useTransition();
  const checkNumber = useRef(0);

  // 열 때마다 새로 받는다 — 다른 기기에서 먼저 고쳤을 수 있다. 칸 비우기는 렌더 중에 해도 안전하지만(admin-form-panel.tsx
  // 와 같은 패턴), 실제 네트워크 호출(서버 액션)은 렌더 바깥에서 해야 한다 — 렌더 중에 부르면 "Cannot update a component
  // (Router) while rendering a different component" 경고가 난다(코드 리뷰로 찾음, 2026-10-21).
  const [loadedFor, setLoadedFor] = useState(open);
  if (open !== loadedFor) {
    setLoadedFor(open);
    if (open) {
      setProfile(null);
      setForm(null);
      setErrors({});
      setFailure(null);
      setLoadFailure(null);
      setEmailChecked(null);
      setEmailChecking(false); // 지난 세션에서 확인 중이던 흔적이 남아 "확인하는 중입니다" 가 계속 보이지 않게 한다
      setEmailCheckSkipped(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    checkNumber.current++; // 지난 세션의 확인 응답이 뒤늦게 와도 새 세션 상태를 건드리지 않는다 — ref 는 렌더링 중이 아니라 effect · 이벤트 핸들러 안에서만 건드린다
    let cancelled = false;
    getMyProfileAction()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) return setLoadFailure(result.message);
        setProfile(result.profile);
        setForm(formOf(result.profile));
        setEmailChecked(result.profile.email);
      })
      .catch((error: unknown) => {
        // 서버 액션 자체가 거부될 수 있다(배포 직후 낡은 참조 등) — handleSave 의 저장 호출과 같은 자리를 둔다.
        if (cancelled) return;
        console.error("내 정보 불러오기 호출 실패", error);
        setLoadFailure("내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const ids = useId();
  const clearError = (key: MyProfileFormField) => setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  const set = <K extends keyof MyProfileForm>(key: K, value: MyProfileForm[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    clearError(key as MyProfileFormField);
    // 이메일을 또 고치면 앞서 보낸 확인이 아직 안 왔더라도 버린다 — 늦게 와도 지금 값에 적용되지 않는다.
    if (key === "email") {
      checkNumber.current++;
      setEmailChecking(false);
      setEmailCheckSkipped(false);
    }
  };
  const invalid = (key: MyProfileFormField) => (errors[key] ? true : undefined);
  const messageId = (key: MyProfileFormField) => `${ids}-${key}`;
  const describe = (key: MyProfileFormField) => (errors[key] ? messageId(key) : undefined);
  const message = (key: MyProfileFormField) => <FieldMessage id={messageId(key)} message={errors[key]} />;

  const focusFirstError = () =>
    requestAnimationFrame(() => (document.getElementById(id)?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());

  const applyServerError = (status: number | undefined, msg: string) => {
    const field = serverErrorField(status, msg);
    if (!field) return setFailure(msg);
    setErrors((e) => ({ ...e, [field]: msg }));
    focusFirstError();
  };

  /** 이메일 형식 · 중복 확인 — 칸을 벗어날 때. 원래 값 그대로면 묻지 않는다(S-JXKHCM).
   * 형식이 틀리거나 비어 있으면 여기서 바로 칸 아래 안내로 보여준다 — handleSave 의 validateMyProfileForm 까지
   * 기다리게 두면 Save 버튼만 안 눌리고 이유를 알 수 없다(코드 리뷰로 찾음, 2026-10-21).
   * 중복 확인 자체가 실패(세션 만료 제외)하면 막지 않고 통과시킨다 — 저장 시점에 api 가 중복을 다시 본다. */
  const checkEmail = (value: string) => {
    if (!form) return;
    const email = value.trim();
    if (email === profile?.email) return;
    const formatError = validateMyProfileForm({ ...form, email }).email;
    if (formatError) return setErrors((e) => ({ ...e, email: formatError }));
    const mine = ++checkNumber.current;
    setEmailChecking(true);
    setEmailCheckSkipped(false);
    checkMyEmailAvailableAction(email)
      .then((result: ActionResult<{ available: boolean }>) => {
        if (mine !== checkNumber.current) return;
        setEmailChecking(false);
        if (result.ok) {
          if (result.available) setEmailChecked(email);
          else setErrors((e) => ({ ...e, email: EMAIL_TAKEN }));
        } else if (result.status === 401) {
          setFailure(result.message);
        } else {
          console.warn("이메일 중복 확인을 하지 못했습니다 — 저장할 때 api 가 다시 본다", result.status, result.message);
          setEmailChecked(email);
          setEmailCheckSkipped(true);
        }
      })
      .catch((error: unknown) => {
        if (mine !== checkNumber.current) return;
        setEmailChecking(false);
        console.warn("이메일 중복 확인 호출 실패 — 저장할 때 api 가 다시 본다", error);
        setEmailChecked(email);
        setEmailCheckSkipped(true);
      });
  };

  const emailPassed = !!form && (form.email.trim() === emailChecked || form.email.trim() === profile?.email);

  const handleSave = () => {
    if (!form) return;
    const found = validateMyProfileForm(form);
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) return focusFirstError();
    if (!emailPassed) return setFailure("이메일 확인이 끝난 뒤 저장할 수 있습니다."); // Save 가 꺼져 있어 보통 여기 안 온다(방어적 가드)

    startSaving(async () => {
      try {
        const updated = toUpdateInput(form);
        const result = await updateMyProfileAction(updated);
        if (!result.ok) return applyServerError(result.status, result.message);
        toast("saved");
        setProfile((p) => (p ? { ...p, ...updated } : p));
        // GNB 이름 등 로그인 정보를 쓰는 화면이 다시 로그인하지 않아도 바로 보이게 한다.
        patchAccount({ name: updated.name, email: updated.email });
      } catch (error: unknown) {
        console.error("내 정보 저장 처리 실패", error);
        setFailure("저장 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <SlidePanel id={id} open={open} onClose={onClose} label="내 정보" trigger={trigger} closeOnBackdrop>
      <h2 className="text-[18px] font-semibold text-erp-ink">내 정보</h2>
      {loadFailure && <FailedBand message={loadFailure} />}
      {failure && <FailedBand message={failure} />}
      {!profile || !form ? (
        !loadFailure && <p className="text-erp-muted">불러오는 중입니다.</p>
      ) : (
        <>
          {/* 점포정보 관리 상세화면(DetailTable)의 제목 줄과 같은 회색 바 — FormGroup 의 기본 제목(배경 없음)
              대신 쓴다(사용자 디자인 피드백, 2026-10-21). 본문 카드는 FormGroup 과 같은 토큰으로 직접 짠다.
              아이콘을 넣어 봤지만 24px 로는 너무 작아 뺐다(사용자 지정, 2026-10-21).
              글자 크기 · 굵기는 DetailTable 이 아니라 바로 아래 「기본정보」(FormGroup) 제목과 맞춘다 — 같은 패널
              안에서 두 제목이 달라 보인다는 피드백, 2026-10-21. 회색 바탕 · 테두리만 DetailTable 에서 가져온다. */}
          <div className="w-full">
            <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[15px] font-semibold text-erp-ink">계정 정보</h3>
            <div className="flex flex-col gap-[18px] rounded-b-[2px] border-x border-b border-erp-thead-line bg-white px-[16px] py-[20px]">
              <FormRow>
                <ReadonlyField label="아이디" value={profile.loginId} bold />
                <ReadonlyField label="사용자 권한" value={roleTypeLabel(profile.roleTypeCode)} bold />
              </FormRow>
              <hr className="border-erp-divider" />
              <FormRow>
                <ReadonlyField label="최근 로그인" value={profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : "로그인 기록 없음"} bold />
                <ReadonlyField label="가입일" value={formatDate(profile.createdAt)} bold />
              </FormRow>
            </div>
          </div>

          <FormGroup title="기본정보">
            <div className="flex flex-col gap-[8px]">
              <Field label="이름" required>
                <TextField
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  maxLength={20}
                  placeholder="한글 또는 영문 2~20자로 입력해 주세요."
                  aria-invalid={invalid("name")}
                  aria-describedby={describe("name")}
                  aria-required
                />
              </Field>
              {message("name")}
            </div>
            <div className="flex flex-col gap-[8px]">
              <span className="text-[14px] font-medium text-erp-label">
                연락처
                <RequiredMark />
              </span>
              <FormRow>
                {(["앞자리", "가운데자리", "끝자리"] as const).map((label, i) => (
                  <TextField
                    key={label}
                    value={form.phone[i]}
                    onChange={(e) => {
                      const next = [...form.phone] as MyProfileForm["phone"];
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
            </div>
            <div className="flex flex-col gap-[8px]">
              <Field label="이메일" required>
                <TextField
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={(e) => checkEmail(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    // 한글 조합 중 Enter 는 글자 확정이라 넘긴다(admin-form-panel.tsx checkLoginId 와 같다).
                    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    checkEmail(e.currentTarget.value);
                  }}
                  maxLength={100}
                  placeholder="example@company.com"
                  aria-invalid={invalid("email")}
                  aria-describedby={describe("email")}
                  aria-required
                />
              </Field>
              {!errors.email && emailCheckSkipped && (
                <p className="text-[13px] leading-[1.5] text-erp-label">이메일 확인을 하지 못했습니다. 저장할 때 다시 확인합니다.</p>
              )}
              {!errors.email && !emailCheckSkipped && !emailPassed && (
                <p className="text-[13px] leading-[1.5] text-erp-label">{emailChecking ? "이메일을 확인하는 중입니다." : "중복되지 않은 이메일만 사용할 수 있습니다."}</p>
              )}
              {message("email")}
            </div>
          </FormGroup>

          <div className="flex justify-center gap-[6px]">
            <Button variant="off" onClick={onClose} disabled={saving}>
              닫기
            </Button>
            <Button onClick={handleSave} disabled={saving || !emailPassed}>
              저장
            </Button>
          </div>
        </>
      )}
    </SlidePanel>
  );
}
