"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { sendContract, type SendContractResult } from "./actions";
import { sendFailureOf } from "./send-model";

// 근로계약 재발송(WHALEERP-136). 보내기는 저장할 때 곧바로 하고(2026-10-19 재영), 이 버튼은 다시 보내기만 한다 — 발송 대기
// (가입 초대를 받지 못함) · 서명 대기. 누르면 확인창으로 묻고, 보내면 상세를 다시 읽는다(기한이 바뀐다).
// 지금은 계정이 없는 직원의 가입 초대 알림톡만 간다 — 가입했거나 계정이 있으면 api 가 「앱 알림 준비 중」으로 막는다.
// 접수 여부를 모르거나 화면이 낡았으면(recheck) 보내기를 막고 상세를 다시 읽는다 — 다시 눌러 두 번 가지 않게(front #41 리뷰).
export function SendContractButton({ contractId }: { contractId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [pending, start] = useTransition();

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
        <p>직원 휴대전화번호로 가입 초대 알림톡을 다시 보냅니다. 링크와 서명 기한은 보낸 날부터 30일입니다.</p>
        <p className="mt-[6px]">앞서 보낸 링크는 쓸 수 없고, 서명 기한도 새로 잡힙니다.</p>
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
