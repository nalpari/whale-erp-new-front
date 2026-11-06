"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/common";
import { imageKeyOf } from "@/lib/store-image";
import { drawnUrlOf, StoreImagePicture } from "../store-image-picture";

/**
 * 점포 상세의 대표 이미지 — 칸은 가운데를 기준으로 잘라 채우고, 누르면 원본 전체를 팝업으로 크게 본다(2026-11-03 사용자 요청).
 * 팝업은 확인창(ConfirmDialog) · 변경이력과 같은 네이티브 <dialog> 라 최상위 레이어 · 포커스 가두기 · Esc 닫기를 브라우저에 맡긴다.
 * 바깥(배경)을 눌러도 닫힌다. 원본은 잘리지 않게 화면 안에 들어가는 만큼 줄여 보인다.
 * 이미지를 끝내 그리지 못하면(만료 · 지워진 파일) 원본 보기 버튼을 거두고 점포 아이콘(fallback)만 둔다 — 깨진 원본 팝업을 열지 않는다(코드 리뷰).
 */
export function StorePhotoViewer({ url, name, boxClass, fallback }: { url: string; name: string; boxClass: string; fallback: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  // 그리지 못한 주소 — 새로고침으로 새 주소를 받으면 다시 그려 본다
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const alt = `${name} 대표 이미지`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (brokenUrl === url) return fallback;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`${alt} 크게 보기`} className={`group/photo relative block shrink-0 cursor-zoom-in overflow-hidden rounded-[8px] ${boxClass}`}>
        <StoreImagePicture key={imageKeyOf(url)} url={url} alt={alt} sizeClass="size-full" fallback={fallback} onBroken={() => setBrokenUrl(url)} />
        {/* 누를 수 있다는 표시 — 오른쪽 아래 반투명 돋보기를 늘 두고, 마우스를 올리면 진해진다(버튼은 무거워 뺐다, 2026-11-03 사용자 지정) */}
        <span className="pointer-events-none absolute right-[8px] bottom-[8px] grid size-[28px] place-items-center rounded-full bg-erp-nav/50 text-white transition-colors duration-150 ease-out group-hover/photo:bg-erp-nav/80 group-focus-visible/photo:bg-erp-nav/80 motion-reduce:transition-none">
          <ZoomIcon />
        </span>
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        // 배경을 누르면 닫는다 — 여백은 안쪽 칸이 맡아, dialog 자신이 눌린 것은 배경뿐이다(여백을 눌러 닫히던 것, 코드 리뷰)
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        // #ebebeb 팝업 테두리는 Figma 에 한 번만 나오는 색이라 토큰이 없다(DESIGN.md Popups)
        className="m-auto max-w-[calc(100vw-32px)] rounded-[2px] border border-[#ebebeb] bg-white p-0 text-erp-ink shadow-[0_2px_6px_rgba(40,47,55,0.08)] backdrop:bg-erp-nav/40"
      >
        <div className="p-[23px]">
          <h2 id={titleId} className="text-[18px] font-semibold">
            {alt}
          </h2>
          {/* 서명 주소는 5분이면 만료된다 — 화면에 이미 그린 같은 이미지의 주소로 연다(받은 주소 그대로면 오래 둔 화면에서 깨졌다, 2026-11-03 사용자 지적) */}
          {open && (
            // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
            <img src={drawnUrlOf(url)} alt={alt} className="mt-[12px] block max-h-[calc(100dvh-200px)] max-w-[min(960px,calc(100vw-80px))] rounded-[2px] object-contain" />
          )}
          <div className="mt-[24px] flex justify-end">
            <Button variant="off" onClick={() => setOpen(false)}>
              닫기
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** 돋보기(16px, 선 1.5) — 글자색을 따른다 */
function ZoomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.75 12.75 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 6v5M6 8.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
