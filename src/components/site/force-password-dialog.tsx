"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button, Checkbox, PasswordInput, RequiredMark } from "@/components/common";
import { changeForcedPassword, logout } from "@/app/actions";
import { signOut } from "@/lib/bff";
import { passwordChecks } from "@/lib/password";
import type { LoginInfoAccount } from "@/lib/session";
import { TermsLink } from "./terms-link";

// 강제 비밀번호 변경 팝업(S-VFGQLI, 데모 auth/force-password · 목업 auth/force-password.html).
// 초기·임시 비밀번호로 들어온 계정에 로그인 직후 뜬다. 닫기가 없고 Esc·바깥 클릭으로도 닫히지 않는다.
// 모달 <dialog> 라 뒤의 메뉴·마이페이지는 조작할 수 없고, 로그아웃만 팝업 안에서 된다.
// 운영자가 만든 계정(약관 미동의)은 아래에 약관 동의를 붙여 비밀번호와 한 번에 받는다 — 필수 둘에 동의해야 변경 버튼이 열린다.
// 저장은 POST /auth/admin/password-change. 오류 문구는 화면이 만들지 않고 api 의 message 를 그대로 보인다.
export function ForcePasswordDialog({ account, onDone }: { account: LoginInfoAccount; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  /** 새 비밀번호 칸을 한 번 벗어났다 — 규칙 오류는 그 뒤부터 보인다(입력 중에는 재촉하지 않는다, 회원가입과 같다) */
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [terms, setTerms] = useState({ use: false, policy: false });
  // 정책 위반은 비밀번호 칸 아래, 약관 미동의는 약관 아래에 보인다.
  const [error, setError] = useState<{ at: "password" | "terms"; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const needTerms = account.isTermsAgreementRequired;
  const agreed = !needTerms || (terms.use && terms.policy);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  // 확인 칸이 새 비밀번호와 다르면 바로 알린다 — 회원가입과 같은 문구(validators.ts validatePasswordConfirm, 2026-10-28 사용자 지정)
  const mismatch = confirm !== "" && confirm !== password;
  // 두 칸을 다 채워야 [변경]이 켜진다(2026-10-28 사용자 지정)
  const filled = password !== "" && confirm !== "";
  // 비밀번호 규칙(PL-QSBSYY) — 어기면 칸 아래 오류, [변경]도 막는다. 「받은 비밀번호와 다름」은 화면이 몰라 api 가 판정한다(2026-10-28 사용자 지정)
  const [ruleCheck, idCheck] = passwordChecks(password, account.loginId);
  const ruleError =
    password === "" ? undefined : !ruleCheck.met ? "영문·숫자·특수문자를 모두 포함해 8~20자로 입력해 주세요." : !idCheck.met ? "아이디와 다른 비밀번호를 입력해 주세요." : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!agreed || mismatch || !filled || ruleError) return setPasswordTouched(true);
    startTransition(async () => {
      const r = await changeForcedPassword({
        newPassword: password,
        newPasswordConfirm: confirm,
        ...(needTerms && { isTermsAgreed: true }),
      });
      // shortcut: 안내는 브라우저 alert 다. 공통 확인 팝업이 생기면 바꾼다.
      if (r.status === 204) {
        alert("비밀번호가 변경되었습니다.");
        onDone();
      } else if (r.status === 409) {
        onDone(); // 이미 바꾼 계정이다. 팝업만 닫는다.
      } else if (r.status === 401) {
        // 발급 비밀번호가 만료됐으면 api 문구가 비밀번호 찾기를 안내한다. 팝업을 오래 열어 둬 접근 토큰이 끝난 401 이면 세션 만료로 안내한다.
        alert(r.message?.startsWith("발급받은 비밀번호") ? r.message : "세션이 만료되었습니다. 다시 로그인해 주세요.");
        await signOut(logout);
      } else {
        const message = r.message ?? "비밀번호를 변경하지 못했습니다.";
        setError({ at: r.status === 400 && message.includes("약관") ? "terms" : "password", message });
      }
    });
  };

  return (
    // #ebebeb 팝업 테두리·그림자는 DESIGN.md Popups 의 값
    <dialog
      ref={ref}
      aria-labelledby="force-password-title"
      // React 는 cancel·close 를 트리 위로 올린다. 안쪽 약관 팝업의 Esc 까지 막지 않게 이 팝업의 것만 다룬다.
      onCancel={(e) => e.target === e.currentTarget && e.preventDefault()}
      // Chrome 은 사용자 입력 뒤 cancel 막기를 한 번만 허용해 두 번째 Esc 는 그냥 닫는다. 닫히면 바로 다시 연다.
      onClose={(e) => e.target === e.currentTarget && ref.current?.showModal()}
      // 폭 520 — 탈퇴 사유 팝업과 같다(2026-10-28 사용자 지정, 전엔 등록 패널 폭 464)
      className="m-auto w-[520px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <form onSubmit={submit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-[6px]">
          <h2 id="force-password-title" className="text-[18px] font-semibold">
            새 비밀번호 설정
          </h2>
          <p className="text-[15px] text-erp-label">서비스 이용을 위해 새로운 비밀번호를 설정해 주세요.</p>
        </div>

        {account.temporaryPasswordExpiresAt && <Remaining expiresAt={account.temporaryPasswordExpiresAt} />}

        <InkField label="새 비밀번호">
          {/* 크롬 비밀번호 생성 제안 창을 막는다 — new-password 대신 off, 1Password · LastPass 도 빼 둔다(2026-10-28 사용자 지정). 크롬 버전에 따라 다 막히지 않을 수 있다 */}
          {/* 칸 끝에 보기 · 숨기기 눈 아이콘 — 다른 비밀번호 변경 화면과 같은 공통 PasswordInput(2026-10-28 사용자 지정) */}
          <PasswordInput
            fieldLabel="새 비밀번호"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            placeholder="영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요."
            maxLength={20}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            aria-invalid={(passwordTouched && Boolean(ruleError)) || undefined}
          />
        </InkField>
        {passwordTouched && ruleError && <ErrorText>{ruleError}</ErrorText>}
        {/* 약관 제목 · 전체 동의 문구는 회원가입(agree-section.tsx)과 같다 — 「약관동의」 · 「모두 동의합니다.」(2026-10-28 사용자 지정).
            조건 체크 줄 · 「현재 비밀번호는 묻지 않습니다」 · 약관 동의 옆 설명은 지웠다(2026-10-28 사용자 지정) — 조건은 칸 안내와 저장 때 검사가 알린다 */}
        {error?.at === "password" && <ErrorText>{error.message}</ErrorText>}
        <InkField label="새 비밀번호 확인">
          <PasswordInput
            fieldLabel="새 비밀번호 확인"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            maxLength={20}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={mismatch || undefined}
          />
        </InkField>
        {mismatch && <ErrorText>비밀번호가 일치하지 않습니다.</ErrorText>}

        {needTerms && (
          <fieldset className="flex flex-col gap-[12px] border-t border-erp-divider pt-[18px]">
            <legend className="sr-only">약관동의</legend>
            <p>
              <b className="text-[16px] font-semibold">약관동의</b>
            </p>
            <Checkbox
              label="모두 동의합니다."
              checked={terms.use && terms.policy}
              onChange={(e) => setTerms({ use: e.target.checked, policy: e.target.checked })}
            />
            <TermsRow kind="use" label="이용약관 동의 (필수)" checked={terms.use} onChange={(use) => setTerms({ ...terms, use })} />
            <TermsRow kind="policy" label="개인정보 수집·이용 동의 (필수)" checked={terms.policy} onChange={(policy) => setTerms({ ...terms, policy })} />
            {error?.at === "terms" && <ErrorText>{error.message}</ErrorText>}
          </fieldset>
        )}
        {/* 버튼은 가운데, 로그아웃도 버튼 모양(Off) — 다른 확인창의 [취소][확인] 줄과 같다(2026-10-28 사용자 지정) */}
        <div className="flex justify-center gap-[6px]">
          <Button variant="off" onClick={() => signOut(logout)}>
            로그아웃
          </Button>
          <Button type="submit" disabled={pending || !agreed || mismatch || !filled || Boolean(ruleError)}>
            {pending ? "변경 중" : "변경"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

// 이 팝업의 입력칸 라벨은 먹색 글자 + 빨간 필수 표시(2026-10-28 사용자 지정). 공통 Field 는 라벨이 회색이고 className 을 받지 않아 여기서 같은 모양으로 둔다
function InkField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-[8px]">
      <span className="text-[14px] font-medium text-erp-ink">
        {label}
        <RequiredMark />
      </span>
      {children}
    </label>
  );
}

// 이 팝업의 작은 글자(오류 · 전문 보기 · 남은 시간 안내)는 14px — 13px 은 너무 작았다(2026-10-28 사용자 지정)
function ErrorText({ children }: { children: string }) {
  return (
    <p role="alert" className="text-[14px] text-erp-off">
      {children}
    </p>
  );
}

// 필수 항목도 「모두 동의합니다.」와 같은 줄에서 시작한다(들여쓰기 없음, 2026-10-28 사용자 지정)
function TermsRow({ kind, label, checked, onChange }: { kind: "use" | "policy"; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Checkbox label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-[14px]">
        {/* 약관 유형은 공통코드 TERMS_TYPE — 이용약관은 BP 사업자 회원가입용, 개인정보는 그 수집·이용 동의다.
            색·밑줄은 TermsLink 자신이 맡는다(여기서 같이 지정하면 늘 밑줄이 돼 호버 피드백이 사라진다, code-review 리뷰로 찾음). */}
        <TermsLink termsTypeCode={kind === "use" ? "TERMS_SERVICE" : "PRIVACY_COLLECT"}>전문 보기</TermsLink>
      </span>
    </div>
  );
}

// 임시 비밀번호 남은 시간. 다 되면 세션이 끝나므로 로그아웃해 로그인 화면으로 보낸다(S-QCNVFC).
function Remaining({ expiresAt }: { expiresAt: string }) {
  const end = Date.parse(expiresAt);
  const [now, setNow] = useState(() => Date.now());
  const left = Math.max(0, end - now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (left !== 0) return;
    // shortcut: 안내는 브라우저 alert 다. 공통 확인 팝업이 생기면 바꾼다.
    alert("임시 비밀번호 사용 시간이 지났습니다. 다시 로그인해 주세요.");
    signOut(logout);
  }, [left]);

  if (Number.isNaN(end)) return null; // 잘못된 시각이면 남은 시간을 보이지 않는다(만료는 api 가 끊는다).
  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  // 시계 아이콘 · 큰 남은 시간 · 부드러운 안내(2026-10-28 사용자 지정). 5분 아래로 내려가면 남은 시간을 빨갛게(상태 빨강)
  const urgent = left < 5 * 60_000;
  return (
    <div className="flex items-center gap-[12px] rounded-[4px] border border-erp-panel-line bg-erp-thead-bg px-[16px] py-[12px]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[28px] shrink-0 text-erp-brand" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9.5 3h5" />
      </svg>
      <div className="flex min-w-0 flex-col gap-[2px]">
        <p className="flex items-baseline gap-[8px] text-[14px]">
          <span className="text-erp-label">남은 시간</span>
          <b className={`text-[18px] font-semibold tabular-nums ${urgent ? "text-erp-off" : "text-erp-ink"}`}>{`${m}:${String(s).padStart(2, "0")}`}</b>
        </p>
        <p className="text-[14px] text-erp-label">시간 안에 새 비밀번호로 변경해 주세요.</p>
      </div>
    </div>
  );
}
