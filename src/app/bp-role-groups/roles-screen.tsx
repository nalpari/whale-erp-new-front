"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, DataTable, Pagination, Tag, type Column } from "@/components/common";
import { RoleMenuDialog, type MenuDialogRole } from "@/components/role-groups/role-menu-dialog";
import { CARD, WhenWho } from "@/components/role-groups/role-parts";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import type { BpRoleGroup, BpRoleGroupList } from "@/lib/bp-role-groups";
import type { EnumValue } from "@/lib/enums";
import { PATH, useBpActions, type BpRoleDetailState } from "./bp-actions";
import { BpRoleSide } from "./role-side";

// 왼쪽 권한 그룹 목록(쪽 나눔) + 오른쪽 고정 칸(S-LYKAEI · 데모 config/roles). 권한명을 누르면 오른쪽에 그 그룹의 수정(고칠 수 없으면 상세)이,
// [신규 등록]을 누르면 같은 칸에 등록 양식이 선다. 버튼은 메뉴 권한(usePagePermission)과 api 가 준 creatableRoleTypeCode 로 보인다. 막는 것은 api 다.
const BLANK_ROLE: MenuDialogRole = { roleGroupId: 0, roleCode: "FM000001", roleTypeCode: "FM", name: "" };

export function BpRolesScreen(props: {
  page: number;
  totalPages: number;
  list: BpRoleGroupList;
  selected?: number;
  detail: BpRoleDetailState;
  lockReasons: EnumValue[];
  menuReasons: EnumValue[];
}) {
  return (
    <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
      <RolesBody {...props} />
    </div>
  );
}

function RolesBody({
  page,
  totalPages,
  list,
  selected,
  detail,
  lockReasons,
  menuReasons,
}: {
  page: number;
  totalPages: number;
  list: BpRoleGroupList;
  selected?: number;
  detail: BpRoleDetailState;
  lockReasons: EnumValue[];
  menuReasons: EnumValue[];
}) {
  const router = useRouter();
  const can = usePagePermission();
  const account = useAccount();
  const roleTypeLabel = useCodeLabel("ROLE_TYPE");
  const actions = useBpActions();
  const [creating, setCreating] = useState(false);
  // 이 화면에서 방금 등록한 그룹 — 「새로 등록」 배지
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [menuFor, setMenuFor] = useState<MenuDialogRole | null>(null);
  const [franchiseMasterOpen, setFranchiseMasterOpen] = useState(false);

  const bp = useCurrentBp().bpCodeId;
  const go = (to: { role?: number; page?: number }) => {
    const q = new URLSearchParams();
    if (to.page && to.page > 1) q.set("page", String(to.page));
    if (to.role) q.set("role", String(to.role));
    // 화면 주소는 탭 BP 를 붙인다 — proxy 가 이 폴더로 rewrite 하며 헤더에 싣는다
    router.push(`${bpPath(bp, PATH)}${q.size ? `?${q}` : ""}`, { scroll: false });
  };
  const handleSelect = (id?: number) => {
    setCreating(false);
    go({ role: id, page });
  };

  const columns: Column<BpRoleGroup>[] = [
    {
      header: "권한유형 · 코드",
      width: "w-[170px]",
      cell: (r) => (
        <span className="truncate">
          <CodeLabel group="ROLE_TYPE" value={r.roleTypeCode} /> <span className="text-erp-label">{r.roleCode}</span>
        </span>
      ),
    },
    {
      header: "권한명",
      align: "left",
      cell: (r) => (
        <span className="flex min-w-0 items-center gap-[6px]">
          <button
            type="button"
            aria-current={!creating && r.roleGroupId === selected ? "true" : undefined}
            onClick={() => handleSelect(r.roleGroupId)}
            className="min-w-0 truncate text-erp-link hover:underline"
          >
            {r.name}
          </button>
          {r.isSelfLinked && <Tag>본인</Tag>}
          {r.roleGroupId === createdId && <Tag>새로 등록</Tag>}
        </span>
      ),
    },
    { header: "설명", align: "left", cell: (r) => r.description ?? <span className="text-erp-muted">—</span> },
    { header: "최종수정일시", width: "w-[200px]", cell: (r) => <WhenWho at={r.updatedAt} actor={r.updatedBy} /> },
    {
      header: "메뉴 등록 여부",
      width: "w-[130px]",
      cell: (r) => (r.menuCount > 0 ? <Badge tone="on">등록 {r.menuCount.toLocaleString("ko-KR")}개</Badge> : <Badge tone="off">미등록</Badge>),
    },
    {
      header: "메뉴등록",
      width: "w-[124px]",
      cell: (r) => (
        <Button variant="soft" onClick={() => setMenuFor(r)}>
          메뉴등록
        </Button>
      ),
    },
  ];

  return (
    <>
      <section className={`${CARD} min-w-0 flex-1`}>
        <div className="flex items-end gap-[6px]">
          <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
            권한 그룹 목록 <span className="ml-[6px] text-[14px] font-normal text-erp-label">{list.total.toLocaleString("ko-KR")}건</span>
          </h2>
          {/* 가맹 관리자에게는 숨긴다(S-LYKAEI) — api 도 403 이다 */}
          {account.roleTypeCode !== "FA" && (
            <Button variant="soft" onClick={() => setFranchiseMasterOpen(true)}>
              가맹마스터 보기
            </Button>
          )}
          {can.create && list.creatableRoleTypeCode !== null && (
            <Button onClick={() => setCreating(true)} disabled={creating}>
              신규 등록
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          rows={list.items}
          rowKey={(r) => r.roleGroupId}
          rowState={(r) => (!creating && r.roleGroupId === selected ? "selected" : undefined)}
        />
        <Pagination page={page} totalPages={totalPages} onPageChange={(p) => go({ page: p })} />
      </section>

      <BpRoleSide
        // 다른 그룹을 고르면 칸을 새로 그린다. 같은 그룹의 최신 정보(updatedAt)로는 다시 그리지 않는다(플랫폼 권한 관리와 같다 — role-form.tsx).
        key={creating ? "new" : detail && "role" in detail ? String(detail.role.roleGroupId) : (selected ?? "empty")}
        creating={creating}
        createTypeCode={list.creatableRoleTypeCode}
        detail={detail}
        lockReasons={lockReasons}
        onCancelCreate={() => setCreating(false)}
        onCreated={(id) => {
          setCreatedId(id);
          handleSelect(id);
        }}
        onDeleted={() => handleSelect()}
      />

      {/* 잠긴 팝업의 안내 띠는 두지 않는다 — 칸이 막히고 [닫기]만 보이는 것으로 알린다 */}
      <RoleMenuDialog role={menuFor} reasons={menuReasons} actions={actions.menus} note={null} onClose={() => setMenuFor(null)} />
      <RoleMenuDialog
        title="가맹 마스터 권한 보기"
        role={franchiseMasterOpen ? { ...BLANK_ROLE, name: roleTypeLabel("FM") } : null}
        reasons={menuReasons}
        actions={actions.franchiseMaster}
        note={null}
        onClose={() => setFranchiseMasterOpen(false)}
      />
    </>
  );
}
