"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { sendContract } from "./actions";

// 근로계약 발송 · 재발송(WHALEERP-136). 누르면 확인창으로 묻고, 보내면 상세를 다시 읽는다(서명 대기 · 기한이 바뀐다).
// 지금은 계정이 없는 직원의 가입 초대 알림톡만 간다 — 기존 계정이면 api 가 「앱 알림 준비 중」으로 막는다.
export function SendContractButton({ contractId, resend }: { contractId: number; resend: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const label = resend ? "재발송" : "발송";

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title={resend ? "근로계약서를 다시 보내시겠습니까?" : "근로계약서를 보내시겠습니까?"}
        confirmLabel={pending ? "보내는 중" : label}
        busy={pending}
        onCancel={() => {
          setOpen(false);
          setError("");
        }}
        onConfirm={() =>
          start(async () => {
            const result = await sendContract(contractId);
            if (result.ok) {
              setOpen(false);
              setError("");
              router.refresh();
              return;
            }
            setError(result.error);
          })
        }
      >
        <p>직원 휴대전화번호로 가입 초대 알림톡을 보냅니다. 링크와 서명 기한은 보낸 날부터 30일입니다.</p>
        {resend && <p className="mt-[6px]">다시 보내면 앞서 보낸 링크는 쓸 수 없고, 서명 기한도 새로 잡힙니다.</p>}
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
