"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/common";
import { useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";
import { sendContract, type SendContractResult } from "../contracts/[contractId]/actions";
import { inviteResendCopy, SEND_UNKNOWN, sendFailureOf } from "../contracts/[contractId]/send-model";

// 직원 목록 · 상세의 가입 초대 재발송(WHALEERP-138). 보일지는 canResendInvitation(staff-row.ts)이 정하고, api 는 근로계약 재발송
// (POST /contracts/:id/send, WHALEERP-136)이다 — 근로계약 상세의 재발송 버튼(send-button.tsx)과 같은 서버 액션 · 실패 판정을 쓴다.
// 다른 메뉴(근로계약 관리 MN000006)의 수정 권한이라 메뉴 코드로 가린다(api #97 이 send 에 수정 권한을 건다). 막는 것은 api 다.
// 보내면 화면을 다시 받아 갱신된 발송일을 보이고 토스트로 알린다.
// 접수 여부를 모르면(SEND_UNCONFIRMED · 응답 끊김) 재발송은 계약 상태를 바꾸지 않아 다시 받은 화면에도 버튼이 그대로다 — 창을 연 채
// 보내기를 잠그고(창을 닫았다 열어도) 문구를 남긴다. 다시 눌러 알림톡이 두 번 가지 않게(근로계약 상세 send-button.tsx 와 같다, PR #85 리뷰).
// api 가 보낼 때 다시 판별해 계정 없는 번호는 가입 초대 알림톡, 계정 있는 번호는 소속 추가 확인 요청(알림톡 · 메일, 계약은 발송 대기 ·
// 날인 기한은 수락한 날부터)을 보낸다(WHALEERP-130, api #164). 화면은 무엇이 갈지 미리 알 수 없어 확인창이 둘을 함께 알린다
// (inviteResendCopy, 근로계약 상세 발송 대기와 같은 문구). 가입한 직원의 앱 알림 재발송은 근로계약 상세에서 한다(WHALEERP-611).
// 화면이 낡았으면(상태 충돌) 다시 받은 화면에서 버튼이 사라지므로 문구를 토스트로 알리고 닫은 뒤 다시 받는다.

/** 목록 · 상세에서 접수 여부를 모를 때의 문장. SEND_UNKNOWN 은 근로계약 상세용(「상세를 다시 읽었으니」)이라 바꿔 쓴다 */
const RESEND_UNKNOWN = "발송됐는지 알 수 없습니다. 화면을 다시 읽었으니 직원에게 받았는지 확인해 주세요 — 다시 보내려면 화면을 새로 고친 뒤 보내 주세요";

export function ResendInvitationButton({ contractId, name }: { contractId: number; name: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const allowed = useMenuRole(MENU_CODE.contracts, "update");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  // 접수 여부를 모르는 실패 뒤에는 이 화면에서 다시 보내지 못한다(새로 고치면 풀린다)
  const [locked, setLocked] = useState(false);
  const [pending, start] = useTransition();
  if (!allowed) return null;
  const copy = inviteResendCopy(name);

  const close = () => {
    setOpen(false);
    // 잠겼으면 문구를 남겨 다시 열었을 때도 까닭이 보이게 한다
    if (!locked) setError("");
  };

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        재발송
      </Button>
      <ConfirmDialog
        open={open}
        title={copy.title}
        confirmLabel={pending ? "보내는 중" : "재발송"}
        busy={pending}
        confirmDisabled={locked}
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
              toast(copy.done);
              router.refresh();
              return;
            }
            if (result.code === "SEND_UNCONFIRMED" || result.error === SEND_UNKNOWN) {
              setLocked(true);
              setError(result.error === SEND_UNKNOWN ? RESEND_UNKNOWN : result.error);
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
        {copy.body.map((line, i) => (
          <p key={i} className={i ? "mt-[6px]" : undefined}>
            {line}
          </p>
        ))}
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
