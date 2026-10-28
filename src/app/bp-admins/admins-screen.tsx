"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ListToolbar, PageBar, Pagination, Select, useBackdropActive, useToast } from "@/components/common";
import { useAccount, useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { isEditOpen } from "@/app/platform-admins/admins-href";
import { BP_ADMIN_PAGE_SIZES, type BpAdminPageSize } from "@/lib/bp-admin-paging";
import { canCreateBpAdmin, detailButtonsOf } from "@/lib/bp-admin-rules";
import type { BpAdminDetail, BpAdminList, BpAdminRoleGroup } from "@/lib/bp-admins";
import { bpPath } from "@/lib/bp-path";
import { AdminDetailPanel } from "./admin-detail-panel";
import { AdminFilter } from "./admin-filter";
import { AdminFormPanel } from "./admin-form-panel";
import { AdminTable } from "./admin-table";
import { bpAdminsHref, withBpAdminFilter, type BpAdminsQuery } from "./bp-admins-href";

/** 이 화면이 상세 위에 쌓은 수정 기록에 다는 history.state 꼬리표 — 값은 그 상세의 계정 id */
const EDIT_PUSHED_STATE = "bpAdminEditPushedFor";

// 목록 화면과 세 슬라이드 패널(등록 · 상세 · 수정)을 한데 쥔다. 수정은 상세 위에 겹쳐 연다(데모와 같다).
// 패널을 여닫는 길(주소 ?admin= · ?edit=1, 뒤로 가기, Esc 는 한 단계씩, 바탕 클릭은 모두)은 platform-admins/admins-screen.tsx 와 같다 —
// 그쪽 주석이 왜 그렇게 하는지 자세히 적었다. 다른 점은 주소에 탭 BP 를 씌우는 것(bpPath), 삭제가 없는 것,
// 고칠 수 있는지를 api 가 준 actions 로 보는 것이다.
export function AdminsScreen({
  list,
  roleGroups,
  query,
  detail,
}: {
  list: BpAdminList;
  /** null 이면 받지 못했다 — 필터 · 폼이 알린다 */
  roleGroups: BpAdminRoleGroup[] | null;
  query: BpAdminsQuery;
  detail: { admin: BpAdminDetail } | { failed: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const me = useAccount();
  const bp = useCurrentBp().bpCodeId;
  // 이 화면(지금 주소)의 메뉴 권한으로 버튼을 보이거나 숨긴다 — 막는 것은 api 다.
  const can = usePagePermission();
  const [newOpen, setNewOpen] = useState(false);
  const editPushed = useRef(false);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  // 상세를 닫아도 패널이 밀려 나가는 동안은 마지막 내용을 그대로 보인다.
  const [shown, setShown] = useState(detail);
  if (detail && detail !== shown) setShown(detail);

  // 수정 패널은 주소에 ?edit=1 이 있고, 그 계정을 고칠 수 있고(메뉴 수정 권한 + api actions), 그 계정의 상세가 지금 열려 있을 때만 선다.
  const canUpdateShown = !!shown && "admin" in shown && detailButtonsOf(shown.admin.actions, can).canUpdate;
  const editOpen = isEditOpen(query, canUpdateShown, shown);

  // 저장 결과는 누른 때의 화면으로 돌아오므로, 그 사이 뒤로 가기로 이미 닫혔으면 다시 이동하지 않게 최신 값을 둔다
  const editOpenRef = useRef(editOpen);
  useEffect(() => {
    editOpenRef.current = editOpen;
    if (!editOpen) {
      editPushed.current = false;
      return;
    }
    const state = window.history.state as Record<string, unknown> | null;
    if (editPushed.current) window.history.replaceState({ ...state, [EDIT_PUSHED_STATE]: query.admin }, "");
    else if (state?.[EDIT_PUSHED_STATE] === query.admin) editPushed.current = true;
  }, [editOpen, query.admin]);

  const hrefOf = (next: BpAdminsQuery) => bpPath(bp, bpAdminsHref(next));
  // 같은 쪽 · 조건으로 다른 화면 상태만 바꾸는 이동이라 스크롤을 맨 위로 올리지 않는다. replace 는 사용자가 하지 않은 이동(필터가 헤더 범위로
  // 채우기 · 찾지 못한 점포 빼기)이다 — 기록을 쌓으면 뒤로 가기가 같은 자리로 돌아와 다시 채워진다.
  const navigate = (next: BpAdminsQuery, replace = false) => (replace ? router.replace : router.push)(hrefOf(next), { scroll: false });
  const go = (patch: Partial<BpAdminsQuery>) => navigate({ ...query, ...patch });

  const openDetail = (id: number, from: HTMLElement) => {
    detailTrigger.current = from;
    go({ admin: id, edit: undefined });
  };
  const closeDetail = () => go({ admin: undefined, edit: undefined });

  const openEdit = (from: HTMLButtonElement) => {
    editTrigger.current = from;
    editPushed.current = true;
    go({ edit: true });
  };
  /** 수정 패널의 취소 · Esc · 저장. 이 화면이 쌓은 기록이면 뒤로 가 걷고, 바로 들어왔으면 주소만 바꾼다(platform-admins 와 같다). */
  const closeEdit = () => {
    if (!editOpenRef.current) return;
    editOpenRef.current = false;
    if (!editTrigger.current?.isConnected) editTrigger.current = document.querySelector<HTMLButtonElement>('[aria-controls="bp-admin-edit-panel"]');
    if (editPushed.current) {
      editPushed.current = false;
      router.back();
    } else router.replace(hrefOf({ ...query, edit: undefined }), { scroll: false });
  };
  /** 상세 패널의 Esc · 닫기 — 위에 수정 패널이나 확인창 · 이력창(<dialog>)이 떠 있으면 그쪽만 닫혀야 한다. */
  const dismissDetail = () => {
    if (editOpen || document.querySelector("dialog[open]")) return;
    closeDetail();
  };
  /** 바탕창 클릭 — 열린 패널(등록 · 상세 · 수정)을 모두 닫고 목록으로 간다. */
  const closeAll = () => {
    setNewOpen(false);
    editPushed.current = false;
    if (query.admin) closeDetail();
  };
  /** 등록 패널의 Esc · 닫기 — 주소로 상세가 그 위에 겹쳤으면 위의 상세만 닫는다. */
  const dismissNew = () => {
    if (query.admin) return;
    setNewOpen(false);
  };

  // 바탕창이 떠 있는 동안 목록 · 필터를 inert 로 뺀다 — 바탕창은 클릭만 가로채고 포커스는 가두지 않는다.
  const backdropActive = useBackdropActive();
  const canCreate = canCreateBpAdmin(me, can);

  return (
    <>
      {/* [등록]은 제목 줄 오른쪽 — 플랫폼 관리자 관리와 같은 자리(2026-10-27 사용자 지정 — 전엔 목록 건수 줄). 바탕창이 떠 있는 동안은 목록처럼 inert 로 뺀다 */}
      <div className="contents" inert={backdropActive}>
        <PageBar title="BP 관리자 관리">
          {canCreate && (
            <Button ref={newTrigger} aria-controls="bp-admin-new-panel" aria-expanded={newOpen} onClick={() => setNewOpen(true)}>
              등록
            </Button>
          )}
        </PageBar>
      </div>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        {/* display:contents 로 레이아웃(gap-[12px])에 끼어들지 않으면서 둘을 함께 inert 로 뺀다 */}
        <div className="contents" inert={backdropActive}>
          <AdminFilter query={query} roleGroups={roleGroups} navigate={navigate} />
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
            <ListToolbar total={list.total}>
              <div className="w-[80px] shrink-0">
                <Select
                  aria-label="페이지당 건수"
                  value={String(query.pageSize)}
                  onChange={(e) => navigate(withBpAdminFilter(query, { pageSize: Number(e.target.value) as BpAdminPageSize }))}
                >
                  {BP_ADMIN_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </Select>
              </div>
            </ListToolbar>
            <AdminTable rows={list.items} selected={query.admin} onOpen={openDetail} noStatus={query.accountStatus === "NONE"} />
            <div className="pt-[14px]">
              <Pagination
                page={query.page}
                totalPages={Math.max(1, Math.ceil(list.total / query.pageSize))}
                onPageChange={(page) => go({ page, admin: undefined, edit: undefined })}
              />
            </div>
          </main>
        </div>

        {canCreate && (
          <AdminFormPanel
            id="bp-admin-new-panel"
            mode="create"
            open={newOpen}
            onClose={dismissNew}
            onBackdropClose={closeAll}
            trigger={newTrigger}
            roleGroups={roleGroups}
            onSaved={(result) => {
              setNewOpen(false);
              // 초기 비밀번호 메일이 실패해도 계정은 만들어졌다 — 상세의 비밀번호 초기화로 다시 보낸다(SYSTEM-3 과 같다).
              toast("saved"); // 늘 「저장되었습니다.」 — 메일 실패는 열리는 상세 위 빨간 상자가 알린다(BP 마스터와 같다, 2026-10-28)
              detailTrigger.current = newTrigger.current;
              go({ admin: result.adminAccountId, edit: undefined });
            }}
          />
        )}

        <AdminDetailPanel open={Boolean(query.admin)} detail={shown} onClose={dismissDetail} onBackdropClose={closeAll} trigger={detailTrigger} onEdit={openEdit} />

        {can.update && shown && "admin" in shown && (
          <AdminFormPanel
            // 다른 계정이면 새로 그린다. 같은 계정을 다시 열거나 최신 정보를 받으면 패널이 스스로 칸을 다시 채운다.
            key={shown.admin.adminAccountId}
            id="bp-admin-edit-panel"
            mode="edit"
            admin={shown.admin}
            open={editOpen}
            onClose={closeEdit}
            onBackdropClose={closeAll}
            trigger={editTrigger}
            roleGroups={roleGroups}
            onSaved={() => {
              closeEdit();
              toast("updated");
            }}
            onStale={() => {
              toast("다른 관리자가 먼저 수정했습니다. 최신 정보를 불러왔으니 다시 고쳐 저장해 주세요."); // 플랫폼 관리자와 같은 문구(2026-10-27 사용자 지정)
              router.refresh();
            }}
          />
        )}
      </div>
    </>
  );
}
