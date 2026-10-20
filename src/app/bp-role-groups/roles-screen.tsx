"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Button, DataTable, Pagination, Tag, type Column } from "@/components/common";
import { RoleMenuDialog, type MenuDialogRole } from "@/components/role-groups/role-menu-dialog";
import { CARD, WhenWho } from "@/components/role-groups/role-parts";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import type { BpRoleGroup, BpRoleGroupList } from "@/lib/bp-role-groups";
import type { EnumValue } from "@/lib/enums";
import { PATH, useBpActions, type BpRoleDetailState } from "./bp-actions";
import { BpRoleSide } from "./role-side";

// 왼쪽 권한 그룹 목록(쪽 나눔) + 오른쪽 고정 칸(S-LYKAEI · 데모 config/roles). 권한명을 누르면 오른쪽에 그 그룹의 수정(고칠 수 없으면 상세)이,
// [신규 등록]을 누르면 같은 칸에 등록 양식이 선다. 버튼은 메뉴 권한(usePagePermission)과 api 가 준 creatableRoleTypeCode 로 보인다. 막는 것은 api 다.
// 역할 안내 줄의 문구만 역할 값으로 고른다 — 무엇이 보이고 막히는지는 api 판정이다.
const ROLE_GUIDE: Record<string, string> = {
  BM: "BP 관리자 권한 그룹을 등록 · 수정 · 삭제하고, 가맹 관리자 권한 그룹은 조회만 합니다.",
  FM: "본인이 만든 가맹 관리자 권한 그룹만 등록 · 수정 · 삭제합니다.",
};
const READ_ONLY_GUIDE = "권한 그룹을 조회만 합니다.";
const BLANK_ROLE: MenuDialogRole = { roleGroupId: 0, roleCode: "FM000001", roleTypeCode: "FM", name: "" };

export function BpRolesScreen({
  bp,
  page,
  totalPages,
  list,
  selected,
  detail,
  lockReasons,
  menuReasons,
}: {
  bp?: number;
  page: number;
  totalPages: number;
  list: BpRoleGroupList | null;
  selected?: number;
  detail: BpRoleDetailState;
  lockReasons: EnumValue[];
  menuReasons: EnumValue[];
}) {
  const router = useRouter();
  const currentBp = useCurrentBp().bpCodeId;
  // 주소의 BP 가 이 탭의 BP 와 다르면(처음 진입 · 다른 BP 로 바꾼 탭) 탭의 BP 로 옮긴다. 고른 그룹 · 쪽은 다른 BP 의 것이라 버린다.
  const synced = bp === currentBp;
  useEffect(() => {
    if (!synced) router.replace(`${PATH}?bp=${currentBp}`, { scroll: false });
  }, [synced, currentBp, router]);

  return (
    <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
      {synced && list ? (
        <RolesBody bp={currentBp} page={page} totalPages={totalPages} list={list} selected={selected} detail={detail} lockReasons={lockReasons} menuReasons={menuReasons} />
      ) : (
        <p className={`${CARD} flex-1 items-center justify-center text-[14px] text-erp-muted`}>불러오는 중입니다.</p>
      )}
    </div>
  );
}

function RolesBody({
  bp,
  page,
  totalPages,
  list,
  selected,
  detail,
  lockReasons,
  menuReasons,
}: {
  bp: number;
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

  const go = (to: { role?: number; page?: number }) => {
    const q = new URLSearchParams({ bp: String(bp) });
    if (to.page && to.page > 1) q.set("page", String(to.page));
    if (to.role) q.set("role", String(to.role));
    router.push(`${PATH}?${q}`, { scroll: false });
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
        <p className="text-[14px] text-erp-label">
          <b className="font-medium text-erp-ink">{account.name ?? account.loginId}</b> ({account.loginId} · {roleTypeLabel(account.roleTypeCode)}) —{" "}
          {ROLE_GUIDE[account.roleTypeCode] ?? READ_ONLY_GUIDE}
        </p>
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
        <p className="text-[13px] text-erp-label">
          권한명을 누르면 오른쪽에 상세가 섭니다. 관리자 계정에 권한 그룹을 붙이거나 바꾸는 일은{" "}
          <Link href="/bp-admins" className="text-erp-link hover:underline">
            BP 관리자 관리
          </Link>
          에서 합니다.
        </p>
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

      <RoleMenuDialog role={menuFor} reasons={menuReasons} actions={actions.menus} onClose={() => setMenuFor(null)} />
      <RoleMenuDialog
        title="가맹 마스터 권한 보기"
        role={franchiseMasterOpen ? { ...BLANK_ROLE, name: roleTypeLabel("FM") } : null}
        reasons={menuReasons}
        actions={actions.franchiseMaster}
        note="가맹 마스터 고정 권한(FM000001)입니다. 가맹 관리자 권한 그룹은 이 범위를 넘지 못하며, 여기서는 볼 수만 있습니다."
        onClose={() => setFranchiseMasterOpen(false)}
      />
    </>
  );
}
