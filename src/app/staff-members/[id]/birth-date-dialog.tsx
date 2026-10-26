"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Checkbox, ConfirmDialog, DateField, useToast } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import {
  BIRTH_DATE_CONFIRM_LABEL,
  BIRTH_DATE_NOTES,
  BIRTH_DATE_REQUEST_FAILED_MESSAGE,
  canCorrectBirthDate,
  BIRTH_DATE_RECONFIRM_MESSAGE,
  confirmAfterDateChange,
  ignoresCheck,
  isPendingInput,
  checkBirthDate,
  refreshesAfterCorrection,
} from "@/lib/birth-date";
import type { StaffMember } from "@/lib/staff-members";
import { correctBirthDateAction, type ActionResult } from "./actions";
import { useFailure } from "./use-action-failure";

// 기본 정보 「생년월일」 줄의 값과 [정정] 버튼(WHALEERP-602). 목업 detail.html 에는 이 버튼이 없다 — 노영주 승인안이다.
// 버튼은 수정 권한(usePagePermission)과 상세 응답의 birthDateCorrectable 로 미리 가리고, 막는 것은 api 다(canCorrectBirthDate).
export function BirthDateCell({ staff, text, today }: { staff: StaffMember; text: string; today: string }) {
  const canUpdate = usePagePermission().update;
  const [open, setOpen] = useState(false);
  const id = staff.staffMemberId;
  const show = id !== null && canCorrectBirthDate(staff, canUpdate);

  return (
    <span className="inline-flex items-center gap-[8px]">
      <span>{text}</span>
      {show && (
        <Button variant="soft" onClick={() => setOpen(true)}>
          정정
        </Button>
      )}
      {show && open && (
        <BirthDateDialog staffMemberId={id} current={staff.birthDate ?? null} today={today} onClose={() => setOpen(false)} />
      )}
    </span>
  );
}

/**
 * 생년월일 정정 확인창. 신분증 등으로 확인했다는 체크를 해야 [정정]이 눌린다. 안내 세 줄은 정정이 닿는 곳을 알린다(BIRTH_DATE_NOTES).
 * 날짜 칸은 오늘 뒤를 고르지 못하게 달력으로 막지는 못한다(DateField 에 상한이 없다) — 입력하면 칸 아래에 알리고 [정정]을 막는다.
 */
function BirthDateDialog({
  staffMemberId,
  current,
  today,
  onClose,
}: {
  staffMemberId: number;
  current: string | null;
  today: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const [date, setDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // busy 가 그려지기 전에 들어온 두 번째 클릭을 막는다 — 그대로 두면 두 번째 요청이 「지금과 같습니다」 409 를 남긴다.
  const sending = useRef(false);

  const problem = checkBirthDate(date, today, current);
  // 아직 아무것도 치지 않았을 때는 문구를 보이지 않고 버튼만 막는다
  const dateNote = date === "" ? null : problem;

  // 날짜가 바뀌면 확인을 풀어 다시 받는다 — 공통 DateField 는 [정정]을 누르는 순간의 blur 로 덜 친 값(1990-05-1)을 맞춰(1990-05-01)
  // 관리자가 보지 못한 날짜가 저장될 수 있다. blur → onChange → 다시 그림이 click 보다 먼저라 버튼이 잠기지만, 그 사이 낡은 클릭이
  // 들어와도 보내지 않도록 확인 여부를 ref 로도 쥔다(handleConfirm).
  // 입력 중(pending): DateField 는 덜 친 값을 밖으로 내보내지 않아, 칸에 덜 친 값이 보이는 채 직전 완성값이 보내질 수 있다(blur 없이 click 만
  // 오는 보조기기). 입력칸의 글자를 감싼 요소에서 읽어(onInputCapture) 입력 중이면 체크를 풀고 [정정]을 잠그며, onChange(완성 · blur 보정 ·
  // 달력 · 빈 값)가 오면 푼다.
  const confirmedRef = useRef(false);
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);
  // 마우스 체크: pointerdown → (blur 가 날짜를 바꿈) → click 이 체크를 다시 켠다. 그 click 을 무시하려 두 시각을 남긴다.
  const pointerDownAt = useRef<number | null>(null);
  const dateChangedAt = useRef<number | null>(null);
  const [reconfirm, setReconfirm] = useState(false);
  const changeConfirmed = (next: boolean) => {
    confirmedRef.current = next;
    setConfirmed(next);
    setError(null);
    if (next) setReconfirm(false);
  };
  const changePending = (next: boolean) => {
    pendingRef.current = next;
    setPending(next);
  };
  const changeDate = (next: string) => {
    const changed = next !== date || pendingRef.current;
    const keep = confirmAfterDateChange(confirmed, date, next) && !pendingRef.current;
    if (keep !== confirmed) {
      changeConfirmed(keep);
      setReconfirm(true);
    }
    if (changed) dateChangedAt.current = performance.now();
    changePending(false);
    setDate(next);
    setError(null);
  };
  const typing = (text: string) => {
    if (!isPendingInput(text, date)) return;
    changePending(true);
    if (confirmedRef.current) {
      changeConfirmed(false);
      setReconfirm(true);
    }
  };
  const checkClicked = (checked: boolean) => {
    const ignored = ignoresCheck(pendingRef.current, pointerDownAt.current, dateChangedAt.current);
    pointerDownAt.current = null;
    if (checked && ignored) {
      setReconfirm(true);
      return;
    }
    changeConfirmed(checked);
  };

  const handleConfirm = async () => {
    if (sending.current || problem || !confirmed || !confirmedRef.current || pendingRef.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    // try 는 서버 액션 호출만 감싼다 — 결과를 받은 뒤의 처리가 던진 것을 「결과 모름」으로 잘못 알리지 않게.
    let result: ActionResult;
    try {
      result = await correctBirthDateAction(staffMemberId, date, current);
    } catch (e) {
      console.error("생년월일 정정 요청 실패", { staffMemberId }, e);
      setError(BIRTH_DATE_REQUEST_FAILED_MESSAGE);
      return;
    } finally {
      sending.current = false;
      setBusy(false);
    }
    if (result.ok) {
      toast("생년월일을 정정했습니다.");
      onClose();
      router.refresh();
      return;
    }
    // 403 · 결과 모름(5xx · 연결)은 다른 확인창과 같다 — 강제 비밀번호 변경이면 팝업, 권한 없음이면 알리고 이전 화면으로, 결과 모름이면 화면을 새로 받는다.
    if (result.status === undefined || result.status === 403) {
      const message = onFailure(result);
      if (message) setError(message);
      return;
    }
    // 가입 전 · 퇴직 409 면 다시 받은 상세에서 버튼과 함께 이 확인창도 내려간다 — 문구가 사라지지 않게 토스트로 알리고 닫는다.
    if (refreshesAfterCorrection(result)) {
      toast(result.message);
      onClose();
      router.refresh();
      return;
    }
    // 같은 값 409 는 화면의 「지금 생년월일」이 낡았다는 뜻일 수 있다(다른 관리자 · 다른 BP 가 먼저 정정) — 문구는 두고 값만 다시 받는다.
    if (result.code === "BIRTH_DATE_UNCHANGED") router.refresh();
    setError(result.message);
  };

  return (
    <ConfirmDialog
      open
      wide
      title="생년월일 정정"
      confirmLabel="정정"
      busy={busy}
      confirmDisabled={problem !== null || !confirmed || pending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">지금 생년월일</span>
          <span>{current ?? "-"}</span>
        </div>
        <div className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-medium text-erp-label">새 생년월일</span>
          <div onInputCapture={(e) => typing((e.target as HTMLInputElement).value)}>
            <DateField aria-label="새 생년월일" autoHyphen value={date} onChange={changeDate} />
          </div>
          {dateNote && (
            <p role="alert" className="text-[13px] text-erp-off">
              {dateNote}
            </p>
          )}
        </div>
        <div
          className="flex flex-col gap-[4px]"
          onPointerDownCapture={() => (pointerDownAt.current = performance.now())}
          onKeyDownCapture={() => (pointerDownAt.current = null)}
        >
          <Checkbox label={BIRTH_DATE_CONFIRM_LABEL} checked={confirmed} onChange={(e) => checkClicked(e.target.checked)} />
          {(pending || (reconfirm && !confirmed)) && <p className="text-[13px] text-erp-off">{BIRTH_DATE_RECONFIRM_MESSAGE}</p>}
        </div>
        <ul className="flex list-disc flex-col gap-[4px] pl-[20px] text-[13px] text-erp-label">
          {BIRTH_DATE_NOTES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        {error && (
          <p role="alert" className="text-erp-off">
            {error}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
