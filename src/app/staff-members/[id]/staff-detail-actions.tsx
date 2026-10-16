"use client";

import { useState } from "react";
import { Button } from "@/components/common";
import { useAccount, useMenuRole } from "@/components/site/session-gate";
import { MENU_CODE } from "@/lib/menus";
import { canResetPassword } from "@/lib/password-reset";
import { retirementActions } from "@/lib/retirement";
import type { StaffMember } from "@/lib/staff-members";
import { PasswordResetDialog } from "./password-reset-dialog";
import { CancelRetirementDialog, RetirementDialog } from "./retirement-dialog";

// 카드 머리 오른쪽(WHALEERP-585). 퇴직 버튼은 retirementActions 가 정한다 — 재직이면 붉은 「퇴직 처리」, 퇴직일 전의 퇴직
// 예정이면 「퇴직일 변경」 · 「퇴직 처리 취소」(목업 detail.html). 수정 권한은 로그인 정보의 메뉴 권한으로 미리 가리고, 막는 것은 api 다.
// 「목록」은 들어올 때의 목록 조건으로 돌아간다(staffListHref).
export function StaffDetailActions({ staff, today, listHref }: { staff: StaffMember; today: string; listHref: string }) {
  const canUpdate = useMenuRole(MENU_CODE.staffMembers, "update");
  const [dialog, setDialog] = useState<"retire" | "change" | "cancel" | null>(null);
  const actions = retirementActions(staff, today, canUpdate);
  const close = () => setDialog(null);
  // 버튼 판정을 지났으면 id 가 있다 — 가린 직원(id 없음)은 상세로 오지 않는다.
  const id = staff.staffMemberId;

  return (
    <>
      {actions === "retire" && (
        <Button variant="danger" onClick={() => setDialog("retire")}>
          퇴직 처리
        </Button>
      )}
      {actions === "scheduled" && (
        <>
          <Button variant="soft" onClick={() => setDialog("change")}>
            퇴직일 변경
          </Button>
          <Button variant="soft" onClick={() => setDialog("cancel")}>
            퇴직 처리 취소
          </Button>
        </>
      )}
      <Button href={listHref}>목록</Button>
      {id !== null && (dialog === "retire" || dialog === "change") && (
        <RetirementDialog staffMemberId={id} mode={dialog} currentDate={staff.retiredDate} today={today} onClose={close} />
      )}
      {id !== null && dialog === "cancel" && <CancelRetirementDialog staffMemberId={id} onClose={close} />}
    </>
  );
}

// 기본 정보 표 바로 아래 줄 오른쪽(데모와 같은 자리). 숨길 때는 줄째 빼 간격이 남지 않게 한다. 가입 전 · 퇴직 · 탈퇴 직원, 수정 권한 없음, 본사 역할의 직영 아닌 점포 직원에게는 숨긴다(canResetPassword).
export function PasswordResetButton({ staff }: { staff: StaffMember }) {
  const canUpdate = useMenuRole(MENU_CODE.staffMembers, "update");
  const { roleTypeCode } = useAccount();
  const [open, setOpen] = useState(false);
  const id = staff.staffMemberId;
  if (id === null || !canResetPassword(staff, roleTypeCode, canUpdate)) return null;

  return (
    <div className="flex items-center justify-end gap-[6px]">
      <Button variant="soft" onClick={() => setOpen(true)}>
        비밀번호 초기화
      </Button>
      {open && <PasswordResetDialog staffMemberId={id} email={staff.email} onClose={() => setOpen(false)} />}
    </div>
  );
}
