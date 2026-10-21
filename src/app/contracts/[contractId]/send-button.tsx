"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { sendContract, type SendContractResult } from "./actions";
import { sendFailureOf } from "./send-model";

// 근로계약 재발송(WHALEERP-136). 보내기는 저장할 때 곧바로 하고(2026-10-19 재영), 이 버튼은 다시 보내기만 한다 — 발송 대기
// (가입 초대를 받지 못함) · 서명 대기. 누르면 확인창으로 묻고, 보내면 상세를 다시 읽는다(기한이 바뀐다).
// 지금은 계정이 없는 직원의 가입 초대 알림톡만 간다 — 가입했거나 계정이 있으면 api 가 「앱 알림 준비 중」으로 막는다.
// 서명 대기는 앱으로 받는 직원(가입 · 계정 있음)이라 앱 알림이 생길 때까지 버튼을 막아 둔다(front #58 리뷰). 막힌 버튼은
// 마우스 · 키보드 · 터치 어느 쪽으로도 툴팁이 뜨지 않으므로 까닭을 버튼 옆 글자로 보인다(front #58 재리뷰).
// 접수 여부를 모르거나 화면이 낡았으면(recheck) 보내기를 막고 상세를 다시 읽는다 — 다시 눌러 두 번 가지 않게(front #41 리뷰).
export function SendContractButton({ contractId, status }: { contractId: number; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [pending, start] = useTransition();

  if (status === "PENDING_SIGNATURE")
    return (
      <>
        <span id={`resend-note-${contractId}`} className="text-[13px] text-erp-label">
          앱 알림이 생기면 다시 보낼 수 있습니다
        </span>
        <Button variant="soft" disabled aria-describedby={`resend-note-${contractId}`}>
          재발송
        </Button>
      </>
    );

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        재발송
      </Button>
      <ConfirmDialog
        open={open}
        title="근로계약서를 다시 보내시겠습니까?"
        confirmLabel={pending ? "보내는 중" : "재발송"}
        busy={pending}
        confirmDisabled={locked}
        onCancel={() => {
          setOpen(false);
          setError("");
          setLocked(false);
        }}
        onConfirm={() =>
          start(async () => {
            let result: SendContractResult;
            try {
              result = await sendContract(contractId);
            } catch {
              // 서버 액션 호출 자체가 끊겼다(브라우저 ↔ Next, 배포 중 재시작) — api 는 이미 보냈을 수 있어 「모름」으로 다룬다(front #41 재리뷰)
              result = sendFailureOf(null, undefined, "");
            }
            if (result.ok) {
              setOpen(false);
              setError("");
              // 보내기 실패 안내(?send=)로 왔다면 쿼리를 지운다 — 남아 있으면 「보내지 못했습니다」를 보고 또 누른다(front #50 리뷰)
              router.replace(`/contracts/${contractId}`);
              router.refresh();
              return;
            }
            setError(result.error);
            if (result.recheck) {
              setLocked(true);
              router.refresh();
            }
          })
        }
      >
        <p>직원 휴대전화번호로 가입 초대 알림톡(초대 코드)을 다시 보냅니다. 초대 코드와 서명 기한은 보낸 날부터 30일입니다.</p>
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
