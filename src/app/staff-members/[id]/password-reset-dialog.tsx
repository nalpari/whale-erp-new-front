"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ConfirmDialog, useAction, useToast } from "@/components/common";
import { RESET_REQUEST_FAILED_MESSAGE, refreshesAfterReset, resetFailureMessage, resetRecipientText } from "@/lib/password-reset";
import { issuePasswordResetLinkAction, type ActionResult } from "./actions";
import { useFailure } from "./use-action-failure";

/**
 * 비밀번호 초기화 확인창(WHALEERP-177). 제목 · 버튼과 본문 뼈대는 데모 detail.mjs 의 resetDialog 다. 본문에는 관리자가 비밀번호를
 * 모른다는 것(Plane 완료 조건 2)과 새 링크가 앞 링크를 무효로 한다는 것(목업 detail.html)을 더했고, 1분 제한은 api 의 429 문구에
 * 맞췄다. 관리자는 새 비밀번호를 정하지 않는다 — 직원이 링크를 열어 스스로 정하고, 관리자는 그 값을 보지 못한다.
 * 보낸 시각 · 기한은 보이지 않는다 — 발송 이력은 이메일 발송 로그 테이블과 함께 따로 다룬다(2026-10-16 노영주).
 */
export function PasswordResetDialog({ staffMemberId, email, onClose }: { staffMemberId: number; email: string | null; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const issuePasswordResetLink = useAction(issuePasswordResetLinkAction, { overlay: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // busy 가 그려지기 전에 들어온 두 번째 클릭을 막는다 — 그대로 두면 두 번째 요청이 429 문구를 남긴다.
  const sending = useRef(false);

  const handleConfirm = async () => {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    // try 는 서버 액션 호출만 감싼다 — 결과를 받은 뒤의 처리가 던진 것을 「결과 모름」으로 잘못 알리지 않게.
    let result: ActionResult;
    try {
      result = await issuePasswordResetLink(staffMemberId);
    } catch (e) {
      console.error("재설정 링크 발송 요청 실패", { staffMemberId }, e);
      setError(RESET_REQUEST_FAILED_MESSAGE);
      return;
    } finally {
      sending.current = false;
      setBusy(false);
    }
    if (result.ok) {
      toast("재설정 링크를 보냈습니다.");
      onClose();
      return;
    }
    // 403 은 퇴직 확인창과 같다 — 강제 비밀번호 변경이면 팝업, 권한 없음 · 쓸 수 없는 계정이면 알리고 이전 화면으로.
    if (result.status === 403) {
      const message = onFailure(result);
      if (message) setError(message);
      return;
    }
    // 409 면 다시 받은 상세에서 버튼과 함께 이 확인창도 내려간다 — 문구가 사라지지 않게 토스트로 알리고 닫는다.
    if (refreshesAfterReset(result)) {
      toast(resetFailureMessage(result));
      onClose();
      router.refresh();
      return;
    }
    setError(resetFailureMessage(result));
  };

  return (
    <ConfirmDialog open wide title="비밀번호를 초기화하시겠습니까?" confirmLabel="초기화" busy={busy} onConfirm={handleConfirm} onCancel={onClose}>
      <div className="flex flex-col gap-[12px]">
        <p>
          {resetRecipientText(email)} 비밀번호 재설정 링크를 보냅니다. 새 비밀번호는 직원이 직접 설정합니다.
        </p>
        <p>
          링크는 24시간 동안 한 번만 사용할 수 있습니다.
        </p>
        {error && (
          <p role="alert" className="text-erp-off">
            {error}
          </p>
        )}
      </div>
    </ConfirmDialog>
  );
}
