"use client";

import { useState, type ReactNode } from "react";

/**
 * 대표 이미지 한 장. 주소는 api 가 서명한 5분짜리라, 화면을 오래 열어 두면 다시 불러올 때 실패한다 —
 * 그때는 점포 아이콘(fallback)으로 돌아간다. 주소가 바뀌면 부모가 key 로 새로 그려 실패 표시도 지운다.
 * 서명 주소는 S3 라 next/image 의 최적화 서버를 거치지 않고 그대로 그린다.
 */
export function StoreImagePicture({ url, alt, sizeClass, fallback }: { url: string; alt: string; sizeClass: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 5분짜리 서명 주소라 이미지 최적화 캐시에 둘 수 없다
    <img src={url} alt={alt} onError={() => setFailed(true)} className={`shrink-0 rounded-[2px] border border-erp-panel-line bg-white object-cover ${sizeClass}`} />
  );
}
