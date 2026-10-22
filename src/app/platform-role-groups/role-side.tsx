"use client";

import { DetailTable, DetailValues, Tag, type DetailRow } from "@/components/common";
import { RoleForm, type RoleFormActions } from "@/components/role-groups/role-form";
import { CodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import type { RoleGroupDetail } from "@/lib/platform-role-groups";
import { RoleDeleteDialog, type DeleteDialogActions } from "@/components/role-groups/role-delete-dialog";
import { createRoleGroupAction, deleteRoleGroupAction, getDeletionCandidatesAction, updateRoleGroupAction } from "./actions";
import { actorOf, CARD, FailedBand, InfoBand, reasonLabel, type RoleDetailState } from "./role-parts";

// 오른쪽 고정 칸(데모 role-side) — 고른 권한 없음 · 수정 · 상세(고칠 수 없는 권한) · 등록 네 상태.
// 권한유형 · 권한코드는 읽기 전용이고 권한명 · 설명만 고친다. 고칠 수 있는지 · 지울 수 있는지와 막힌 이유는 api 상세가 준다
// (한글은 GET /enums/PlatformRoleGroupLockReason) — 수정은 권한 없음 · 본인 연결이 막고, 삭제는 여기에 고정 권한까지 막는다.
// 등록은 플랫폼 관리자(PA) 권한만 만든다.

const FORM_ACTIONS: RoleFormActions = { create: createRoleGroupAction, update: updateRoleGroupAction };
const DELETE_ACTIONS: DeleteDialogActions = { candidates: getDeletionCandidatesAction, remove: deleteRoleGroupAction };

export function RoleSide({
  creating,
  detail,
  lockReasons,
  onCancelCreate,
  onCreated,
  onDeleted,
}: {
  creating: boolean;
  detail: RoleDetailState;
  lockReasons: EnumValue[];
  onCancelCreate: () => void;
  onCreated: (id: number) => void;
  onDeleted: () => void;
}) {
  const role = !creating && detail && "role" in detail ? detail.role : null;
  return (
    <section className={`${CARD} w-[464px] shrink-0`} aria-label={creating ? "권한 등록" : "권한 수정"}>
      {creating ? (
        <RoleForm mode="create" actions={FORM_ACTIONS} createTypeCode="PA" onCancel={onCancelCreate} onDone={onCreated} />
      ) : role ? (
        <RoleView role={role} lockReasons={lockReasons} onDeleted={onDeleted} />
      ) : (
        <>
          <h2 className="text-[18px] font-semibold text-erp-ink">권한 수정</h2>
          {detail && "failed" in detail ? (
            <FailedBand message={detail.failed} />
          ) : (
            // 처음 진입 · 고른 권한 없음 — 메뉴 관리의 빈 상세와 같은 안내(데모 2026-10-08)
            <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">
              <p>왼쪽 목록에서 권한을 고르면 수정 화면이 여기에 섭니다.</p>
              <p className="text-[13px]">아무것도 고르지 않고 등록을 누르면</p>
              <p className="text-[13px]">플랫폼 관리자 유형의 새 권한을 등록합니다.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RoleView({ role, lockReasons, onDeleted }: { role: RoleGroupDetail; lockReasons: EnumValue[]; onDeleted: () => void }) {
  const can = usePagePermission();
  const editable = can.update && role.isEditable;
  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const rows: DetailRow[] = [
    ...(editable
      ? []
      : [
          { label: "권한명", value: role.name },
          { label: "설명", value: role.description ?? muted("—"), multiline: Boolean(role.description) },
        ]),
    { label: "등록일시", value: <DetailValues items={[formatDateTime(role.createdAt), actorOf(role.createdBy)]} /> },
    { label: "최종수정일시", value: <DetailValues items={[formatDateTime(role.updatedAt), actorOf(role.updatedBy)]} /> },
  ];
  const heading = (
    <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
      <span className="mr-[4px]">{editable ? "권한 수정" : "권한 상세"}</span>
      <span className="text-[14px] font-normal text-erp-label">{role.roleCode}</span>
      <Tag>
        <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
      </Tag>
    </h2>
  );
  const deleteButton =
    can.delete && !role.isMaster ? (
      <RoleDeleteDialog
        role={role}
        actions={DELETE_ACTIONS}
        noCandidateText="옮길 대체 권한이 없어 지울 수 없습니다. 플랫폼 관리자 추가 권한을 하나 더 만든 뒤 다시 시도해 주세요."
        blockedReason={role.deleteBlockedReason && reasonLabel(lockReasons, role.deleteBlockedReason, "지울 수 없는 권한입니다")} onDeleted={onDeleted} />
    ) : null;

  if (!editable)
    return (
      <>
        {heading}
        {/* 조회 권한만 있으면 이유 띠 없이 상세로만 보인다 */}
        {can.update && role.editBlockedReason && <InfoBand>{reasonLabel(lockReasons, role.editBlockedReason, "고칠 수 없는 권한입니다")}</InfoBand>}
        <DetailTable title="기본 정보" rows={rows} />
        {deleteButton && <div className="flex gap-[6px]">{deleteButton}</div>}
      </>
    );
  return (
    <>
      {heading}
      <RoleForm mode="edit" actions={FORM_ACTIONS} role={role} extra={<DetailTable title="기본 정보" rows={rows} />} deleteButton={deleteButton} />
    </>
  );
}
