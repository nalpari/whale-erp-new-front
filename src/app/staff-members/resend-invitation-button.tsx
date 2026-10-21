"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/common";
import { useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";
import { sendContract, type SendContractResult } from "../contracts/[contractId]/actions";
import { sendFailureOf } from "../contracts/[contractId]/send-model";

// 직원 목록 · 상세의 가입 초대 재발송(WHALEERP-138). 보일지는 canResendInvitation(staff-row.ts)이 정하고, api 는 근로계약 재발송
// (POST /contracts/:id/send, WHALEERP-136)이다 — 근로계약 상세의 재발송 버튼(send-button.tsx)과 같은 서버 액션 · 실패 판정을 쓴다.
// 다른 메뉴(근로계약 관리 MN000006)의 수정 권한이라 메뉴 코드로 가린다(api #97 이 send 에 수정 권한을 건다). 막는 것은 api 다.
// 보내면 화면을 다시 받아 갱신된 발송일을 보이고 토스트로 알린다. 접수 여부를 모르거나 화면이 낡았으면(recheck) 다시 받은 목록에서
// 이 버튼이 사라질 수 있어, 문구를 토스트로 알리고 닫은 뒤 다시 받는다 — 다시 눌러 두 번 가지 않게.
export function ResendInvitationButton({ contractId, name }: { contractId: number; name: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const allowed = useMenuRole(MENU_CODE.contracts, "update");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  if (!allowed) return null;

  const close = () => {
    setOpen(false);
    setError("");
  };

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        재발송
      </Button>
      <ConfirmDialog
        open={open}
        title="가입 초대를 다시 보내시겠습니까?"
        confirmLabel={pending ? "보내는 중" : "재발송"}
        busy={pending}
        onCancel={close}
        onConfirm={() =>
          start(async () => {
            let result: SendContractResult;
            try {
              result = await sendContract(contractId);
            } catch {
              // 서버 액션 호출 자체가 끊겼다 — api 는 이미 보냈을 수 있어 「모름」으로 다룬다(send-button.tsx 와 같다)
              result = sendFailureOf(null, undefined, "");
            }
            if (result.ok) {
              close();
              toast("가입 초대를 다시 보냈습니다.");
              router.refresh();
              return;
            }
            if (result.recheck) {
              close();
              toast(result.error);
              router.refresh();
              return;
            }
            setError(result.error);
          })
        }
      >
        <p>
          {name ? `${name} 님의 ` : ""}휴대전화번호로 가입 초대 알림톡(초대 코드)을 다시 보냅니다. 초대 코드와 서명 기한은 보낸 날부터 30일입니다.
        </p>
        <p className="mt-[6px]">앞서 보낸 초대 코드는 쓸 수 없고, 서명 기한도 새로 잡힙니다.</p>
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
