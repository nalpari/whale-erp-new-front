"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, ListToolbar, PageBar, Pagination, useBackdropActive, useToast } from "@/components/common";
import { useAccount, usePagePermission } from "@/components/site/session-gate";
import { adminActionsOf } from "@/lib/platform-admin-actions";
import { ADMIN_PAGE_SIZE } from "@/lib/platform-admin-paging";
import type { PlatformAdminDetail, PlatformAdminList, PlatformRoleGroup } from "@/lib/platform-admins";
import { AdminDetailPanel } from "./admin-detail-panel";
import { AdminFilter } from "./admin-filter";
import { AdminFormPanel } from "./admin-form-panel";
import { AdminTable } from "./admin-table";
import { adminsHref, isEditOpen, type AdminsQuery } from "./admins-href";

/** 이 화면이 상세 위에 쌓은 수정 기록에 다는 history.state 꼬리표 — 값은 그 상세의 계정 id */
const EDIT_PUSHED_STATE = "platformAdminEditPushedFor";

// 목록 화면과 세 슬라이드 패널(등록 · 상세 · 수정)을 한데 쥔다. 수정은 상세 위에 겹쳐 연다(데모와 같다).
// 상세를 열고 닫는 것은 주소(?admin=)로 한다 — 서버가 그 계정을 불러 detail 로 넘긴다. 수정도 주소(?edit=1)로 열어
// 브라우저 뒤로 가기가 수정 → 상세 → 목록 순으로 하나씩 접힌다.
export function AdminsScreen({
  list,
  roleGroups,
  query,
  detail,
}: {
  list: PlatformAdminList;
  roleGroups: PlatformRoleGroup[];
  query: AdminsQuery;
  detail: { admin: PlatformAdminDetail } | { failed: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  // 이 화면(지금 주소 /platform-admins)의 메뉴 권한으로 버튼을 보이거나 숨긴다 — 막는 것은 api 다. 수정 · 초기화는 update, 삭제는 delete(상세 패널).
  const can = usePagePermission();
  // 등록 · 수정 패널은 열 때마다 칸을 새로 채운다(admin-form-panel.tsx) — 다시 마운트하지 않아야 밀려 나오는 전환이 산다
  const [newOpen, setNewOpen] = useState(false);
  /**
   * 지금 수정 기록(?edit=1)이 이 화면이 상세 위에 쌓은 것인가 — 그렇다면 닫을 때 뒤로 가 그 기록을 걷는다(아래 closeEdit).
   * [수정]을 누르면 참이 되고, 수정이 열릴 때 기록 자체(history.state)에도 꼬리표를 달아 둔다. ref 는 새로 고침에 사라지고
   * 뒤로 가기에 지워지므로, 새로 고침 · 앞으로 가기로 다시 열린 수정은 그 꼬리표로 되살린다(코드 리뷰로 찾음, 2026-10-22).
   */
  const editPushed = useRef(false);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  // 상세를 닫아도 패널이 밀려 나가는 동안은 마지막 내용을 그대로 보인다.
  const [shown, setShown] = useState(detail);
  if (detail && detail !== shown) setShown(detail);

  // 수정 패널은 주소에 ?edit=1 이 있고 그 계정의 상세가 지금 열려 있을 때만 선다(admins-href.ts isEditOpen).
  // 고칠 수 있는지는 상세의 [수정] 버튼과 같은 판정이다 — 메뉴 수정 권한이 있어도 플랫폼 관리자(PA)는 플랫폼 마스터(PM)
  // 계정을 고치지 못한다(F-RVDLOW). 메뉴 권한만 보면 버튼이 없는 계정의 수정 폼이 주소(?edit=1)로 열렸다(적대적 리뷰, 2026-10-22).
  const me = useAccount();
  const canUpdateShown =
    !!shown &&
    "admin" in shown &&
    adminActionsOf(me, { adminAccountId: shown.admin.adminAccountId, roleTypeCode: shown.admin.roleGroup.roleTypeCode }, can).canUpdate;
  const editOpen = isEditOpen(query, canUpdateShown, shown);

  // 지금 수정 · 상세가 열려 있는지를 최신 값으로 본다. 저장 · 삭제 결과는 누른 때의 화면(클로저)으로 돌아오므로, 그 사이
  // 브라우저 뒤로 가기로 이미 닫혔으면 다시 뒤로 가거나 목록 주소를 쌓지 않아야 한다 — 바로 들어온 상세에서는 그 뒤로 가기가
  // 이 화면을 벗어난다(코드 리뷰로 찾음, 2026-10-22).
  const editOpenRef = useRef(editOpen);
  const detailOpenRef = useRef(Boolean(query.admin));
  useEffect(() => {
    editOpenRef.current = editOpen;
    // 수정이 닫히면(뒤로 가기로 걷혔든, 바탕 클릭으로 목록 주소가 그 위에 쌓였든) 바로 뒤가 이 화면이 쌓은 수정 기록이 아니다
    if (!editOpen) {
      editPushed.current = false;
      return;
    }
    // 수정이 열린 지금 기록은 ?edit=1 이다(Next 가 같은 커밋의 insertion effect 에서 이미 쌓았다). 꼬리표는 여기서만 읽고 쓴다 —
    // 뒤로 · 앞으로 가기는 이 값을 남기지만 router.refresh · 서버 액션은 기록을 다시 써 지우므로, 닫을 때 읽으면 늦다.
    const state = window.history.state as Record<string, unknown> | null;
    if (editPushed.current) window.history.replaceState({ ...state, [EDIT_PUSHED_STATE]: query.admin }, "");
    else if (state?.[EDIT_PUSHED_STATE] === query.admin) editPushed.current = true;
  }, [editOpen, query.admin]);
  useEffect(() => {
    detailOpenRef.current = Boolean(query.admin);
  }, [query.admin]);

  // 같은 쪽 · 조건으로 다른 화면 상태만 바꾸는 이동이라 스크롤을 맨 위로 올리지 않는다.
  const go = (next: Partial<AdminsQuery>) => router.push(adminsHref({ ...query, ...next }), { scroll: false });

  const openDetail = (id: number, from: HTMLElement) => {
    detailTrigger.current = from;
    go({ admin: id });
  };
  const closeDetail = () => go({ admin: undefined, edit: undefined });

  const openEdit = (from: HTMLButtonElement) => {
    editTrigger.current = from;
    editPushed.current = true;
    go({ edit: true });
  };
  /**
   * 수정 패널의 취소 · Esc · 저장(바탕 클릭은 closeAll 이 맡는다). 이 화면이 쌓은 기록이면 뒤로 가 걷는다 — push 로 상세 주소를 다시 쌓으면
   * 그 뒤 뒤로 가기가 닫은 수정을 다시 연다. 새로 고침 · 링크로 ?edit=1 에 바로 들어왔으면 뒤가 이 화면이 아닐 수 있어
   * 주소만 바꾼다(replace). 저장 뒤 상세는 서버 액션의 revalidatePath 로 새 값을 받는다.
   */
  const closeEdit = () => {
    // 이미 닫혔거나(저장 중 뒤로 가기) 닫는 중이면(Esc 를 빠르게 두 번) 다시 이동하지 않는다
    if (!editOpenRef.current) return;
    editOpenRef.current = false;
    // 새로 고침 · 링크로 바로 들어왔거나, 다른 계정을 거쳐 돌아와 누른 버튼이 이미 화면에서 사라졌으면 지금 상세의 [수정]으로 돌린다
    if (!editTrigger.current?.isConnected)
      editTrigger.current = document.querySelector<HTMLButtonElement>('[aria-controls="platform-admin-edit-panel"]');
    if (editPushed.current) {
      editPushed.current = false;
      router.back();
    } else router.replace(adminsHref({ ...query, edit: undefined }), { scroll: false });
  };
  /**
   * 상세 패널의 Esc · 닫기. 위에 수정 패널이나 확인창 · 이력창(<dialog>)이 떠 있으면 그쪽만 닫혀야 한다(DESIGN.md
   * 「Esc 는 가장 안쪽부터」). 같은 Esc 가 문서까지 올라와 상세도 닫으려 하므로 여기서 거른다 — <dialog> 의 cancel 은
   * keydown 이 다 지나간 뒤에 오므로 이때는 아직 열려 있다.
   * editOpen 은 상세 패널의 Esc 처리가 수정 패널의 것보다 먼저 돈다는 데 기댄다 — 둘 다 document 에 달리고, 수정은
   * 상세를 연 뒤에 열리거나([수정] 버튼), 주소(?edit=1)로 함께 열릴 때도 JSX 에서 상세보다 뒤에 있어 effect 가 나중에
   * 돈다 — 늘 나중에 달린다. 둘의 JSX 순서를 바꾸면 수정이 먼저 닫혀 이 값이 false 로 보일 수 있다.
   */
  const dismissDetail = () => {
    if (editOpen || document.querySelector("dialog[open]")) return;
    closeDetail();
  };

  /**
   * 바탕창 클릭 — 위에 겹친 패널만이 아니라 열린 패널(등록 · 상세 · 수정)을 모두 닫고 목록으로 간다(2026-10-22 사용자 요청).
   * Esc · 취소 · 브라우저 뒤로 가기는 한 단계씩이다. 목록 주소를 새로 쌓으므로(상세 닫기와 같다) 그 뒤 뒤로 가기는 닫기 전 화면을 다시 연다.
   */
  const closeAll = () => {
    setNewOpen(false);
    editPushed.current = false;
    if (query.admin) closeDetail();
  };

  /**
   * 등록 패널의 Esc · 닫기. 등록도 바탕창을 깔아 연 동안 목록은 눌리지 않지만, 앞으로 가기처럼 주소(?admin=)로 상세가
   * 그 위에 겹칠 수 있다. 그때 Esc 는 위의 상세만 닫아야 한다 — 등록이 같이 닫히면 다시 열 때 입력이 비워진다.
   */
  const dismissNew = () => {
    if (query.admin) return;
    setNewOpen(false);
  };

  // 바탕창(closeOnBackdrop 켠 패널)이 떠 있는 동안 목록·필터를 inert 로 뺀다 — 바탕창은 클릭만 가로채고
  // 포커스는 가두지 않아, 이것 없이는 Tab 으로 여기까지 넘어와 [등록]을 눌러 버린다(코드 리뷰로 찾음, 2026-10-20).
  const backdropActive = useBackdropActive();

  return (
    <>
      {/* [등록]은 제목 줄 오른쪽 — 3팀 목록과 같은 자리(2026-10-23). 바탕창이 떠 있는 동안은 목록처럼 inert 로 뺀다 */}
      <div className="contents" inert={backdropActive}>
        <PageBar title="플랫폼 관리자 관리">
          {can.create && (
            <Button ref={newTrigger} aria-controls="platform-admin-new-panel" aria-expanded={newOpen} onClick={() => setNewOpen(true)}>
              등록
            </Button>
          )}
        </PageBar>
      </div>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        {/* display:contents 로 레이아웃(gap-[12px])에 끼어들지 않으면서 둘을 함께 inert 로 뺀다 */}
        <div className="contents" inert={backdropActive}>
          <AdminFilter query={query} roleGroups={roleGroups} onApply={(next) => go({ ...next, page: 1, admin: undefined })} />
          <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
            <ListToolbar total={list.total} />
            <AdminTable rows={list.items} selected={query.admin} onOpen={openDetail} />
            <div className="pt-[14px]">
              <Pagination page={query.page} totalPages={Math.max(1, Math.ceil(list.total / ADMIN_PAGE_SIZE))} onPageChange={(page) => go({ page, admin: undefined })} />
            </div>
          </main>
        </div>

        {can.create && (
          <AdminFormPanel
            id="platform-admin-new-panel"
            mode="create"
            open={newOpen}
            onClose={dismissNew}
            onBackdropClose={closeAll}
            trigger={newTrigger}
            roleGroups={roleGroups}
            onSaved={(result) => {
              setNewOpen(false);
              // 초기 비밀번호 메일이 실패해도 계정은 만들어졌다 — 상세의 비밀번호 초기화로 다시 보낸다(SYSTEM-3).
              toast(result.isMailSent ? "saved" : "저장되었습니다. 초기 비밀번호 메일은 보내지 못했습니다 — 상세에서 비밀번호를 초기화해 주세요.");
              detailTrigger.current = newTrigger.current;
              go({ admin: result.adminAccountId });
            }}
          />
        )}

        <AdminDetailPanel
          open={Boolean(query.admin)}
          detail={shown}
          onClose={dismissDetail}
          onBackdropClose={closeAll}
          trigger={detailTrigger}
          onEdit={openEdit}
          onDeleted={() => {
            toast("deleted");
            // 삭제를 기다리는 동안 뒤로 가기로 상세가 이미 닫혔으면 목록 주소를 다시 쌓지 않는다
            if (detailOpenRef.current) closeDetail();
          }}
        />

        {can.update && shown && "admin" in shown && (
          <AdminFormPanel
            // 다른 계정이면 새로 그린다. 같은 계정을 다시 열거나 최신 정보를 받으면 패널이 스스로 칸을 다시 채운다.
            key={shown.admin.adminAccountId}
            id="platform-admin-edit-panel"
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
            // 최신 정보가 오면(updatedAt 이 바뀌면) 패널이 칸을 한 번 다시 채운다. 알림은 토스트로 남긴다.
            onStale={() => {
              toast("다른 관리자가 먼저 수정했습니다. 최신 정보를 불러왔으니 다시 고쳐 저장해 주세요.");
              router.refresh();
            }}
          />
        )}
      </div>
    </>
  );
}
