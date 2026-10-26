"use client";

import { DetailTable, FormRow, ReadonlyCard, ReadonlyValue, Tag, type DetailRow } from "@/components/common";
import { RoleForm, type RoleFormActions } from "@/components/role-groups/role-form";
import { CodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import type { RoleGroupDetail } from "@/lib/platform-role-groups";
import { RoleDeleteDialog, type DeleteDialogActions } from "@/components/role-groups/role-delete-dialog";
import { createRoleGroupAction, deleteRoleGroupAction, getDeletionCandidatesAction, updateRoleGroupAction } from "./actions";
import { formatDateTime } from "@/lib/format";
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
  listEmpty,
  lockReasons,
  onCancelCreate,
  onCreated,
  onDeleted,
}: {
  creating: boolean;
  detail: RoleDetailState;
  /** 권한 목록이 아예 비었는가 — 빈 칸 문구를 가른다 */
  listEmpty: boolean;
  lockReasons: EnumValue[];
  onCancelCreate: () => void;
  onCreated: (id: number) => void;
  onDeleted: () => void;
}) {
  const can = usePagePermission();
  const role = !creating && detail && "role" in detail ? detail.role : null;
  return (
    <section className={`${CARD} w-[464px] shrink-0`} aria-label={creating ? "권한 등록" : "권한 그룹 상세"}>
      {creating ? (
        <RoleForm mode="create" actions={FORM_ACTIONS} createTypeCode="PA" onCancel={onCancelCreate} onDone={onCreated} />
      ) : role ? (
        <RoleView role={role} lockReasons={lockReasons} onDeleted={onDeleted} />
      ) : (
        <>
          <h2 className="flex min-h-[34px] items-end text-[18px] font-semibold text-erp-ink">권한 그룹 상세</h2>
          {detail && "failed" in detail ? (
            <FailedBand message={detail.failed} />
          ) : (
            // 처음 진입 · 고른 권한 없음 — BP 권한 그룹 관리와 같은 문구(2026-10-26 사용자 지정, 제목도 「권한 그룹」으로 맞췄다).
            // 목록이 비었는지로 문구를 가르고, [등록] 안내는 그 버튼이 보일 때(메뉴 권한 create)만 둔다.
            <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">
              {listEmpty ? (
                <>
                  <p>상세 정보를 표시할 권한 그룹이 없습니다.</p>
                  {can.create && <p>새로운 권한 그룹을 추가하려면 [등록] 버튼을 클릭해 주세요.</p>}
                </>
              ) : (
                <p>왼쪽 목록에서 [권한명]을 클릭하면 상세 정보가 표시됩니다.</p>
              )}
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
          { label: "설명", value: role.description || muted("-"), multiline: Boolean(role.description) },
        ]),
  ];
  // 고칠 수 없는 값은 MY PAGE 「계정 정보」와 같은 카드로(2026-10-26 사용자 지정 — 전엔 「기본 정보」 상세 표 세 줄).
  // 일시는 굵게, 사람은 회색으로 「일시 · 사람」.
  const when = (at: string, actor: Parameters<typeof actorOf>[0]) => (
    <>
      {formatDateTime(at)} <span className="font-normal text-erp-label">· {actorOf(actor)}</span>
    </>
  );
  const record = (
    <ReadonlyCard>
      {/* 제목 바는 두지 않는다(2026-10-26 사용자 지정) */}
      <FormRow>
        <ReadonlyValue label="등록" value={when(role.createdAt, role.createdBy)} bold />
        <ReadonlyValue label="최종수정" value={when(role.updatedAt, role.updatedBy)} bold />
      </FormRow>
    </ReadonlyCard>
  );
  const heading = (
    <h2 className="flex min-h-[34px] flex-wrap content-end items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
      {/* 고칠 수 있어도 없어도 같은 제목 — BP 권한 그룹 관리와 같다(2026-10-26 사용자 지정, 전엔 「권한 수정」 · 「권한 상세」) */}
      <span className="mr-[4px]">권한 그룹 상세</span>
      {/* 권한유형(굵게) → 코드 순 — 목록 「권한유형 · 코드」와 같은 순서(2026-10-26 사용자 지정). Tag 는 className 을 받지 않아 안쪽에서 굵힌다.
          띠 안 앞에 「권한유형」 라벨을 두고 유형 이름만 굵힌다(2026-10-26 사용자 지정) */}
      <Tag>
        <span className="font-normal">권한유형 ·</span>{" "}
        <span className="font-semibold">
          <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
        </span>
      </Tag>
      <span className="text-[14px] font-normal text-erp-label">{role.roleCode}</span>
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
        {rows.length > 0 && <DetailTable rows={rows} />}
        {record}
        {deleteButton && <div className="flex gap-[6px]">{deleteButton}</div>}
      </>
    );
  return (
    <>
      {heading}
      <RoleForm mode="edit" actions={FORM_ACTIONS} role={role} extra={record} deleteButton={deleteButton} />
    </>
  );
}
