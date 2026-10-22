"use client";

import { useState, type ReactNode } from "react";
import { imageKeyOf } from "@/lib/store-image";

/**
 * 이 탭에서 실제로 그려진 이미지 주소(서명 뺀 주소 → 그 주소). 서명 주소는 조회할 때마다 바뀌어, 새 주소로 그리면 브라우저가 받은 적 없는
 * 이미지로 보고 다시 받는다(그 사이 칸이 비어 깜박이고, 시간이 지나 만료됐으면 S3 오류가 ORB 로 막힌다). 그래서 같은 이미지는 한 번 그린
 * 주소로 계속 그린다 — 브라우저가 이미 받아 둔 것이라 요청하지 않는다. 받아 둔 이미지를 붙잡아 두려고 Image 도 함께 둔다. 오래된 것부터 버린다.
 */
const drawn = new Map<string, { url: string; keep: HTMLImageElement }>();
const DRAWN_MAX = 300;

function rememberDrawn(url: string) {
  const key = imageKeyOf(url);
  if (drawn.get(key)?.url === url) return;
  const keep = new Image();
  keep.src = url;
  drawn.delete(key);
  drawn.set(key, { url, keep });
  if (drawn.size > DRAWN_MAX) drawn.delete(drawn.keys().next().value as string);
}

/**
 * 대표 이미지 한 장. 같은 이미지(서명을 뺀 주소가 같은 것 — 부모 StoreImage 가 key 로 준다)면 이 탭에서 이미 그린 주소로 그리고, 받은 주소가
 * 바뀌어도 그대로 둔다. 그린 주소를 더 쓸 수 없으면(만료 · 브라우저가 비움) 새로 받은 주소로 한 번 더 그리고, 그것도 안 되면 점포 아이콘(fallback)이다.
 * 서명 주소는 S3 라 next/image 의 최적화 서버를 거치지 않고 그대로 그린다.
 */
export function StoreImagePicture({ url, alt, sizeClass, fallback }: { url: string; alt: string; sizeClass: string; fallback: ReactNode }) {
  const [src, setSrc] = useState(() => drawn.get(imageKeyOf(url))?.url ?? url);
  const [failed, setFailed] = useState(false);
  if (failed && url !== src) {
    setSrc(url);
    setFailed(false);
  }
  if (failed) return fallback;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
    <img
      src={src}
      alt={alt}
      onLoad={() => rememberDrawn(src)}
      onError={() => {
        // 기억한 주소를 더 쓸 수 없다 — 다음에는 새로 받은 주소로 그린다
        if (drawn.get(imageKeyOf(src))?.url === src) drawn.delete(imageKeyOf(src));
        setFailed(true);
      }}
      className={`shrink-0 rounded-[2px] border border-erp-panel-line bg-white object-cover ${sizeClass}`}
    />
  );
}
