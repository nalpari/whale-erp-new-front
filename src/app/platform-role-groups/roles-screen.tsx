"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, DataTable, PageBar, type Column } from "@/components/common";
import { CodeLabel } from "@/components/site/code-label";
import { usePagePermission } from "@/components/site/session-gate";
import type { EnumValue } from "@/lib/enums";
import type { RoleGroup } from "@/lib/platform-role-groups";
import { RoleMenuDialog, type MenuDialogActions } from "@/components/role-groups/role-menu-dialog";
import { getRoleGroupMenusAction, previewRoleGroupMenusAction, saveRoleGroupMenusAction } from "./actions";
import { CARD, PATH, WhenWho, type RoleDetailState } from "./role-parts";
import { RoleSide } from "./role-side";

// 왼쪽 권한 목록 + 오른쪽 고정 칸(데모 system/roles · role-side). 오른쪽 칸은 슬라이드 패널이 아니라 늘 서 있다.
// 권한명을 누르면 오른쪽에 그 권한의 수정(고칠 수 없으면 상세)이, [등록]을 누르면 같은 칸에 등록 양식이 선다.
// [메뉴설정] 팝업(권한별 메뉴설정)은 BP 권한 그룹 관리와 같이 쓴다(components/role-groups) — 이 화면의 action 을 넘긴다.
const MENU_ACTIONS: MenuDialogActions = { load: getRoleGroupMenusAction, preview: previewRoleGroupMenusAction, save: saveRoleGroupMenusAction };

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
    // 권한유형 · 코드를 한 칸에 — BP 권한 그룹 관리(bp-role-groups/roles-screen.tsx)와 같은 모양(2026-10-26 사용자 지정)
    {
      header: "권한유형 · 코드",
      width: "w-[170px]",
      align: "left", // 2026-10-26 사용자 지정
      cell: (r) => (
        <span className="truncate">
          <CodeLabel group="ROLE_TYPE" value={r.roleTypeCode} /> <span className="text-erp-label">· {r.roleCode}</span>
        </span>
      ),
    },
    {
      header: "권한명",
      // 폭을 정하지 않으면 설명과 남는 폭을 반씩 나눠 설명 글자가 칸 한가운데서 시작했다. 등록일시 열을 빼 BP 와 같은 260px 로 넓혔다(2026-10-26 사용자 지정)
      width: "w-[260px]",
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
    { header: "설명", align: "left", cell: (r) => r.description || <span className="text-erp-muted">-</span> },
    // 한 칸에 「일시 · 사람」. 등록일시 열은 뺐다 — BP 권한 그룹 관리와 같이 최종수정만 보인다(2026-10-26 사용자 지정). 등록은 상세에 있다
    { header: "최종수정", width: "w-[220px]", cell: (r) => <WhenWho at={r.updatedAt} actor={r.updatedBy} /> },
    // [메뉴설정] 버튼 열(「메뉴관리」)을 「메뉴설정 여부」 앞에 둔다(2026-10-26 사용자 지정 — 전엔 「메뉴 등록 여부」 · 「메뉴등록」[메뉴등록] 순)
    {
      header: "메뉴관리",
      width: "w-[124px]",
      cell: (r) => (
        <Button variant="soft" onClick={() => setMenuFor(r)}>
          메뉴설정
        </Button>
      ),
    },
    // 등록 / 미등록만 보인다. 미등록은 상태 빨강 배지
    { header: "메뉴설정 여부", width: "w-[120px]", cell: (r) => (r.isMenuRegistered ? <Badge tone="on">등록</Badge> : <Badge tone="off">미등록</Badge>) },
  ];

  return (
    <>
      {/* [등록]은 제목 줄 오른쪽 — 3팀 목록과 같은 자리(2026-10-23) */}
      <PageBar title="플랫폼 권한 관리">
        {can.create && (
          <Button onClick={() => setCreating(true)} disabled={creating}>
            등록
          </Button>
        )}
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <section className={`${CARD} min-w-0 flex-1`}>
          {/* 제목 줄을 34px(버튼 높이)로 고정해 오른쪽 상세 칸 제목과 높이를 맞춘다 — 그래야 오른쪽 첫 칸이 왼쪽 표 시작선에 선다(2026-10-26 사용자 지정) */}
          <div className="flex min-h-[34px] items-end gap-[6px]">
            <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">
              {/* BP 권한 그룹 관리와 같은 제목(2026-10-26 사용자 지정, 전엔 「권한 목록」) */}
              권한 그룹 목록 <span className="ml-[6px] text-[14px] font-normal text-erp-label">{roles.length.toLocaleString("ko-KR")}건</span>
            </h2>
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
          listEmpty={roles.length === 0}
          lockReasons={lockReasons}
          onCancelCreate={() => setCreating(false)}
          onCreated={(id) => handleSelect(id)}
          onDeleted={() => handleSelect()}
        />

        <RoleMenuDialog role={menuFor} reasons={menuReasons} actions={MENU_ACTIONS} onClose={() => setMenuFor(null)} />
      </div>
    </>
  );
}
