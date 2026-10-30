"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, useAction } from "@/components/common";
import { withBack } from "../contract-list";
import { useCurrentBp } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { endContract, type EndContractResult } from "./actions";
import { END_UNKNOWN, sendFailureOf } from "./send-model";

// 발송 대기 계약 종료(WHALEERP-155 · 327, 2026-10-21 재영 A안 · 운영 정책 CTR-19). 채용을 접을 때 쓴다 — 종료로 닫고 나간 초대
// 코드 · 링크를 무효로 한다. 행은 남고 상태 이력에 남는다. 확인창으로 한 번 더 묻고, 닫으면 상세를 다시 읽는다.
// 화면이 낡았거나(409 — 발송 대기가 아님 · 다른 요청이 먼저 고침) 닫혔는지 모르면(코드 없는 502 · 504 · 응답 전 끊김 · 서버 액션
// 호출 자체가 끊김) 문장을 보이고 상세를 다시 읽는다. 다시 읽어 발송 대기가 아니면 버튼째 확인창이 사라져 바뀐 상태가 보이고, 아직
// 발송 대기면 확인창에서 다시 누를 수 있다 — 재발송과 달리 막지 않는다(이미 닫혔으면 둘째는 409 라 두 번 닫히지 않는다).
// 닫으면 보내기 실패 안내(?send=)를 지운다 — 종료한 계약에 「재발송해 주세요」가 남지 않게(재발송 버튼과 같다).
export function EndContractButton({ contractId, name, back }: { contractId: number; name: string | null; back: string }) {
  const router = useRouter();
  // 상세 주소는 탭 BP 를 붙인다. back 은 옛 경로(목록 쿼리)다
  const bp = useCurrentBp().bpCodeId;
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const end = useAction(endContract, { text: "종료중입니다." });

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
            let result: EndContractResult;
            try {
              result = await end(contractId);
            } catch (e) {
              console.error("근로계약 종료 호출이 끊김", contractId, e);
              // 서버 액션 호출 자체가 끊겼다(브라우저 ↔ Next, 배포 중 재시작) — api 는 이미 닫았을 수 있다
              result = sendFailureOf(null, undefined, "", END_UNKNOWN);
            }
            if (result.ok) {
              setOpen(false);
              setError("");
              router.replace(bpPath(bp, withBack(`/contracts/${contractId}`, back)));
              router.refresh();
              return;
            }
            setError(result.error);
            if (result.recheck) router.refresh();
          })
        }
      >
        <p>채용을 접을 때 씁니다. {name ? `${name} 님에게 ` : ""}보낸 가입 초대(초대 코드 · 링크)를 쓸 수 없게 되고, 종료한 계약은 다시 열 수 없습니다.</p>
        <p className="mt-[6px]">계약은 지우지 않고 상태 변경이력에 남습니다. 남은 직원 정보는 직원 정보 관리에서 퇴직 처리로 정리합니다.</p>
        {error && (
          <p className="mt-[6px] text-erp-off" aria-live="polite">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
