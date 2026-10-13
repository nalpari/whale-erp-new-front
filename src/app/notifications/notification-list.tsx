"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, Checkbox, ConfirmDialog, DataTable, ListToolbar, Pagination, Select, useToast, type Column } from "@/components/common";
import type { NotificationItem } from "@/lib/notifications";
import { formatAt, type NotificationQuery } from "@/lib/notification-view";
import { PAGE_SIZES } from "@/lib/staff-members";
import { deleteAction, readAllAction } from "./actions";

// 데모 staff-parts.mjs 의 회색 배지(quiet). 공통 Badge 에는 on · off 두 가지뿐이다.
const NEUTRAL = "inline-block rounded-[2px] px-[4px] py-[2px] text-center text-[14px] font-medium bg-erp-subtle text-erp-ink whitespace-nowrap";

/** 알림을 눌러 /notifications/{id}/open 에서 돌아온 경우의 안내. 띄운 뒤 주소에서 지운다. */
const RETURN_NOTICE: Record<string, string> = {
  gone: "이동할 화면이 없습니다. 업무가 지워졌거나 볼 권한이 없습니다.",
  read: "알림을 열지 못했습니다. 잠시 후 다시 눌러 주세요.",
};

// 운영 알림함 목록(#254 · 데모 notify/index.mjs). 줄마다 읽음 버튼은 없고 눌러 들어가면 읽음이다(NTF-06).
export function NotificationList({
  items,
  total,
  unreadCount,
  query,
  totalPages,
}: {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  query: NotificationQuery;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const toast = useToast();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [dialog, setDialog] = useState<"readAll" | "delete" | "none" | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    const notice = search.get("gone") ? RETURN_NOTICE.gone : search.get("error") === "read" ? RETURN_NOTICE.read : null;
    if (!notice) return;
    toast(notice);
    router.replace(pathname, { scroll: false });
  }, [search, pathname, router, toast]);

  const go = (next: NotificationQuery) => {
    const params = new URLSearchParams();
    if (next.page !== 1) params.set("page", String(next.page));
    if (next.pageSize !== 20) params.set("pageSize", String(next.pageSize));
    setPicked(new Set());
    router.replace(`/notifications${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const allPicked = items.length > 0 && items.every((i) => picked.has(i.id));
  const toggle = (id: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirm = () =>
    startTransition(async () => {
      const result = dialog === "readAll" ? await readAllAction() : await deleteAction([...picked]);
      if (!result.ok) {
        toast(result.message);
        return;
      }
      if (dialog === "delete") {
        setPicked(new Set());
        toast("deleted");
      }
      setDialog(null);
    });

  const columns: Column<NotificationItem>[] = [
    {
      header: (
        <span className="inline-flex justify-center">
          <Checkbox
            label=""
            aria-label="이 쪽 알림 모두 선택"
            checked={allPicked}
            onChange={() => setPicked(allPicked ? new Set() : new Set(items.map((i) => i.id)))}
          />
        </span>
      ),
      width: "w-[48px]",
      cell: (n) => (
        <span className="inline-flex justify-center">
          <Checkbox label="" aria-label={`${n.title} 선택`} checked={picked.has(n.id)} onChange={() => toggle(n.id)} />
        </span>
      ),
    },
    {
      header: "",
      width: "w-[40px]",
      cell: (n) =>
        n.isRead ? null : (
          <span className="inline-block size-[8px] rounded-full bg-erp-off">
            <span className="sr-only">미확인</span>
          </span>
        ),
    },
    {
      header: "알림",
      align: "left",
      // prefetch 가 이 GET 을 미리 불러 읽음이 되지 않게 <Link> 대신 <a> 로 건다.
      cell: (n) => (
        <a
          href={`/notifications/${n.id}/open`}
          className={`hover:underline ${n.isRead ? "text-erp-muted" : "font-semibold text-erp-ink"}`}
        >
          {n.title}
        </a>
      ),
    },
    { header: "구분", width: "w-[140px]", cell: (n) => <span className={NEUTRAL}>{n.kind}</span> },
    { header: "일시", width: "w-[130px]", cell: (n) => <span className="font-mono text-erp-muted">{formatAt(n.createdAt)}</span> },
  ];

  return (
    <>
      <ListToolbar total={total}>
        <p className="mr-auto pl-[12px] text-[14px] text-erp-muted">
          미확인 <b className="font-semibold text-erp-ink">{unreadCount.toLocaleString("ko-KR")}</b> 건
        </p>
        <Button variant="off" disabled={unreadCount === 0} onClick={() => setDialog("readAll")}>
          모두 읽음
        </Button>
        <Button variant="off" onClick={() => setDialog(picked.size ? "delete" : "none")}>
          선택 삭제
        </Button>
        <div className="w-[80px] shrink-0">
          <Select
            aria-label="페이지당 건수"
            value={String(query.pageSize)}
            onChange={(e) => go({ page: 1, pageSize: Number(e.target.value) as NotificationQuery["pageSize"] })}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </ListToolbar>
      <DataTable columns={columns} rows={items} rowKey={(n) => n.id} rowState={(n) => (picked.has(n.id) ? "selected" : undefined)} empty="받은 알림이 없습니다." />
      <div className="pt-[14px]">
        <Pagination page={query.page} totalPages={totalPages} onPageChange={(page) => go({ ...query, page })} />
      </div>

      <ConfirmDialog
        open={dialog === "readAll"}
        title="모든 알림을 읽음으로 바꾸시겠습니까?"
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setDialog(null)}
      >
        미확인 알림 {unreadCount.toLocaleString("ko-KR")}건이 모두 읽음으로 바뀝니다.
      </ConfirmDialog>
      <ConfirmDialog
        open={dialog === "delete"}
        title="선택한 알림을 삭제하시겠습니까?"
        confirmLabel="삭제"
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setDialog(null)}
      >
        삭제한 알림은 되돌릴 수 없습니다.
      </ConfirmDialog>
      <ConfirmDialog open={dialog === "none"} title="선택된 알림이 없습니다" onConfirm={() => setDialog(null)} onCancel={() => setDialog(null)}>
        삭제할 알림을 먼저 골라 주세요.
      </ConfirmDialog>
    </>
  );
}
