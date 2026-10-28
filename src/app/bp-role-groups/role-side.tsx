"use client";

import { DetailTable, HelpTip, Tag, type DetailRow } from "@/components/common";
import { RoleDeleteDialog } from "@/components/role-groups/role-delete-dialog";
import { RoleForm } from "@/components/role-groups/role-form";
import { actorOf, CARD, FailedBand, reasonLabel, WarnBand } from "@/components/role-groups/role-parts";
import { CodeLabel } from "@/components/site/code-label";
import { HeadValues } from "@/components/site/head-values";
import { usePagePermission } from "@/components/site/session-gate";
import type { BpRoleGroupDetail, BpRoleType } from "@/lib/bp-role-groups";
import type { EnumValue } from "@/lib/enums";
import { formatDateTime, wasUpdated } from "@/lib/format";
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
  // 가맹마스터 계정 · 등록 · 최종수정도 상세 표의 줄로(2026-10-28 사용자 지정 — 전엔 표 밖 테두리 없는 카드). 값은 「일시 · 사람」, 사람은 회색
  const when = (at: string, actor: Parameters<typeof actorOf>[0]) => (
    <span className="truncate" title={`${formatDateTime(at)} · ${actorOf(actor)}`}>
      {formatDateTime(at)} <span className="text-erp-label">· {actorOf(actor)}</span>
    </span>
  );
  const recordRows: DetailRow[] = [
    {
      // 가맹마스터 계정(api manager) — 가맹 관리자 그룹을 만든 가맹 마스터. BP 관리자 그룹은 값이 없다(S-LYKAEI). 줄은 늘 둔다.
      // 도움말 i 는 값 칸에 — 라벨 옆에 두면 라벨이 잘렸다. 가맹 관리자 그룹에만 값이 있고, 없으면 「-」 없이 i 만 둔다(2026-10-28 사용자 지정).
      // 값 칸이 넘치면 잘려 도움말 상자는 최상위 레이어에 띄운다(floating)
      label: "가맹마스터 계정",
      value: (
        // i 를 앞에, 가맹마스터 정보는 그 뒤에(2026-10-28 사용자 지정)
        <span className="flex min-w-0 items-center gap-[6px]">
          <HelpTip text="가맹관리자 권한을 생성한 가맹마스터의 정보가 표시됩니다." floating />
          {role.manager && (
            <span className="truncate" title={[role.manager.loginId, role.manager.name].filter(Boolean).join(" · ")}>
              {role.manager.loginId}
              {role.manager.name && <span className="text-erp-label"> · {role.manager.name}</span>}
            </span>
          )}
        </span>
      ),
    },
    { label: "등록", value: when(role.createdAt, role.createdBy) },
    // 등록만 하고 고친 적 없으면 「-」(2026-10-27 사용자 요청)
    { label: "최종수정", value: wasUpdated(role.createdAt, role.updatedAt) ? when(role.updatedAt, role.updatedBy) : muted("-") },
  ];
  // 위 입력칸과 18px(칸 간격 12 + 6) — 입력칸 사이와 같다(2026-10-26 권한 그룹 다듬기와 같은 간격)
  const record = (
    <div className="mt-[6px]">
      <DetailTable rows={recordRows} />
    </div>
  );
  const heading = (
    <h2 className="flex min-h-[34px] flex-wrap content-end items-center gap-[6px] text-[18px] font-semibold text-erp-ink">
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
        {/* 본인 연결(SELF_LINKED)은 api 이유 문구(「본인이 연결된 권한」) 대신 문장으로 풀어 쓴다(2026-10-26 사용자 지정).
            가맹 마스터가 아닌 사람이 보는 가맹 관리자 그룹(NO_PERMISSION · FA)도 문장으로(2026-10-27 사용자 지정) */}
        {/* 막힌 이유는 빨간 안내 상자(WarnBand — 2026-10-27 사용자 지정, 전엔 회색 띠) */}
        {can.update && role.editBlockedReason && (
          <WarnBand>
            {role.editBlockedReason === "SELF_LINKED"
              ? "본인 계정에 연결된 권한그룹은 수정할 수 없습니다."
              : role.editBlockedReason === "NO_PERMISSION" && role.roleTypeCode === "FA"
                ? "본인 계정은 가맹관리자 권한 그룹을 수정할 수 없습니다."
                : // 남은 이유도 문장으로(2026-10-28 사용자 지정 — 전엔 api 이유 이름 「권한 관리 메뉴 권한 없음」 · 「고정 권한」)
                  role.editBlockedReason === "NO_PERMISSION"
                  ? "선택한 권한그룹에 대한 수정 권한이 없습니다."
                  : role.editBlockedReason === "FIXED_ROLE"
                    ? "시스템이 제공하는 기본권한 그룹은 수정할 수 없습니다."
                    : reasonLabel(lockReasons, role.editBlockedReason, "고칠 수 없는 권한 그룹입니다")}
          </WarnBand>
        )}
        {/* 수정할 수 없으면 권한명 · 설명과 같은 표 하나에 */}
        <DetailTable rows={[...rows, ...recordRows]} />
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
