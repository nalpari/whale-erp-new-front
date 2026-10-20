"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, DataTable, type Column } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import type { RoleGroup } from "@/lib/platform-role-groups";
import { RoleMenuDialog } from "./role-menu-dialog";
import { CARD, PATH, WhenWho, type RoleDetailState } from "./role-parts";
import { RoleSide } from "./role-side";

// 왼쪽 권한 목록 + 오른쪽 고정 칸(데모 system/roles · role-side). 오른쪽 칸은 슬라이드 패널이 아니라 늘 서 있다.
// 권한명을 누르면 오른쪽에 그 권한의 수정(고칠 수 없으면 상세)이, [등록]을 누르면 같은 칸에 등록 양식이 선다.
// 버튼은 지금 주소(/platform-role-groups)의 메뉴 권한(usePagePermission)으로 보인다 — 등록 create, 권한명 · 설명 · 메뉴 저장 update, 삭제 delete. 막는 것은 api 다.
export function RolesScreen({
  roles,
  selected,
  detail,
  lockReasons,
  menuReasons,
}: {
  roles: RoleGroup[];
  selected?: number;
  detail: RoleDetailState;
  lockReasons: EnumValue[];
  menuReasons: EnumValue[];
}) {
  const router = useRouter();
  const can = usePagePermission();
  const [creating, setCreating] = useState(false);
  const [menuFor, setMenuFor] = useState<RoleGroup | null>(null);

  const handleSelect = (id?: number) => {
    setCreating(false);
    router.push(id ? `${PATH}?role=${id}` : PATH, { scroll: false });
  };

  const columns: Column<RoleGroup>[] = [
    { header: "권한코드", width: "w-[96px]", cell: (r) => r.roleCode },
    { header: "권한유형", width: "w-[110px]", cell: (r) => <CodeLabel group="ROLE_TYPE" value={r.roleTypeCode} /> },
    {
      header: "권한명",
      align: "left",
      cell: (r) => (
        <button
          type="button"
          aria-current={!creating && r.roleGroupId === selected ? "true" : undefined}
          onClick={() => handleSelect(r.roleGroupId)}
          className="max-w-full truncate text-erp-link hover:underline"
        >
          {r.name}
        </button>
      ),
    },
    { header: "설명", align: "left", cell: (r) => r.description ?? <span className="text-erp-muted">—</span> },
    // 등록일시 · 최종수정일시 순서로, 한 칸에 「일시 | 사람」(상세의 기본 정보와 같은 모양 · 2026-10-15)
    { header: "등록일시", width: "w-[200px]", cell: (r) => <WhenWho at={r.createdAt} actor={r.createdBy} /> },
    { header: "최종수정일시", width: "w-[200px]", cell: (r) => <WhenWho at={r.updatedAt} actor={r.updatedBy} /> },
    // 등록 / 미등록만 보인다. 미등록은 상태 빨강 배지
    { header: "메뉴 등록 여부", width: "w-[130px]", cell: (r) => (r.isMenuRegistered ? <Badge tone="on">등록</Badge> : <Badge tone="off">미등록</Badge>) },
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
    <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
      <section className={`${CARD} min-w-0 flex-1`}>
        <div className="flex items-end gap-[6px]">
          <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
            권한 목록 <span className="ml-[6px] text-[14px] font-normal text-erp-label">{roles.length.toLocaleString("ko-KR")}건</span>
          </h2>
          {can.create && (
            <Button onClick={() => setCreating(true)} disabled={creating}>
              등록
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          rows={roles}
          rowKey={(r) => r.roleGroupId}
          rowState={(r) => (!creating && r.roleGroupId === selected ? "selected" : undefined)}
        />
      </section>

      <RoleSide
        // 다른 권한을 고르면 칸을 새로 그린다. 같은 권한의 최신 정보(updatedAt)로는 다시 그리지 않는다 — 다시 그리면 409 실패 문구 · 고치던 입력 ·
        // 열린 삭제 확인창이 함께 사라진다. 최신 값으로 칸을 다시 채우는 것은 폼이 409 뒤에만 한다(role-side.tsx).
        key={creating ? "new" : detail && "role" in detail ? String(detail.role.roleGroupId) : (selected ?? "empty")}
        creating={creating}
        detail={detail}
        lockReasons={lockReasons}
        onCancelCreate={() => setCreating(false)}
        onCreated={(id) => handleSelect(id)}
        onDeleted={() => handleSelect()}
      />

      <RoleMenuDialog role={menuFor} reasons={menuReasons} onClose={() => setMenuFor(null)} />
    </div>
  );
}
