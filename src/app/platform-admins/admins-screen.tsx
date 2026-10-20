"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, ListToolbar, Pagination, useToast } from "@/components/common";
import { usePagePermission } from "@/components/site/session-gate";
import { ADMIN_PAGE_SIZE } from "@/lib/platform-admin-paging";
import type { PlatformAdminDetail, PlatformAdminList, PlatformRoleGroup } from "@/lib/platform-admins";
import { AdminDetailPanel } from "./admin-detail-panel";
import { AdminFilter } from "./admin-filter";
import { AdminFormPanel } from "./admin-form-panel";
import { AdminTable } from "./admin-table";
import { adminsHref, type AdminsQuery } from "./admins-href";

// 목록 화면과 세 슬라이드 패널(등록 · 상세 · 수정)을 한데 쥔다. 수정은 상세 위에 겹쳐 연다(데모와 같다).
// 상세를 열고 닫는 것은 주소(?admin=)로 한다 — 서버가 그 계정을 불러 detail 로 넘긴다.
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
  /** 수정 중인 계정 — 열림 · 닫힘이 아니라 어느 계정인지를 쥐어, 주소 · 상세가 바뀌면 수정 패널이 저절로 닫힌 것이 된다 */
  const [editingId, setEditingId] = useState<number | null>(null);
  const newTrigger = useRef<HTMLButtonElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const editTrigger = useRef<HTMLButtonElement | null>(null);

  // 상세를 닫아도 패널이 밀려 나가는 동안은 마지막 내용을 그대로 보인다.
  const [shown, setShown] = useState(detail);
  if (detail && detail !== shown) setShown(detail);

  // 수정 패널은 그 계정의 상세가 지금 열려 있을 때만 선다. 뒤로 · 앞으로 가기, 필터 · 쪽 이동, 그 사이 다른 관리자가 지움(상세가
  // 실패 띠로 바뀜)처럼 클릭 아닌 길로 상세가 바뀌면 수정도 접는다 — 남겨 두면 앞으로 가기에 저절로 다시 열리거나, 사라진 수정
  // 패널 때문에 상세의 [닫기] · Esc 가 막힌다.
  const editOpen = editingId !== null && editingId === query.admin && !!shown && "admin" in shown && shown.admin.adminAccountId === editingId;
  if (editingId !== null && !editOpen && (editingId !== query.admin || (shown && !("admin" in shown)))) setEditingId(null);

  // 같은 쪽 · 조건으로 다른 화면 상태만 바꾸는 이동이라 스크롤을 맨 위로 올리지 않는다.
  const go = (next: Partial<AdminsQuery>) => router.push(adminsHref({ ...query, ...next }), { scroll: false });

  const openDetail = (id: number, from: HTMLElement) => {
    detailTrigger.current = from;
    go({ admin: id });
  };
  const closeDetail = () => {
    setEditingId(null);
    go({ admin: undefined });
  };
  /**
   * 상세 패널의 Esc · 닫기. 위에 수정 패널이나 확인창 · 이력창(<dialog>)이 떠 있으면 그쪽만 닫혀야 한다(DESIGN.md
   * 「Esc 는 가장 안쪽부터」). 같은 Esc 가 문서까지 올라와 상세도 닫으려 하므로 여기서 거른다 — <dialog> 의 cancel 은
   * keydown 이 다 지나간 뒤에 오므로 이때는 아직 열려 있다.
   * editOpen 은 상세 패널의 Esc 처리가 수정 패널의 것보다 먼저 돈다는 데 기댄다 — 둘 다 document 에 달리고, 수정은
   * 상세를 연 뒤에만 열리므로 늘 나중에 달린다. 순서가 바뀌면 수정이 먼저 닫혀 이 값이 false 로 보일 수 있다.
   */
  const dismissDetail = () => {
    if (editOpen || document.querySelector("dialog[open]")) return;
    closeDetail();
  };

  /**
   * 등록 패널의 Esc · 닫기. 등록 패널을 연 채 목록에서 계정을 누르면 상세가 그 위에 겹친다(목록 왼쪽은 계속 눌린다).
   * 그때 Esc 는 위의 상세만 닫아야 한다 — 등록이 같이 닫히면 다시 열 때 입력이 비워진다. 등록의 [취소]는 상세에 가려 눌리지 않는다.
   */
  const dismissNew = () => {
    if (query.admin) return;
    setNewOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
      <AdminFilter query={query} roleGroups={roleGroups} onApply={(next) => go({ ...next, page: 1, admin: undefined })} />
      <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px] [&>*]:shrink-0">
        <ListToolbar total={list.total}>
          {list.inactiveCount > 0 && <p className="pr-[6px] text-[14px] text-erp-label">미사용 {list.inactiveCount.toLocaleString("ko-KR")}</p>}
          {can.create && (
            <Button ref={newTrigger} aria-controls="platform-admin-new-panel" aria-expanded={newOpen} onClick={() => setNewOpen(true)}>
              등록
            </Button>
          )}
        </ListToolbar>
        <AdminTable rows={list.items} selected={query.admin} onOpen={openDetail} />
        <div className="pt-[14px]">
          <Pagination page={query.page} totalPages={Math.max(1, Math.ceil(list.total / ADMIN_PAGE_SIZE))} onPageChange={(page) => go({ page, admin: undefined })} />
        </div>
      </main>

      {can.create && (
        <AdminFormPanel
          id="platform-admin-new-panel"
          mode="create"
          open={newOpen}
          onClose={dismissNew}
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
        trigger={detailTrigger}
        editOpen={editOpen}
        onEdit={(from) => {
          editTrigger.current = from;
          if (shown && "admin" in shown) setEditingId(shown.admin.adminAccountId);
        }}
        onDeleted={() => {
          toast("deleted");
          closeDetail();
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
          onClose={() => setEditingId(null)}
          trigger={editTrigger}
          roleGroups={roleGroups}
          onSaved={() => {
            setEditingId(null);
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
  );
}
