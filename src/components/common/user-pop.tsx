"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, type RefObject } from "react";
import { Popup, useDropdown } from "./popup";
import { EASE_OUT } from "./theme";

// href: 페이지 이동, action: 서버 액션(로그아웃 등, 서버 컴포넌트에서도 넘길 수 있다), onSelect: 클라이언트 콜백.
// 세 가지 중 하나만 넣을 수 있다. 나머지 키는 never 로 막아 섞어 넣으면 컴파일 오류가 난다.
export type UserPopItem = { label: string; danger?: boolean } & (
  | { href: string; action?: never; onSelect?: never }
  | { action: (formData: FormData) => void | Promise<void>; href?: never; onSelect?: never }
  | { onSelect: () => void; href?: never; action?: never }
);

// Figma Login_infos. 이름을 누르면 MY PAGE 메뉴가 페이드로 뜬다.
// 화살표 키 탐색을 따로 두지 않으므로 ARIA menu 대신 disclosure(aria-expanded + 링크/버튼 목록)로 둔다.
// Figma Top2 의 Info(둥근 42px 사람 아이콘 + 이름)다.
// triggerRef: 이 버튼을 다른 SlidePanel(MY PAGE 등)의 trigger 로도 쓰려는 바깥 ref — 이름 버튼은
// 컴포넌트 안쪽이라 밖에서 직접 못 잡는다(코드 리뷰로 찾음, 2026-10-21. 전에는 비워 둬 패널을 닫으면
// 포커스가 body 로 빠졌다 — DESIGN.md Slide Panel 의 "닫히면 포커스가 열었던 버튼으로 돌아온다" 위반).
// useDropdown 이 돌려준 trigger ref 는 직접 건드리지 않는다(훅이 쓰는 값은 훅 안에서만 바꾼다, ESLint
// react-hooks/refs) — 커밋이 끝난 뒤 effect 에서 그 값을 바깥 triggerRef 로 복사만 한다.
export function UserPop({ name, items, triggerRef }: { name: string; items: UserPopItem[]; triggerRef?: RefObject<HTMLButtonElement | null> }) {
  const { open, setOpen, close, ref, trigger, id } = useDropdown();
  useEffect(() => {
    if (triggerRef) triggerRef.current = trigger.current;
  });

  return (
    <div ref={ref} className="relative">
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex items-center">
        <span className="flex items-center gap-[10px] text-[15px] font-medium text-erp-ink">
          <Image src="/icons/avatar.svg" alt="" width={42} height={42} />
          {name}
        </span>
        <Image
          src="/icons/user-more.svg"
          alt=""
          width={34}
          height={34}
          className={`transition-transform duration-200 ${EASE_OUT} ${open ? "rotate-180" : ""}`}
        />
      </button>
      <Popup id={id} open={open} motion="fade" tail className="right-0 w-[154px]">
        <p className="text-[15px] leading-[2] font-medium text-[#111] [text-box:trim-both_cap_alphabetic]">MY PAGE</p>
        <hr className="mt-[12px] mb-[18px] border-erp-button-line" />
        <ul className="text-[14px] leading-[2] [text-box:trim-both_cap_alphabetic]">
          {items.map((item) => {
            const tone = item.danger ? "text-[#e93737]" : "text-erp-ink hover:text-erp-brand";
            return (
              <li key={item.label}>
                {item.href !== undefined ? (
                  <Link href={item.href} onClick={close} className={tone}>
                    {item.label}
                  </Link>
                ) : item.action !== undefined ? (
                  <form action={item.action} onSubmit={close}>
                    <button type="submit" className={tone}>
                      {item.label}
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      item.onSelect();
                    }}
                    className={tone}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Popup>
    </div>
  );
}
