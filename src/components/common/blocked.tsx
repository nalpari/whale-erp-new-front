"use client";

import { useEffect, useRef, type ReactNode } from "react";

const TIP =
  "pointer-events-none w-max max-w-[360px] rounded-[6px] border border-erp-brand bg-white px-[12px] py-[8px] text-left text-[14px] leading-[1.6] font-medium break-keep whitespace-pre-line text-erp-ink";

/**
 * 막힌 버튼의 이유 안내. 막힌 버튼은 호버를 받지 않으므로(Button 의 disabled:pointer-events-none) 감싸는 칸에 단다.
 * 이유는 헤더 툴팁(HeaderTip)과 같은 말풍선 — 흰 바탕 · 회청 테두리 · 먹색 500 · 6px 모서리, 꼬리 없음 — 으로 바로 띄운다.
 * 전엔 브라우저 title 이라 한참 멈춰야 떠 거의 보이지 않았다(2026-11-02 사용자 지적).
 * 막힌 버튼은 오른쪽 끝 버튼 줄에 서므로 말풍선 오른쪽 끝을 버튼에 맞춘다 — 가운데 맞춤이면 패널 밖으로 잘린다.
 * place 는 위(기본) · 아래 — 스크롤 칸 맨 위에 선 버튼(점포 상세 제목 줄 등)은 아래로 띄워야 잘리지 않는다.
 * 잘리는 상자 안이면 floating 을 켠다 — HelpTip floating 처럼 popover 로 최상위 레이어에 띄운다. DataTable 칸(truncate)과
 * 슬라이드 패널(464px, overflow-y-auto) 버튼 줄이 그렇다 — 패널의 [삭제] 뒤에 [수정] · [변경이력]이 서서 말풍선이 패널 왼쪽 밖으로 넘쳤다(PR #211 리뷰).
 * 말풍선 글은 숨기지 않아 화면 낭독기가 버튼 옆 글로 읽는다(막힌 버튼은 포커스를 받지 않는다).
 */
export function Blocked({
  reason,
  place = "top",
  floating,
  children,
}: {
  reason?: string;
  place?: "top" | "bottom";
  floating?: boolean;
  children: ReactNode;
}) {
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);

  // floating — 칸의 오른쪽 끝에 맞춰 위 · 아래에 띄운다. popover 를 모르는 브라우저에서는 뜨지 않는다(HelpTip 과 같다)
  // 버튼 자리에 맞춰 말풍선을 놓는다 — 오른쪽 끝을 맞추고, 고른 쪽에 자리가 모자라면(화면 맨 위 · 맨 아래 줄) 반대쪽에 띄운다.
  // body 는 스크롤하지 않아 잘린 말풍선을 볼 길이 없다
  const placeAt = (box: HTMLElement, at: DOMRect) => {
    const size = box.getBoundingClientRect();
    box.style.left = `${Math.max(8, at.right - size.width)}px`;
    const above = at.top - 6 - size.height;
    const below = at.bottom + 6;
    const fitsBelow = below + size.height <= document.documentElement.clientHeight - 8;
    box.style.top = `${(place === "top" ? above >= 8 || !fitsBelow : !fitsBelow && above >= 8) ? above : below}px`;
  };
  const show = () => {
    const box = tip.current;
    const at = wrap.current?.getBoundingClientRect();
    if (!box || !at || !("showPopover" in box) || box.matches(":popover-open")) return;
    box.showPopover();
    placeAt(box, at);
    // 표를 밀거나 창 크기가 바뀌면 닫는다
    window.addEventListener("scroll", hide, { capture: true, once: true });
    window.addEventListener("resize", hide, { once: true });
    // 마우스를 움직이지 않은 채 패널이 닫히면(Esc · 뒤로 가기) 패널은 inert 가 되어 밀려날 뿐 남아 있어 pointerleave 가 오지 않는다.
    // 떠 있는 동안 프레임마다 보고, 버튼이 빠지거나 inert 안에 들어가면 닫는다. 버튼이 움직이면(패널이 미끄러져 들어오는 중) 따라 옮긴다(PR #211 리뷰)
    cancelAnimationFrame(frame.current);
    let last = at;
    const watch = () => {
      const el = wrap.current;
      if (!el?.isConnected || el.closest("[inert]") || !box.matches(":popover-open")) return hide();
      const now = el.getBoundingClientRect();
      if (Math.abs(now.left - last.left) > 1 || Math.abs(now.top - last.top) > 1) placeAt(box, (last = now));
      frame.current = requestAnimationFrame(watch);
    };
    frame.current = requestAnimationFrame(watch);
  };
  function hide() {
    cancelAnimationFrame(frame.current);
    const box = tip.current;
    if (box && "hidePopover" in box && box.matches(":popover-open")) box.hidePopover();
  }
  // 이유가 사라지거나(막힘이 풀림) 칸이 사라지면 돌던 확인을 멈춘다 — 말풍선 요소가 빠져 hide 가 불리지 않는다
  useEffect(() => () => cancelAnimationFrame(frame.current), [reason, floating]);

  // 문장마다 줄을 바꾼다(2026-11-02 사용자 지정) — api 가 여러 이유를 한 칸 띄워 잇는 것(BP 마스터 삭제)도 줄로 갈린다
  const text = reason?.replace(/([.?!])\s+/g, "$1\n");

  // 이유가 있든 없든 같은 칸으로 감싼다 — 칸이 바뀌면 안의 버튼이 다시 그려져 포커스를 잃는다.
  // 이유가 있으면 손가락 커서와, 다른 버튼과 같은 호버(흰 바탕 · 브랜드 테두리 · 먹색 글자)를 칸에서 막힌 버튼에 건다.
  // 다만 흐림을 다 걷지 않아(40 → 60%) 누를 수 있는 버튼과 갈린다(2026-11-02 사용자 지정)
  return (
    <span
      ref={wrap}
      onPointerEnter={floating && reason ? show : undefined}
      onPointerLeave={floating && reason ? hide : undefined}
      className={`group/blocked relative inline-flex ${
        reason
          ? "cursor-pointer hover:[&>button:disabled]:border-erp-brand hover:[&>button:disabled]:bg-white hover:[&>button:disabled]:text-erp-ink hover:[&>button:disabled]:opacity-60"
          : ""
      }`}
    >
      {children}
      {reason &&
        (floating ? (
          // popover 의 기본 자리(가운데 · 바깥 여백)를 풀고 show 가 잡은 자리에 선다. 열 때 투명도를 150ms 로 올린다.
          // 닫힌 popover 는 display:none 이라 화면 낭독기가 읽지 못한다 — 같은 글을 sr-only 로 버튼 옆에 둔다(aria-hidden 은 떠 있는 쪽)
          <>
            <span className="sr-only">{reason}</span>
            <span
              ref={tip}
              popover="manual"
              aria-hidden
              className={`fixed inset-auto m-0 ${TIP} transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none`}
            >
              {text}
            </span>
          </>
        ) : (
          <span
            className={`absolute right-0 z-30 ${TIP} translate-y-[4px] opacity-0 transition-[opacity,translate] duration-150 ease-out group-hover/blocked:translate-y-0 group-hover/blocked:opacity-100 motion-reduce:translate-y-0 ${
              place === "top" ? "bottom-[calc(100%+6px)]" : "top-[calc(100%+6px)]"
            }`}
          >
            {text}
          </span>
        ))}
    </span>
  );
}
