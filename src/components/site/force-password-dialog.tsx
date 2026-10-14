"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button, Checkbox, Field, TextField } from "@/components/common";
import { changeForcedPassword, logout } from "@/app/actions";
import { passwordChecks } from "@/lib/password";
import type { LoginInfoAccount } from "@/lib/session";
import { TermsLink } from "./terms-link";

// 강제 비밀번호 변경 팝업(S-VFGQLI, 데모 auth/force-password · 목업 auth/force-password.html).
// 초기·임시 비밀번호로 들어온 계정에 로그인 직후 뜬다. 닫기가 없고 Esc·바깥 클릭으로도 닫히지 않는다.
// 모달 <dialog> 라 뒤의 메뉴·MY PAGE 는 조작할 수 없고, 로그아웃만 팝업 안에서 된다.
// 운영자가 만든 계정(약관 미동의)은 아래에 약관 동의를 붙여 비밀번호와 한 번에 받는다 — 필수 둘에 동의해야 변경 버튼이 열린다.
// 저장은 POST /auth/admin/password-change. 오류 문구는 화면이 만들지 않고 api 의 message 를 그대로 보인다.
export function ForcePasswordDialog({ account, onDone }: { account: LoginInfoAccount; onDone: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState({ use: false, policy: false });
  // 정책 위반은 비밀번호 칸 아래, 약관 미동의는 약관 아래에 보인다.
  const [error, setError] = useState<{ at: "password" | "terms"; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const needTerms = account.isTermsAgreementRequired;
  const agreed = !needTerms || (terms.use && terms.policy);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
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
        // 발급 비밀번호가 만료됐다. 문구가 비밀번호 찾기를 안내한다.
        alert(r.message);
        await logout();
      } else {
        const message = r.message ?? "비밀번호를 변경하지 못했습니다";
        setError({ at: r.status === 400 && message.includes("약관") ? "terms" : "password", message });
      }
    });
  };

  return (
    // #ebebeb 팝업 테두리·그림자는 DESIGN.md Popups 의 값
    <dialog
      ref={ref}
      aria-labelledby="force-password-title"
      onCancel={(e) => e.preventDefault()}
      className="m-auto w-[464px] max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-[23px] font-erp tracking-[-0.025em] text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
    >
      <form onSubmit={submit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-[6px]">
          <h2 id="force-password-title" className="text-[18px] font-semibold">
            새 비밀번호 설정
          </h2>
          <p className="text-[14px] text-erp-label">새 비밀번호를 설정해야 웨일ERP 를 이용할 수 있습니다.</p>
        </div>

        {account.temporaryPasswordExpiresAt && <Remaining expiresAt={account.temporaryPasswordExpiresAt} />}

        <Field label="새 비밀번호">
          <TextField
            type="password"
            autoComplete="new-password"
            placeholder="영문·숫자·특수문자를 조합하여 8~20자 입력해 주세요."
            maxLength={20}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <ul aria-label="비밀번호 조건" className="-mt-[10px] flex flex-wrap gap-x-[10px] text-[13px]">
          {passwordChecks(password, account.loginId).map((c) => (
            <li key={c.label} className={c.met ? "text-erp-brand" : "text-erp-label"}>
              {c.met ? "✓ " : ""}
              {c.label}
              <span className="sr-only">{c.met ? " (충족)" : " (미충족)"}</span>
            </li>
          ))}
          <li className="text-erp-label">받은 비밀번호와 다름</li>
        </ul>
        {error?.at === "password" && <ErrorText>{error.message}</ErrorText>}
        <Field label="새 비밀번호 확인">
          <TextField type="password" autoComplete="new-password" maxLength={20} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <p className="text-[13px] leading-[1.6] text-erp-label">현재 비밀번호는 묻지 않습니다. 바꿔도 이 기기와 다른 기기의 로그인은 모두 그대로 이어집니다.</p>

        {needTerms && (
          <fieldset className="flex flex-col gap-[12px] border-t border-erp-divider pt-[18px]">
            <legend className="sr-only">약관 동의</legend>
            <p className="flex items-baseline gap-[10px]">
              <b className="text-[16px] font-semibold">약관 동의</b>
              <span className="text-[13px] text-erp-label">운영자가 만든 계정이라 본인 동의가 필요합니다</span>
            </p>
            <Checkbox
              label="약관 전체 동의"
              checked={terms.use && terms.policy}
              onChange={(e) => setTerms({ use: e.target.checked, policy: e.target.checked })}
            />
            <TermsRow kind="use" label="이용약관 동의 (필수)" checked={terms.use} onChange={(use) => setTerms({ ...terms, use })} />
            <TermsRow kind="policy" label="개인정보 수집·이용 동의 (필수)" checked={terms.policy} onChange={(policy) => setTerms({ ...terms, policy })} />
            <p className="text-[13px] text-erp-label">필수 두 가지에 모두 동의해야 비밀번호도 바뀝니다. 동의하지 않으면 로그아웃만 할 수 있습니다.</p>
            {error?.at === "terms" && <ErrorText>{error.message}</ErrorText>}
          </fieldset>
        )}
        <div className="flex items-center justify-between text-[14px]">
          <button type="button" onClick={() => logout()} className="text-erp-label transition-colors duration-150 ease-out hover:text-erp-ink">
            로그아웃
          </button>
          <Button type="submit" disabled={pending || !agreed}>
            {pending ? "변경 중" : "변경"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <p role="alert" className="text-[13px] text-erp-off">
      {children}
    </p>
  );
}

function TermsRow({ kind, label, checked, onChange }: { kind: "use" | "policy"; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between pl-[28px]">
      <Checkbox label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-[13px] text-erp-label underline underline-offset-2">
        <TermsLink kind={kind}>전문 보기</TermsLink>
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
    if (left === 0) void logout();
  }, [left]);

  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return (
    <div className="flex flex-col gap-[4px] rounded-[2px] bg-erp-thead-bg px-[12px] py-[10px] text-[14px]">
      <p>
        임시 비밀번호 남은 시간 <b className="font-semibold tabular-nums">{`${m}:${String(s).padStart(2, "0")}`}</b>
      </p>
      <p className="text-[13px] text-erp-label">시간이 지나면 이 세션이 끝나고 로그인 화면으로 돌아갑니다.</p>
    </div>
  );
}
