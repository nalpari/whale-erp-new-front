"use client";

import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { deleteContract } from "./actions";

// 임시저장 삭제. 누르면 확인창으로 한 번 더 묻는다.
export function DeleteDraftButton({ contractId, back }: { contractId: number; back: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        삭제
      </Button>
      <ConfirmDialog
        open={open}
        title="임시저장한 근로계약서를 삭제하시겠습니까?"
        confirmLabel={pending ? "삭제 중" : "삭제"}
        busy={pending}
        onCancel={() => {
          setOpen(false);
          setError("");
        }}
        onConfirm={() =>
          start(async () => {
            // 성공하면 액션이 목록으로 보낸다. 돌아왔다면 실패다.
            const { error } = await deleteContract(contractId, back);
            setError(error);
          })
        }
      >
        <p>삭제하면 되돌릴 수 없습니다.</p>
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
