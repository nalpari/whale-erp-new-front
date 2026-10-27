"use client";

import { DetailTable, FormRow, ReadonlyCard, ReadonlyValue, Tag, type DetailRow } from "@/components/common";
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
// 권한 유형 · 권한 코드 · 가맹마스터 계정은 읽기 전용이고 권한명 · 설명만 고친다. 따로 수정 단계는 없다(2026-10-07).
// 고칠 수 있는지 · 지울 수 있는지와 막힌 이유(권한 없음 · 본인 연결)는 api 상세가 준다. 등록 유형은 등록자로 정해진다(BM → BA, FM → FA).

export function BpRoleSide({
  creating,
  createTypeCode,
  detail,
  listEmpty,
  lockReasons,
  onCancelCreate,
  onCreated,
  onDeleted,
}: {
  creating: boolean;
  createTypeCode: BpRoleType | null;
  detail: BpRoleDetailState;
  /** 권한 그룹 목록이 아예 비었는가(total 0) — 빈 칸 문구를 가른다 */
  listEmpty: boolean;
  lockReasons: EnumValue[];
  onCancelCreate: () => void;
  onCreated: (id: number) => void;
  onDeleted: () => void;
}) {
  const actions = useBpActions();
  const can = usePagePermission();
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
          <h2 className="flex min-h-[34px] items-end text-[18px] font-semibold text-erp-ink">권한 그룹 상세</h2>
          {detail && "failed" in detail ? (
            <FailedBand message={detail.failed} />
          ) : (
            // 목록이 비었는지로 문구를 가른다(2026-10-26 사용자 지정). [등록] 안내는 그 버튼이 보일 때만 — 버튼은
            // 메뉴 권한 + creatableRoleTypeCode 로 보이므로(roles-screen.tsx) 같은 조건을 쓴다.
            <div className="flex flex-col items-center gap-[6px] rounded-[2px] border border-erp-thead-line px-[18px] py-[36px] text-center text-[14px] text-erp-muted">
              {listEmpty ? (
                <>
                  <p>상세 정보를 표시할 권한 그룹이 없습니다.</p>
                  {can.create && createTypeCode !== null && <p>새로운 권한 그룹을 추가하려면 [등록] 버튼을 클릭해 주세요.</p>}
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
          { label: "설명", value: role.description || muted("-"), multiline: Boolean(role.description) },
        ]),
  ];
  // 고칠 수 없는 값은 MY PAGE 「계정 정보」와 같은 카드로(2026-10-26 사용자 지정 — 전엔 「기본 정보」 상세 표 세 줄).
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
        {/* 가맹마스터 계정(api manager) — 가맹 관리자 그룹을 만든 가맹 마스터. BP 관리자 그룹은 없어서 「-」(S-LYKAEI). 줄은 늘 둔다(2026-10-26 사용자 지정) */}
        <FormRow>
          <ReadonlyValue
            label="가맹마스터 계정"
            help="가맹관리자 권한을 생성한 가맹마스터의 정보가 표시됩니다."
            value={role.manager ? (role.manager.name ? `${role.manager.loginId} · ${role.manager.name}` : role.manager.loginId) : <span className="font-normal text-erp-muted">-</span>}
            bold
          />
        </FormRow>
        <hr className="border-erp-divider" />
        {/* 등록 · 최종수정은 한 줄에 하나씩, 사이 선 없이(2026-10-26 사용자 지정) */}
        <FormRow>
          <ReadonlyValue label="등록" value={when(role.createdAt, role.createdBy)} title={whenText(role.createdAt, role.createdBy)} bold />
        </FormRow>
        <FormRow>
          <ReadonlyValue label="최종수정" value={when(role.updatedAt, role.updatedBy)} title={whenText(role.updatedAt, role.updatedBy)} bold />
        </FormRow>
      </ReadonlyCard>
    </div>
  );
  const heading = (
    <h2 className="flex min-h-[34px] flex-wrap content-end items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
      <span className="mr-[4px]">권한 그룹 상세</span>
      {/* 띠 「권한유형 · {유형}」(유형만 굵게) → 코드 순 — 목록 「권한유형 · 코드」와 같은 순서(2026-10-26 사용자 지정). Tag 는 className 을 받지 않아 안쪽 span 으로 굵힌다 */}
      <Tag>
        <span className="font-normal">권한유형 ·</span>{" "}
        <span className="font-semibold">
          <CodeLabel group="ROLE_TYPE" value={role.roleTypeCode} />
        </span>
      </Tag>
      <span className="text-[14px] font-normal text-erp-label">{role.roleCode}</span>
    </h2>
  );
  // 지울 수 없는 그룹(역할 · 본인 연결)은 버튼을 숨긴다. 막힌 이유는 수정 권한이 있으면 위 띠(editBlockedReason, 같은 값)로 보인다.
  const deleteButton = can.delete && role.isDeletable ? (
    <RoleDeleteDialog
      role={role}
      actions={actions.remove}
      // 플랫폼 안내와 같은 말투 · 두 줄(2026-10-26 사용자 지정)
      noCandidateText={`대체 권한 그룹이 없어 삭제할 수 없습니다.\n${role.roleTypeCode === "FA" ? "가맹관리자" : "BP관리자"} 권한 그룹을 추가한 후 다시 시도해 주세요.`}
      onDeleted={onDeleted}
    />
  ) : null;

  if (!editable)
    return (
      <>
        {heading}
        {/* 조회 권한만 있으면 이유 띠 없이 상세로만 보인다 */}
        {/* 본인 연결(SELF_LINKED)은 api 이유 문구(「본인이 연결된 권한」) 대신 문장으로 풀어 쓴다(2026-10-26 사용자 지정) */}
        {can.update && role.editBlockedReason && (
          <InfoBand>{role.editBlockedReason === "SELF_LINKED" ? "본인 계정에 연결된 권한 그룹이라 수정할 수 없습니다." : reasonLabel(lockReasons, role.editBlockedReason, "고칠 수 없는 권한 그룹입니다")}</InfoBand>
        )}
        {rows.length > 0 && <DetailTable rows={rows} />}
        {record}
        {deleteButton && <div className="mt-[6px] flex justify-center gap-[6px]">{deleteButton}</div>}
      </>
    );
  return (
    <>
      {heading}
      <RoleForm mode="edit" actions={actions.form} role={role} extra={record} deleteButton={deleteButton} />
    </>
  );
}
