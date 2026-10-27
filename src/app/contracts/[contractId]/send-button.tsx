"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { withBack } from "../contract-list";
import { sendContract, type SendContractResult } from "./actions";
import { resendDialogCopy, sendFailureOf } from "./send-model";

// 근로계약 재발송(WHALEERP-136). 보내기는 저장할 때 곧바로 하고(2026-10-19 재영), 이 버튼은 다시 보내기만 한다 — 발송 대기
// (가입 초대를 받지 못함) · 서명 대기. 누르면 확인창으로 묻고, 보내면 상세를 다시 읽는다(기한이 바뀐다).
// 가입한 직원은 앱 알림(알림함 · 푸시 대기 — 푸시는 #261 · #321 뒤. 받을 계정이 없거나 탈퇴면 알림 없이 기한만 새로, api NTF-25)
// 으로, 계정이 없는 직원은 가입 초대 알림톡으로 간다(WHALEERP-611). 소속 추가 확인 · 복귀 확인(계정 있음 · 이 점포 미가입)은
// 소속 추가 확인 요청(알림톡 · 메일)을 다시 보내고 계약은 발송 대기로 남는다(WHALEERP-130, api #164).
// 확인창 문구는 resendDialogCopy(send-model.ts) — 서명 대기면 데모 문구, 발송 대기면 가입 초대 또는 소속 추가 확인 요청 문구다. 상세 응답에 가입 여부가 없어
// 서명 대기의 가입 전 직원(가입 초대 알림톡)도 데모 문구를 본다. 가입한 직원의 발송 대기(데이터가 이상할 때만)는 api 가 앱 알림으로
// 보내고 서명 대기로 넘기지만, 화면은 가입 여부를 몰라 가입 초대 문구를 보인다.
// 접수 여부를 모르거나 화면이 낡았으면(recheck) 보내기를 막고 상세를 다시 읽는다 — 다시 눌러 두 번 가지 않게(front #41 리뷰).
export function SendContractButton({
  contractId,
  status,
  name,
  draftAction,
  back,
}: {
  contractId: number;
  status: string;
  name: string | null;
  draftAction: string | null;
  back: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [pending, start] = useTransition();
  const copy = resendDialogCopy(status, name, draftAction);

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
              // 보내기 실패 안내(?send=)로 왔다면 쿼리를 지운다 — 남아 있으면 「보내지 못했습니다」를 보고 또 누른다(front #50 리뷰).
              // 돌아갈 목록 주소(?back=)는 남긴다
              router.replace(withBack(`/contracts/${contractId}`, back));
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
