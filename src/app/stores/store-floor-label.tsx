"use client";

import { useCodeLabel } from "@/components/site/code-label";
import type { StoreFloor } from "@/lib/store-types";
import { floorLabel } from "@/lib/store-view";

/** 층 한 줄의 층 표기(지상 1층 · 지하 2층). 층 구분 한글은 공통코드 FLOOR_TYPE 에서 읽는다 — 서버 컴포넌트(상세)에도 둔다. */
export function StoreFloorLabel({ floor }: { floor: Pick<StoreFloor, "floorTypeCode" | "floorNumber"> }) {
  return floorLabel(floor, useCodeLabel("FLOOR_TYPE"));
}
