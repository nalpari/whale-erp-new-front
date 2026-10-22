"use client";

import { DetailTable, DetailValues, Tag, type DetailRow } from "@/components/common";
import { RoleDeleteDialog } from "@/components/role-groups/role-delete-dialog";
import { RoleForm } from "@/components/role-groups/role-form";
import { actorOf, CARD, FailedBand, InfoBand, reasonLabel } from "@/components/role-groups/role-parts";
import { CodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import type { BpRoleGroupDetail, BpRoleType } from "@/lib/bp-role-groups";
import type { EnumValue } from "@/lib/enums";
import { formatDateTime } from "@/lib/format";
import { useBpActions, type BpRoleDetailState } from "./bp-actions";

// 오른쪽 고정 칸(S-LYKAEI 상세 · 데모 config/roles) — 고른 그룹 없음 · 수정 · 상세(고칠 수 없는 그룹) · 등록 네 상태.
// 권한 유형 · 권한 코드 · 관리계정ID 는 읽기 전용이고 권한명 · 설명만 고친다. 따로 수정 단계는 없다(2026-10-07).
// 고칠 수 있는지 · 지울 수 있는지와 막힌 이유(권한 없음 · 본인 연결)는 api 상세가 준다. 등록 유형은 등록자로 정해진다(BM → BA, FM → FA).

export function BpRoleSide({
  creating,
  createTypeCode,
  detail,
  lockReasons,
  onCancelCreate,
  onCreated,
  onDeleted,
}: {
  creating: boolean;
  createTypeCode: BpRoleType | null;
  detail: BpRoleDetailState;
  lockReasons: EnumValue[];
  onCancelCreate: () => void;
  onCreated: (id: number) => void;
  onDeleted: () => void;
}) {
  const actions = useBpActions();
  const role = !creating && detail && "role" in detail ? detail.role : null;
  return (
    <section className={`${CARD} w-[464px] shrink-0`} aria-label={creating ? "권한 등록" : "권한 그룹 상세"}>
      {creating && createTypeCode ? (
        // 제목(「권한 등록」)은 양식이 단다
        <RoleForm mode="create" actions={actions.form} createTypeCode={createTypeCode} onCancel={onCancelCreate} onDone={onCreated} />
      ) : role ? (
        <RoleView role={role} lockReasons={lockReasons} onDeleted={onDeleted} />
      ) : (
        <>
          <h2 className="text-[18px] font-semibold text-erp-ink">권한 그룹 상세</h2>
          {detail && "failed" in detail ? (
            <FailedBand message={detail.failed} />
          ) : (
            <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">
              <p>왼쪽 목록에서 권한 그룹을 고르면 상세가 여기에 섭니다.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RoleView({ role, lockReasons, onDeleted }: { role: BpRoleGroupDetail; lockReasons: EnumValue[]; onDeleted: () => void }) {
  const can = usePagePermission();
  const actions = useBpActions();
  const editable = can.update && role.isEditable;
  const muted = (text: string) => <span className="text-erp-muted">{text}</span>;
  const rows: DetailRow[] = [
    ...(editable
      ? []
      : [
          { label: "권한명", value: role.name },
          { label: "설명", value: role.description ?? muted("—"), multiline: Boolean(role.description) },
        ]),
    {
      label: "관리계정ID",
      // BP 관리자 그룹은 관리계정ID 없이 BP 범위로만 구분한다(S-LYKAEI)
      value: role.manager ? <DetailValues items={[role.manager.loginId, role.manager.name ?? "—"]} /> : "-",
    },
    { label: "등록일시", value: <DetailValues items={[formatDateTime(role.createdAt), actorOf(role.createdBy)]} /> },
    { label: "최종수정일시", value: <DetailValues items={[formatDateTime(role.updatedAt), actorOf(role.updatedBy)]} /> },
  ];
  const heading = (
    <h2 className="flex flex-wrap items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
      <span className="mr-[4px]">권한 그룹 상세</span>
      <span className="text-[14px] font-normal text-erp-label">{role.roleCode}</span>
      <Tag>
        <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
      </Tag>
    </h2>
  );
  // 지울 수 없는 그룹(역할 · 본인 연결)은 버튼을 숨긴다. 막힌 이유는 수정 권한이 있으면 위 띠(editBlockedReason, 같은 값)로 보인다.
  const deleteButton = can.delete && role.isDeletable ? (
    <RoleDeleteDialog
      role={role}
      actions={actions.remove}
      noCandidateText={`옮길 대체 권한 그룹이 없어 지울 수 없습니다. 같은 ${role.roleTypeCode === "FA" ? "가맹 마스터의 가맹 관리자" : "BP 의 BP 관리자"} 권한 그룹을 하나 더 만든 뒤 다시 시도해 주세요.`}
      onDeleted={onDeleted}
    />
  ) : null;

  if (!editable)
    return (
      <>
        {heading}
        {/* 조회 권한만 있으면 이유 띠 없이 상세로만 보인다 */}
        {can.update && role.editBlockedReason && <InfoBand>{reasonLabel(lockReasons, role.editBlockedReason, "고칠 수 없는 권한 그룹입니다")}</InfoBand>}
        <DetailTable title="기본 정보" rows={rows} />
        {deleteButton && <div className="flex gap-[6px]">{deleteButton}</div>}
      </>
    );
  return (
    <>
      {heading}
      <RoleForm mode="edit" actions={actions.form} role={role} extra={<DetailTable title="기본 정보" rows={rows} />} deleteButton={deleteButton} />
    </>
  );
}
