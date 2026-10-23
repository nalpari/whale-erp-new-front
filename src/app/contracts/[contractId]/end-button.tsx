"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { endContract } from "./actions";

// 발송 대기 계약 종료(WHALEERP-155 · 327, 2026-10-21 재영 A안 · 운영 정책 CTR-19). 채용을 접을 때 쓴다 — 종료로 닫고 나간 초대
// 코드 · 링크를 무효로 한다. 행은 남고 상태 이력에 남는다. 확인창으로 한 번 더 묻고, 닫으면 상세를 다시 읽는다. 지금 상태가 발송
// 대기가 아니게 됐으면(409) 그 문장을 보이고 다시 읽어 버튼이 사라지게 한다.
export function EndContractButton({ contractId, name }: { contractId: number; name: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        종료
      </Button>
      <ConfirmDialog
        open={open}
        title="근로계약을 종료하시겠습니까?"
        confirmLabel={pending ? "종료하는 중" : "종료"}
        busy={pending}
        onCancel={() => {
          setOpen(false);
          setError("");
        }}
        onConfirm={() =>
          start(async () => {
            const result = await endContract(contractId);
            if (result.ok) {
              setOpen(false);
              setError("");
              router.refresh();
              return;
            }
            setError(result.error);
            if (result.recheck) router.refresh();
          })
        }
      >
        <p>채용을 접을 때 씁니다. {name ? `${name} 님에게 ` : ""}보낸 가입 초대(초대 코드 · 링크)를 쓸 수 없게 되고, 종료한 계약은 다시 열 수 없습니다.</p>
        <p className="mt-[6px]">계약은 지우지 않고 상태 변경 이력에 남습니다. 남은 직원 정보는 직원 정보 관리에서 퇴직 처리로 정리합니다.</p>
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
