"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { NotificationItem } from "@/lib/notifications";
import { badgeText, formatAt } from "@/lib/notification-view";

// 전역 종(#253 · 목업 assets/app.js 의 종 팝오버). 미확인 건수 배지와 최근 알림 팝오버, 알림함 전체 보기.
// 공통 GNB(공통 헤더 · 레이아웃)가 아직 없어 헤더와 떨어진 조각으로 둔다 — 공통 헤더가 생기면 종 자리에 <NotificationBellSlot /> 를 넣는다.
// data 가 null 이면(api 조회 실패) 배지 없이 알림함으로 가는 링크만 그린다. 건수는 화면에 들어올 때 · 새로고침 때만 센다.
export function NotificationBell({ data }: { data: { unreadCount: number; recent: NotificationItem[] } | null }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const icon = <Image src="/icons/alarm-bell.svg" alt="" width={42} height={42} />;
  if (!data)
    return (
      <Link href="/notifications" aria-label="알림" className="shrink-0 rounded-full transition-opacity duration-150 ease-out hover:opacity-70">
        {icon}
      </Link>
    );

  const badge = badgeText(data.unreadCount);
  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label={`알림 ${data.unreadCount}건`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="relative block rounded-full transition-opacity duration-150 ease-out hover:opacity-70"
      >
        {icon}
        {badge && (
          <span className="absolute -top-[2px] -right-[4px] min-w-[18px] rounded-full border-2 border-white bg-erp-off px-[4px] text-center text-[11px] leading-[14px] font-semibold text-white">
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-[50px] right-0 z-50 w-[360px] rounded-[2px] border border-[#ebebeb] bg-white text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)]"
        >
          <p className="border-b border-erp-thead-line px-[16px] py-[12px] text-[14px] font-semibold">미확인 알림 {data.unreadCount}건</p>
          {data.recent.length === 0 ? (
            <p className="px-[16px] py-[24px] text-center text-[14px] text-erp-muted">받은 알림이 없습니다.</p>
          ) : (
            <ul>
              {data.recent.map((n) => (
                <li key={n.id} className="border-b border-erp-thead-line last:border-b-0">
                  {/* prefetch 가 읽음을 일으키지 않게 <a> 로 건다. */}
                  <a href={`/notifications/${n.id}/open`} className="flex gap-[10px] px-[16px] py-[10px] hover:bg-erp-thead-bg">
                    <span className={`mt-[7px] size-[6px] shrink-0 rounded-full ${n.isRead ? "" : "bg-erp-off"}`}>
                      {!n.isRead && <span className="sr-only">미확인</span>}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[14px] ${n.isRead ? "text-erp-muted" : "font-semibold"}`}>{n.title}</span>
                      <span className="mt-[2px] block text-[12px] text-erp-muted">
                        {formatAt(n.createdAt)} · {n.kind}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-erp-thead-line px-[16px] py-[12px] text-center text-[14px] font-medium text-erp-brand hover:bg-erp-thead-bg">
            알림함 전체 보기
          </Link>
        </div>
      )}
    </div>
  );
}
