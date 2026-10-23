"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { endContract, type EndContractResult } from "./actions";

// 발송 대기 계약 종료(WHALEERP-155 · 327, 2026-10-21 재영 A안 · 운영 정책 CTR-19). 채용을 접을 때 쓴다 — 종료로 닫고 나간 초대
// 코드 · 링크를 무효로 한다. 행은 남고 상태 이력에 남는다. 확인창으로 한 번 더 묻고, 닫으면 상세를 다시 읽는다.
// 화면이 낡았거나(409 — 발송 대기가 아님 · 다른 요청이 먼저 고침) 닫혔는지 모르면(5xx · 응답 전 끊김 · 서버 액션 호출 자체가 끊김)
// 종료를 막고 상세를 다시 읽는다. 다시 읽어 발송 대기가 아니면 버튼째 확인창이 사라져 문장 대신 바뀐 상태가 보인다.
export function EndContractButton({ contractId, name }: { contractId: number; name: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
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
        confirmDisabled={locked}
        onCancel={() => {
          setOpen(false);
          setError("");
          setLocked(false);
        }}
        onConfirm={() =>
          start(async () => {
            let result: EndContractResult;
            try {
              result = await endContract(contractId);
            } catch {
              // 서버 액션 호출 자체가 끊겼다(브라우저 ↔ Next, 배포 중 재시작) — api 는 이미 닫았을 수 있다
              result = { ok: false, error: "종료됐는지 확인하지 못했습니다. 상세를 다시 읽었으니 상태를 확인해 주세요", recheck: true };
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
