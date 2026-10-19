"use client";

import { useState } from "react";
import { Button, ConfirmDialog } from "@/components/common";
import { useMenuRole } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import { MENU_CODE } from "@/lib/menus";
import { PayslipDraftButton } from "./payslip-draft-dialog";

// 목록 오른쪽 위 버튼(데모 payButtons). 「급여명세서 작성」은 어느 달이든 늘 보이고(2026-10-02 재영), 「확정 N건 발송」은 확정 건이 있을 때만.
// 작성은 그 달 직원을 고르는 팝업을 연다(WHALEERP-226, payslip-draft-dialog.tsx). 발송 api 는 아직 없어 확인창만 열고 닫는다.
// 메뉴 권한은 버튼을 숨기기만 한다 — 막는 것은 api 다.
export function PayslipListActions({
  month,
  confirmedCount,
  employmentTypeLabels,
}: {
  month: string;
  confirmedCount: number;
  employmentTypeLabels: EnumValue[];
}) {
  const canCreate = useMenuRole(MENU_CODE.payslips, "create");
  const canUpdate = useMenuRole(MENU_CODE.payslips, "update");
  const [sending, setSending] = useState(false);

  return (
    <>
      {canCreate && <PayslipDraftButton key={month} month={month} employmentTypeLabels={employmentTypeLabels} />}
      {canUpdate && confirmedCount > 0 && (
        <>
          <Button onClick={() => setSending(true)}>확정 {confirmedCount}건 발송</Button>
          <ConfirmDialog
            open={sending}
            title={`확정한 급여명세서 ${confirmedCount}건을 발송하시겠습니까?`}
            confirmLabel="발송"
            onConfirm={() => setSending(false)}
            onCancel={() => setSending(false)}
          >
            직원 근무 앱으로 보냅니다.
          </ConfirmDialog>
        </>
      )}
    </>
  );
}
