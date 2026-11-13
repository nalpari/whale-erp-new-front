"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { HeaderTip } from "@/components/common";
import type { NotificationItem } from "@/lib/notifications";
import { formatDateTime } from "@/lib/format";
import { badgeText } from "@/lib/notification-view";

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
      <Link href="/notifications" aria-label="알림" className="group relative shrink-0 rounded-full">
        {icon}
        {/* 마우스를 올리면 마이페이지 알약처럼 둥근 테두리가 회청으로 — 전엔 종 그림만 흐려졌다(2026-11-13 사용자 지정) */}
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full border border-erp-brand opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
        <HeaderTip label="알림" />
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
        className="group relative block rounded-full"
      >
        {icon}
        <span aria-hidden className={`pointer-events-none absolute inset-0 rounded-full border border-erp-brand transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"} group-hover:opacity-100`} />
        {/* 서비스 바로가기와 같은 툴팁(2026-10-29 사용자 지정). 팝오버가 열리면 그 아래에 깔린다. */}
        {!open && <HeaderTip label="알림" />}
        {badge && (
          // 숫자를 동그라미 한가운데에 — 전엔 테두리(2px × 2) · 좌우 여백(4px × 2)이 18px 안에서 숫자 칸을 6px 로 줄여 숫자가 오른쪽으로 비어져 나갔고,
          // 줄 높이로 세로를 맞춰 아래로 처져 보였다(2026-11-04 사용자 지적). flex 로 가운데 두고, 글자 상자를 숫자 높이(cap)로 잘라 세로도 정확히 맞춘다
          <span className="absolute -top-[2px] -right-[4px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-erp-off px-[3px] text-[11px] leading-none font-semibold text-white tabular-nums [text-box:trim-both_cap_alphabetic]">
            {badge}
          </span>
        )}
      </button>
      {/* 헤더에서 여는 상자는 시작 가이드 · 서비스 바로가기 툴팁과 같은 모양 — 회청 1px · 6px 모서리 · 그림자 없음(2026-11-06 사용자 지정, 전엔 #ebebeb · 2px · 그림자) */}
      {open && (
        <div
          id={panelId}
          className="absolute top-[50px] right-0 z-50 w-[400px] overflow-hidden rounded-[6px] border border-erp-brand bg-white text-erp-ink"
        >
          <p className="border-b border-erp-thead-line px-[16px] py-[12px] text-[14px] font-semibold">미확인 알림 {data.unreadCount}건</p>
          {data.recent.length === 0 ? (
            <p className="px-[16px] py-[24px] text-center text-[14px] text-erp-muted">받은 알림이 없습니다.</p>
          ) : (
            <ul>
              {data.recent.map((n) => (
                <li key={n.id} className="border-b border-erp-thead-line last:border-b-0">
                  {/* prefetch 가 읽음을 일으키지 않게 <a> 로 건다. */}
                  {/* 왼쪽 · 오른쪽 여백을 같은 16px 로 — 전엔 점 자리(6 + 10px)를 늘 비워 둬 왼쪽만 넓었다. 빨간 점은 안 읽은 알림 제목 앞에만 붙는다(2026-11-06 사용자 지정) */}
                  <a href={`/notifications/${n.id}/open`} className="block px-[16px] py-[12px] hover:bg-erp-thead-bg">
                    <span className="block min-w-0">
                      {/* 제목은 읽어도 먹색 — 흐리면 막힌 글처럼 보였다. 안 읽은 것만 굵게 + 빨간 점. 내용은 14px 회색 한 줄(행마다 제목 · 내용 · 아래 줄 세 줄),
                          아래 줄은 「연-월-일 시:분 · 구분(템플릿 이름)」 13px — 관련 업무 번호(#30)는 내부 번호라 뺐다(2026-11-06 사용자 지정, A안) */}
                      <span className={`flex min-w-0 items-center gap-[6px] text-[14px] ${n.isRead ? "font-medium" : "font-semibold"}`}>
                        {!n.isRead && (
                          <span className="size-[6px] shrink-0 rounded-full bg-erp-off">
                            <span className="sr-only">미확인</span>
                          </span>
                        )}
                        <span className="truncate">{n.title}</span>
                      </span>
                      {n.body && <span className="mt-[2px] block truncate text-[14px] text-erp-label">{n.body}</span>}
                      {/* 아래 줄 — 구분(알림 종류)은 옅은 꼬리표로 앞에, 일시는 회색 글자로 뒤에(2026-11-06 사용자 지정). 공통 Tag(14px 500)는 다섯 줄에 반복되니 너무 강해 12px 400 회색 글자로 줄였다 */}
                      <span className="mt-[6px] flex items-center gap-[8px]">
                        <span className="rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] text-[12px] leading-[18px] text-erp-label">{n.kind}</span>
                        <span className="text-[12px] text-erp-muted">{formatDateTime(n.createdAt)}</span>
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
