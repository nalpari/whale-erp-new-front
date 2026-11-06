"use client";

import { DetailTable, FormRow, ReadonlyCard, ReadonlyValue, Tag, type DetailRow } from "@/components/common";
import { RoleForm, type RoleFormActions } from "@/components/role-groups/role-form";
import { CodeLabel } from "@/components/site/code-label";
import { HeadValues } from "@/components/site/head-values";
import { usePagePermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import { formatDateTime, wasUpdated } from "@/lib/format";
import type { RoleGroupDetail } from "@/lib/platform-role-groups";
import { RoleDeleteDialog, type DeleteDialogActions } from "@/components/role-groups/role-delete-dialog";
import { createRoleGroupAction, deleteRoleGroupAction, getDeletionCandidatesAction, updateRoleGroupAction } from "./actions";
import { actorOf, CARD, FailedBand, InfoBand, reasonLabel, WarnBand, type RoleDetailState } from "./role-parts";

// 오른쪽 고정 칸(데모 role-side) — 고른 권한 없음 · 수정 · 상세(고칠 수 없는 권한) · 등록 네 상태.
// 권한유형 · 권한코드는 읽기 전용이고 권한명 · 설명만 고친다. 고칠 수 있는지 · 지울 수 있는지와 막힌 이유는 api 상세가 준다
// (한글은 GET /enums/PlatformRoleGroupLockReason) — 수정은 권한 없음이 막는다. 본인 연결은 권한명 · 설명은 고치고 삭제 · 메뉴 저장만
// 막는다(2026-10-30 재영). 삭제는 고정 권한도 막는다.
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
  /** 권한 그룹 목록이 아예 비었는가 — 빈 칸 문구를 가른다 */
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
  // 고칠 수 없는 값은 마이페이지 「계정 정보」와 같은 카드로(2026-10-26 사용자 지정 — 전엔 「기본 정보」 상세 표의 등록일시 · 최종수정일시 두 줄).
  // 일시는 굵게, 사람은 회색으로 「일시 · 사람」.
  const whenText = (at: string, actor: Parameters<typeof actorOf>[0]) => `${formatDateTime(at)} · ${actorOf(actor)}`;
  const when = (at: string, actor: Parameters<typeof actorOf>[0]) => (
    <>
      {formatDateTime(at)} <span className="font-normal text-erp-label">· {actorOf(actor)}</span>
    </>
  );
  // 위 · 아래 항목과의 간격을 입력칸 사이(18)와 같게 — 칸 간격 12 에 6 을 더한다(2026-10-26 사용자 지정)
  const record = (
    <div className="mt-[6px]">
      <ReadonlyCard>
        {/* 제목 바는 두지 않는다(2026-10-26 사용자 지정) */}
        {/* 등록 · 최종수정은 한 줄에 하나씩, 사이 선 없이(2026-10-26 사용자 지정) */}
        <FormRow>
          <ReadonlyValue label="등록" value={when(role.createdAt, role.createdBy)} title={whenText(role.createdAt, role.createdBy)} bold />
        </FormRow>
        <FormRow>
          {/* 등록만 하고 고친 적 없으면 「-」(2026-10-27 사용자 요청) */}
          {wasUpdated(role.createdAt, role.updatedAt) ? (
            <ReadonlyValue label="최종수정" value={when(role.updatedAt, role.updatedBy)} title={whenText(role.updatedAt, role.updatedBy)} bold />
          ) : (
            <ReadonlyValue label="최종수정" value={<span className="font-normal text-erp-muted">-</span>} bold />
          )}
        </FormRow>
      </ReadonlyCard>
    </div>
  );
  const heading = (
    <h2 className="flex min-h-[34px] flex-wrap content-end items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
      {/* 고칠 수 있어도 없어도 같은 제목 — BP 권한 그룹 관리와 같다(2026-10-26 사용자 지정, 전엔 「권한 수정」 · 「권한 상세」) */}
      <span className="mr-[4px]">권한 그룹 상세</span>
      {/* 띠 「권한유형 · {유형}」(유형만 굵게) → 코드 순 — 목록 「권한유형 · 코드」와 같은 순서(2026-10-26 사용자 지정). Tag 는 className 을 받지 않아 안쪽 span 으로 굵힌다 */}
      {/* 띠지 뒤에 「| 권한코드 값」 — 권한코드는 띠지가 아니라 글자(라벨 회색 · 값 굵게, 공통코드 상세 코드 머리와 같은 구분선, 2026-10-27 사용자 지정) */}
      <span className="text-[14px] font-normal">
        <HeadValues
          items={[
            {
              value: (
                <Tag>
                  <span className="font-normal">권한유형 ·</span>{" "}
                  <span className="font-semibold">
                    <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
                  </span>
                </Tag>
              ),
            },
            { label: "권한코드", value: role.roleCode },
          ]}
        />
      </span>
    </h2>
  );
  // 지울 수 없는 권한(고정 권한 · 본인 연결 · 삭제 권한 없음)은 버튼을 숨긴다. 고칠 수 있는 화면이면 폼 위 회색 안내 한 줄로 삭제가 막힌
  // 이유를, 고칠 수 없으면 빨간 상자가 고칠 수 없는 이유를 말한다 — BP 권한 그룹과 같다(2026-10-30 재영, 전엔 흐린 버튼 옆에 api 이유를 글자로 두었다)
  const deleteButton =
    can.delete && !role.isMaster && !role.deleteBlockedReason ? (
      <RoleDeleteDialog
        role={role}
        actions={DELETE_ACTIONS}
        // 두 줄로 보인다(줄바꿈은 확인창이 살린다) — 2026-10-26 사용자 지정
        noCandidateText={"대체 권한이 없어 삭제할 수 없습니다.\n플랫폼 관리자 권한을 추가한 후 다시 시도해 주세요."}
        onDeleted={onDeleted}
      />
    ) : null;

  if (!editable)
    return (
      <>
        {heading}
        {/* 조회 권한만 있으면 이유 띠 없이 상세로만 보인다 */}
        {can.update && role.editBlockedReason && (
          // 막힌 이유는 빨간 안내 상자(WarnBand — 2026-10-27 사용자 지정, 전엔 회색 띠)
          <WarnBand>
            {/* 이유를 문장으로(2026-10-28 사용자 지정 — 전엔 api 이유 이름) */}
            {/* 본인 연결은 수정을 막지 않는다 — 권한명 · 설명은 고친다(2026-10-30 재영) */}
            {role.editBlockedReason === "NO_PERMISSION"
              ? "선택한 권한 그룹에 대한 수정 권한이 없습니다."
              : reasonLabel(lockReasons, role.editBlockedReason, "고칠 수 없는 권한입니다.")}
          </WarnBand>
        )}
        {rows.length > 0 && <DetailTable rows={rows} />}
        {record}
        {deleteButton && <div className="mt-[6px] flex justify-center gap-[6px]">{deleteButton}</div>}
      </>
    );
  return (
    <>
      {heading}
      {/* 삭제만 막힌 이유(본인 연결 등) — 고정 권한은 원래 [삭제]가 없어 두지 않는다(2026-10-30 재영) */}
      {can.delete && !role.isMaster && role.deleteBlockedReason && role.deleteBlockedReason !== "FIXED_ROLE" && (
        <InfoBand>
          {role.deleteBlockedReason === "SELF_LINKED"
            ? "내 계정에 연결된 권한 그룹은 삭제할 수 없습니다."
            : reasonLabel(lockReasons, role.deleteBlockedReason, "삭제할 수 없는 권한 그룹입니다.")}
        </InfoBand>
      )}
      <RoleForm mode="edit" actions={FORM_ACTIONS} role={role} extra={record} deleteButton={deleteButton} />
    </>
  );
}
