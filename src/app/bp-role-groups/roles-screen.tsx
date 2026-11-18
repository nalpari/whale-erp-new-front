"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, DataTable, PageBar, Pagination, Tag, type Column } from "@/components/common";
import { formatDateTime, wasUpdated } from "@/lib/format";
import { RoleMenuDialog, type MenuDialogRole } from "@/components/role-groups/role-menu-dialog";
import { CARD } from "@/components/role-groups/role-parts";
import { CodeLabel, useCodeLabel } from "@/components/site/code-label";
import { useAccount, useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import type { BpRoleGroup, BpRoleGroupList } from "@/lib/bp-role-groups";
import type { EnumValue } from "@/lib/enums";
import { PATH, useBpActions, type BpRoleDetailState } from "./bp-actions";
import { BpRoleSide } from "./role-side";

// 왼쪽 권한 그룹 목록(쪽 나눔) + 오른쪽 고정 칸(S-LYKAEI · 데모 config/roles). 권한명을 누르면 오른쪽에 그 그룹의 수정(고칠 수 없으면 상세)이,
// [등록]을 누르면 같은 칸에 등록 양식이 선다. 버튼은 메뉴 권한(usePagePermission)과 api 가 준 creatableRoleTypeCode 로 보인다. 막는 것은 api 다.
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
  return <RolesBody {...props} />;
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
      // 1260 창 기준 — 플랫폼 권한 관리와 같은 폭(권한유형 · 코드 170 · 권한명 140 · 최종수정 136 · 메뉴설정 96), 설명이 남는 폭이다. 오른쪽 상세 칸(464)이
      // 고정이라 260 · 260 · 150 · 124 · 120 이면 표가 231px 넘쳐 [설정] · 설정여부가 잘리고 「설명」 열 이름이 세로로 꺾였다(2026-11-18 사용자 지정 · 1260 작업)
      width: "w-[170px]",
      // 가운데 정렬 — 열 이름과 맞춘다(2026-10-27 사용자 지정, 전엔 왼쪽)
      cell: (r) => (
        <span className="truncate">
          <CodeLabel group="ROLE_TYPE" value={r.roleTypeCode} /> <span className="text-[12px] text-erp-label">· {r.roleCode}</span>
        </span>
      ),
    },
    {
      header: "권한명",
      // 폭을 정하지 않으면 설명과 남는 폭을 반씩 나눠 설명 글자가 칸 한가운데서 시작했다 — 권한명을 고정하고 설명이 나머지를 쓴다(2026-10-26 사용자 지정)
      width: "w-[140px]", // 긴 권한명은 말줄임 — 상세 칸에서 본다(플랫폼 권한 관리와 같다, 2026-11-18 · 전엔 260)
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
    // 설명도 기준 폭(160)을 둔다 — 넓은 창에서는 모든 열이 같은 비율로 늘어난다 — 이 열만 남는 폭을 가지면 넓은 창에서 혼자 넓어져 표가 휑했다(2026-11-18 사용자 지정)
    { header: "설명", width: "w-[160px]", align: "left", cell: (r) => r.description || <span className="text-erp-muted">-</span> },
    { header: "최종수정", width: "w-[136px]", cell: (r) =>
        // 일시만 — 고친 사람은 상세에서 본다. 플랫폼 권한 관리와 맞췄다(2026-11-16 사용자 지정, 전엔 「일시 · 사람」 260)
        // 등록만 하고 고친 적 없으면 「-」(2026-10-27 사용자 요청)
        wasUpdated(r.createdAt, r.updatedAt) ? formatDateTime(r.updatedAt) : <span className="text-erp-muted">-</span>,
    },
    // [설정] 버튼 열(「메뉴설정」)을 「메뉴설정 여부」 앞에 둔다(2026-10-26 사용자 지정 — 전엔 「메뉴 등록 여부」 · 「메뉴등록」[메뉴등록] 순)
    {
      header: "메뉴설정",
      width: "w-[96px]", // [설정] 버튼(약 76px)이 칸 안에 다 들어가는 폭(플랫폼 권한 관리와 같다)
      cell: (r) => (
        <Button variant="soft" onClick={() => setMenuFor(r)}>
          설정
        </Button>
      ),
    },
    {
      header: "설정여부", // 「메뉴설정 여부」에서 줄임 — 플랫폼 권한 관리와 같은 이름(2026-11-16 사용자 지정)
      width: "w-[100px]", // 「등록 12개」 배지가 드는 폭
      cell: (r) => (r.menuCount > 0 ? <Badge tone="on">등록 {r.menuCount.toLocaleString("ko-KR")}개</Badge> : <Badge tone="off">미등록</Badge>),
    },
  ];

  return (
    <>
      {/* [등록]은 제목 줄 오른쪽 — 3팀 목록과 같은 자리(2026-10-23). [가맹마스터 메뉴설정 보기]는 목록 카드 머리에 그대로 둔다 */}
      <PageBar title="권한그룹 관리">
        {can.create && list.creatableRoleTypeCode !== null && (
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
              권한 그룹 목록 <span className="ml-[6px] text-[14px] font-normal text-erp-label">{list.total.toLocaleString("ko-KR")}건</span>
            </h2>
            {/* 가맹 관리자에게는 숨긴다(S-LYKAEI) — api 도 403 이다 */}
            {account.roleTypeCode !== "FA" && (
              // 보기만 하는 버튼이라 흰 바탕 · 브랜드 테두리(outline) — 점포 상세 [변경이력]과 같다(2026-11-03 사용자 지정)
              <Button variant="outline" onClick={() => setFranchiseMasterOpen(true)}>
                가맹마스터 메뉴설정 보기
              </Button>
            )}
          </div>
          <DataTable
            columns={columns}
            rows={list.items}
            rowKey={(r) => r.roleGroupId}
            rowState={(r) => (!creating && r.roleGroupId === selected ? "selected" : undefined)}
            // 비었으면 열 이름 줄 아래 빈 칸이 남는 높이를 채운다 — 점포 · 직원 목록과 같다(2026-11-05 사용자 지정).
            // 검색 조건이 없어 0건이면 「등록된 …」, 마지막 쪽을 넘긴 주소로 왔을 때만 「이 페이지에 …」(2026-11-05 사용자 지정)
            fillEmpty
            empty={list.total === 0 ? "등록된 권한 그룹이 없습니다." : "이 페이지에 권한 그룹이 없습니다."}
            // 오른쪽 상세 칸(464)이 고정이라 좁은 창(최소 1260)에서는 열이 넘칠 수 있다 — 설명 160px 을 지키고 표 상자 안에서만 민다
            // (플랫폼 권한 관리와 같다, 2026-11-18). 고정 열 합 642 + 설명 160
            scroll
            minWidth="min-w-[802px]"
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => go({ page: p })} />
        </section>

        <BpRoleSide
          // 다른 그룹을 고르면 칸을 새로 그린다. 같은 그룹의 최신 정보(updatedAt)로는 다시 그리지 않는다(플랫폼 권한 관리와 같다 — role-form.tsx).
          key={creating ? "new" : detail && "role" in detail ? String(detail.role.roleGroupId) : (selected ?? "empty")}
          creating={creating}
          createTypeCode={list.creatableRoleTypeCode}
          detail={detail}
          listEmpty={list.total === 0}
          lockReasons={lockReasons}
          onCancelCreate={() => setCreating(false)}
          onCreated={(id) => {
            setCreatedId(id);
            handleSelect(id);
          }}
          // 그 쪽의 마지막 한 건을 지웠으면 앞쪽으로 — 빈 쪽에 「데이터가 없습니다」만 남지 않게
          onDeleted={() => {
            setCreating(false);
            go({ page: list.items.length === 1 && page > 1 ? page - 1 : page });
          }}
        />

        {/* 잠긴 팝업의 안내 띠는 두지 않는다 — 칸이 막히고 [닫기]만 보이는 것으로 알린다 */}
        <RoleMenuDialog role={menuFor} reasons={menuReasons} actions={actions.menus} note={null} onClose={() => setMenuFor(null)} />
        <RoleMenuDialog
          // 제목은 [메뉴설정] 팝업과 같게 두고 띠지로 가른다(2026-10-26 사용자 지정, 전엔 「가맹 마스터 권한 보기」)
          titleTag="가맹 마스터 권한용"
          role={franchiseMasterOpen ? { ...BLANK_ROLE, name: roleTypeLabel("FM") } : null}
          reasons={menuReasons}
          actions={actions.franchiseMaster}
          note={null}
          onClose={() => setFranchiseMasterOpen(false)}
        />
      </div>
    </>
  );
}
