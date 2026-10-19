"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, ConfirmDialog, DataTable, useToast } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import type { PayslipListQuery, PayslipSendResult } from "@/lib/payslips";
import { sendPayslips, type DraftFailure } from "./actions";
import { PayslipDraftButton } from "./payslip-draft-dialog";
import { sendTargetOf } from "./payslip-list-query";

// 목록 오른쪽 위 버튼(데모 payButtons). 「급여명세서 작성」은 어느 달이든 늘 보이고(2026-10-02 재영), 「확정 N건 발송」은 확정 건이 있을 때만.
// 작성은 그 달 직원을 고르는 팝업을 연다(WHALEERP-226, payslip-draft-dialog.tsx). 발송은 확인창 뒤 POST /payslips/send(WHALEERP-231 · 237)로
// 목록과 같은 달 · 점포 · 직원명의 확정 명세서를 보낸다. 모두 보내면 토스트, 실패가 있으면 결과 창에 성공 건수와 실패 대상(이름 · 이유)을
// 따로 보인다. 끝나면 목록을 다시 받는다. 메뉴 권한은 버튼을 숨기기만 한다 — 막는 것은 api 다.
export function PayslipListActions({
  query,
  confirmedCount,
  employmentTypeLabels,
}: {
  query: PayslipListQuery;
  confirmedCount: number;
  employmentTypeLabels: EnumValue[];
}) {
  const router = useRouter();
  const toast = useToast();
  const can = usePagePermission();
  const canCreate = can.create;
  const canUpdate = can.update;
  const [sending, setSending] = useState(false);
  const [busy, startBusy] = useTransition();
  const [failure, setFailure] = useState<DraftFailure | null>(null);
  const [result, setResult] = useState<PayslipSendResult | null>(null);

  const send = () =>
    startBusy(async () => {
      const response = await sendPayslips(sendTargetOf(query));
      if (!response.ok) return setFailure(response);
      setSending(false);
      router.refresh();
      if (response.result.failed.length === 0) toast(`${response.result.sent.length}건을 발송했습니다.`);
      else setResult(response.result);
    });
  // 가린 명세서(MASKED)는 이름 · id 가 없어 줄 번호로 가른다
  const failedRows = (result?.failed ?? []).map((f, no) => ({ ...f, no }));

  return (
    <>
      {canCreate && <PayslipDraftButton key={query.month} month={query.month} employmentTypeLabels={employmentTypeLabels} />}
      {canUpdate && confirmedCount > 0 && (
        <Button
          onClick={() => {
            setFailure(null);
            setSending(true);
          }}
        >
          확정 {confirmedCount}건 발송
        </Button>
      )}
      <ConfirmDialog
        open={sending}
        title={`확정한 급여명세서 ${confirmedCount}건을 발송하시겠습니까?`}
        confirmLabel="발송"
        busy={busy}
        onConfirm={send}
        onCancel={() => setSending(false)}
      >
        직원 근무 앱 계정의 이메일로 보내고 발송 완료로 바꿉니다. 앱 푸시 알림은 아직 보내지 않습니다. 일부가 실패해도 보낸 것은 그대로입니다.
        {failure && (
          <p role="alert" className="mt-[8px] font-semibold text-erp-off">
            {failure.message}
          </p>
        )}
      </ConfirmDialog>
      {/* 결과 창 — 알리기만 해서 확인 하나만 둔다 */}
      <ConfirmDialog
        open={result !== null}
        wide
        title={`${result?.sent.length ?? 0}건 발송, ${result?.failed.length ?? 0}건 실패`}
        confirmLabel="확인"
        cancelLabel={null}
        onConfirm={() => setResult(null)}
        onCancel={() => setResult(null)}
      >
        <p>보내지 못한 명세서는 확정 그대로 남아 다시 보낼 수 있습니다.</p>
        <div className="mt-[12px] max-h-[280px] overflow-y-auto">
          <DataTable
            columns={[
              { header: "직원", width: "w-[120px]", cell: (f) => f.staffName ?? <span className="text-erp-muted">본사 제공 동의 없음</span> },
              { header: "이유", align: "left", cell: (f) => f.message },
            ]}
            rows={failedRows}
            rowKey={(f) => f.no}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
