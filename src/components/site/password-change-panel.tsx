"use client";

import { useEffect, useId, useRef, useState, useTransition, type RefObject } from "react";
import { Button, FailedBand, Field, FieldMessage, FormGroup, PasswordInput, SlidePanel } from "@/components/common";
import { myPasswordErrorField, type MyPasswordFormField } from "@/lib/my-password-form";
import { changeMyPasswordAction } from "./password-change-actions";

type Form = { current: string; next: string; confirm: string };
const EMPTY: Form = { current: "", next: "", confirm: "" };

/** 저장 성공 화면 — 패널을 닫지 않고 폼을 이 화면으로 바꾼다(사용자 지정, 2026-10-26). 다른 기기 로그인은
 * 그대로 이어지므로 "다시 로그인"이 아니라 "다음 로그인부터"로 안내한다. 상자·아이콘은 C안(연한 파랑 원
 * erp-on-bg + 파랑 체크 erp-on, DESIGN.md 상태 파랑·연한 파랑 바탕 토큰) — 입력칸 자리에 권한그룹 상세의
 * 빈 칸과 같은 상자(erp-thead-line 테두리)를 두는 사용자 비교 시안 기준(scratchpad pw-done-compare.html).
 * headingId 로 포커스를 받는다 — 비우지 않으면 폼의 "비밀번호 변경" 버튼이 통째로 사라지며 포커스가 body 로
 * 빠진다(코드 리뷰로 찾음, 2026-10-26). */
function Done({ headingId, onClose }: { headingId: string; onClose: () => void }) {
  return (
    <>
      <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center">
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="mb-[12px]">
          <circle cx="28" cy="28" r="28" className="fill-erp-on-bg" />
          <path d="M17 28.5l7.5 7.5L39.5 21" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-erp-on" />
        </svg>
        <p id={headingId} tabIndex={-1} className="text-[16px] font-semibold text-erp-ink outline-none!">
          비밀번호가 변경되었습니다.
        </p>
        <p className="text-[14px] text-erp-muted">다음 로그인부터 변경된 비밀번호로 로그인해 주세요.</p>
      </div>
      <div className="flex justify-center gap-[6px]">
        <Button onClick={onClose}>닫기</Button>
      </div>
    </>
  );
}

/** GNB 「비밀번호 변경」이 여는 슬라이드 패널(MY PAGE, S-PTWREE). 바꾸면 패널을 닫지 않고 완료 화면(Done)으로
 * 바꾼다(사용자 지정, 2026-10-26). 오류 문구는 화면이 만들지 않고 api 의 message 를 그대로 보인다
 * (force-password-dialog.tsx 와 같은 규칙, 정책 PL-QSBSYY) — myPasswordErrorField 가 어느 칸 탓인지만
 * 가른다. 바꿔도 이 기기 · 다른 기기의 로그인은 모두 이어진다(S-PTWREE outcome) — 재로그인을 요구하지 않는다. */
export function PasswordChangePanel({ id, open, onClose, trigger }: { id: string; open: boolean; onClose: () => void; trigger: RefObject<HTMLElement | null> }) {
  const ids = useId();
  const [form, setForm] = useState<Form>(EMPTY);
  const [fieldError, setFieldError] = useState<{ at: MyPasswordFormField; message: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [saving, startSaving] = useTransition();
  // 패널을 닫았다 다시 열면 지난 저장 요청의 응답이 늦게 와도 새 세션에 적용되지 않게 막는다 — ref 는 렌더링
  // 중이 아니라 effect · 이벤트 핸들러 안에서만 건드린다(my-page-panel.tsx 의 checkNumber 와 같은 패턴, 코드 리뷰로 찾음).
  const saveNumber = useRef(0);

  // 열고 닫을 때마다 칸·오류·완료 화면을 비운다 — SlidePanel 은 닫혀도 children 을 마운트해 두므로(inert +
  // 화면 밖으로 밀기), 닫을 때 비우지 않으면 친 비밀번호 평문이 DOM 의 input value 로 다음에 열 때까지 남는다
  // (코드 리뷰로 찾음, 2026-10-26 — 전엔 열 때만 비워 닫은 뒤에도 값이 남아 있었다). fieldGeneration 은
  // PasswordInput 의 key 로 써 보기/숨기기(visible) 도 같이 초기화한다 — 그 상태는 각 입력칸 안에 있어 패널이
  // 다시 마운트되지 않으면 안 풀린다. 렌더 중에 상태를 맞춘다(effect 가 아니다) — my-page-panel.tsx 의
  // loadedFor 와 같은 패턴(react-hooks/set-state-in-effect 가 걸려 찾음, 2026-10-26). 서버를 부르지 않는
  // 순수 리셋이라 렌더 중에 해도 안전하다. 저장 중에는 닫히지 않으므로(handleClose) 저장 결과를 지우지 않는다.
  const [openedFor, setOpenedFor] = useState(open);
  const [fieldGeneration, setFieldGeneration] = useState(0);
  if (open !== openedFor) {
    setOpenedFor(open);
    setForm(EMPTY);
    setFieldError(null);
    setFailure(null);
    setDone(false);
    setFieldGeneration((g) => g + 1);
  }
  useEffect(() => {
    if (open) saveNumber.current++;
  }, [open]);
  // 성공하면 폼이 통째로 완료 화면으로 바뀌어 포커스를 받던 "비밀번호 변경" 버튼이 사라진다 — 완료 문구로
  // 옮겨 body 로 빠지지 않게 한다(my-page-panel.tsx focusFirstError 와 같은 이유, 코드 리뷰로 찾음, 2026-10-26).
  const doneHeadingId = `${ids}-done`;
  useEffect(() => {
    if (done) requestAnimationFrame(() => document.getElementById(doneHeadingId)?.focus());
  }, [done, doneHeadingId]);

  const messageId = (field: MyPasswordFormField) => `${ids}-${field}`;
  const invalid = (field: MyPasswordFormField) => (fieldError?.at === field ? true : undefined);
  const describe = (field: MyPasswordFormField) => (fieldError?.at === field ? messageId(field) : undefined);
  // my-page-panel.tsx 의 focusFirstError 와 같다 — 패널 자신의 id(SlidePanel 의 <aside id={id}>)로 좁힌다.
  // requestAnimationFrame 의 반환값(번호)을 그대로 돌려주면 안 된다 — handleSave 의 async 콜백이 이 값을
  // 반환해 useTransition 의 TransitionFunction 타입(Promise<void>)과 안 맞는다(타입체크로 찾음, 2026-10-26).
  const focusFirstError = () => {
    requestAnimationFrame(() => (document.getElementById(id)?.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus());
  };

  // Esc · 바탕 클릭도 이 하나로 받는다 — 저장 중에 닫으면 결과(성공이면 완료 화면, 실패면 오류 문구)를 아무도
  // 못 본다(closeOnBackdrop 이 saving 을 안 보고 그대로 onClose 를 불러서, 닫기 버튼만 disabled 여도 막히지
  // 않았다 — 코드 리뷰로 찾음, 2026-10-26). "닫기" 버튼은 이미 disabled={saving} 이라 저장 중엔 안 눌리지만,
  // 한 군데서 막아 둔다.
  const handleClose = () => {
    if (!saving) onClose();
  };

  const handleSave = () => {
    setFieldError(null);
    setFailure(null);
    const mine = saveNumber.current;
    startSaving(async () => {
      try {
        const result = await changeMyPasswordAction({
          currentPassword: form.current,
          newPassword: form.next,
          newPasswordConfirm: form.confirm,
        });
        if (mine !== saveNumber.current) return; // 그사이 패널을 닫았다 다시 열었다 — 지난 응답은 버린다
        if (!result.ok) {
          const field = myPasswordErrorField(result.status, result.message);
          if (!field) return setFailure(result.message);
          setFieldError({ at: field, message: result.message });
          return focusFirstError();
        }
        setForm(EMPTY);
        setDone(true);
      } catch (error: unknown) {
        // 서버 액션 자체가 거부될 수 있다(배포 직후 낡은 참조 등) — my-page-panel.tsx handleSave 와 같은 자리.
        if (mine !== saveNumber.current) return;
        console.error("비밀번호 변경 처리 실패", error);
        setFailure("비밀번호 변경 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <SlidePanel id={id} open={open} onClose={handleClose} label="비밀번호 변경" trigger={trigger} closeOnBackdrop>
      <h2 className="text-[18px] font-semibold text-erp-ink">비밀번호 변경</h2>
      {done ? (
        <Done headingId={doneHeadingId} onClose={onClose} />
      ) : (
        <>
          {failure && <FailedBand message={failure} />}

          <FormGroup title="새 비밀번호 설정">
            <div className="flex flex-col gap-[8px]">
              <Field label="현재 비밀번호" required>
                <PasswordInput
                  key={fieldGeneration}
                  fieldLabel="현재 비밀번호"
                  autoComplete="current-password"
                  placeholder="지금 쓰고 있는 비밀번호를 입력해 주세요."
                  maxLength={100}
                  value={form.current}
                  onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                  aria-invalid={invalid("current")}
                  aria-describedby={describe("current")}
                  aria-required
                />
              </Field>
              <FieldMessage id={messageId("current")} message={fieldError?.at === "current" ? fieldError.message : undefined} />
            </div>

            <div className="flex flex-col gap-[8px]">
              <Field label="새 비밀번호" required>
                {/* maxLength 는 100 — 정책의 실제 최대(20자)보다 훨씬 커서 붙여넣은 진짜 비밀번호를 자르지
                 * 않는다. api DTO 의 MaxLength(100) 보다 긴 값만 막아, 그 칸이 영문 class-validator 문구로
                 * "새 비밀번호" 칸에 잘못 붙는 것을 막는다(코드 리뷰로 찾음, 2026-10-26). */}
                <PasswordInput
                  key={fieldGeneration}
                  fieldLabel="새 비밀번호"
                  autoComplete="new-password"
                  placeholder="영문·숫자·특수문자를 조합하여 8~20자로 입력해 주세요."
                  maxLength={100}
                  value={form.next}
                  onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                  aria-invalid={invalid("newPassword")}
                  aria-describedby={describe("newPassword")}
                  aria-required
                />
              </Field>
              {/* 안내(비밀번호 정책 조건)는 칸 안 placeholder 로 두고, 칸 아래는 오류가 있을 때만 보인다(docs/demo pwField
               * 기준, 2026-10-26 사용자 지정 — 전엔 조건 충족 여부를 칸 아래 늘 보이는 체크리스트로 띄웠다). */}
              <FieldMessage id={messageId("newPassword")} message={fieldError?.at === "newPassword" ? fieldError.message : undefined} />
            </div>

            <div className="flex flex-col gap-[8px]">
              <Field label="새 비밀번호 확인" required>
                <PasswordInput
                  key={fieldGeneration}
                  fieldLabel="새 비밀번호 확인"
                  autoComplete="new-password"
                  placeholder="새 비밀번호를 한 번 더 입력해 주세요."
                  maxLength={100}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  aria-invalid={invalid("newPasswordConfirm")}
                  aria-describedby={describe("newPasswordConfirm")}
                  aria-required
                />
              </Field>
              <FieldMessage id={messageId("newPasswordConfirm")} message={fieldError?.at === "newPasswordConfirm" ? fieldError.message : undefined} />
            </div>
          </FormGroup>

          <div className="flex justify-center gap-[6px]">
            <Button variant="off" onClick={handleClose} disabled={saving}>
              닫기
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.current || !form.next || !form.confirm}>
              비밀번호 변경
            </Button>
          </div>
        </>
      )}
    </SlidePanel>
  );
}
