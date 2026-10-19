import type { MenuDetail } from "@/lib/platform-menus";
import type { ActionFailure } from "./actions";

// 플랫폼 메뉴 관리 화면들이 같이 쓰는 작은 조각. 카드 · 띠 · 칸 오류는 권한 관리와 같이 쓴다(components/site/side-parts).

export const PATH = "/platform/system/menus";

/** 오른쪽 칸의 상세 — 고르지 않음(null) · 불러옴 · 실패. page · menus-screen · menu-side 가 같이 쓴다 */
export type MenuDetailState = { menu: MenuDetail } | { failed: string } | null;

/** 고른 서비스 · 메뉴 주소. 메뉴가 없으면 서비스만 */
export const hrefOf = (serviceCode: string, menuId?: number) => `${PATH}?service=${encodeURIComponent(serviceCode)}${menuId ? `&menu=${menuId}` : ""}`;

/**
 * server action 호출 자체가 실패했을 때(연결 끊김 · 재배포로 action 을 못 찾음). 쓰기는 처리됐을 수도 있어 부르는 쪽이 화면을 새로 받는다.
 */
export const unknownResult =
  (what: string) =>
  (error: unknown): ActionFailure => {
    console.error(`플랫폼 메뉴 ${what} 호출 실패`, error);
    return { ok: false, message: `${what} 결과를 확인하지 못했습니다. 화면을 새로 받았으니 처리됐는지 확인한 뒤 다시 시도해 주세요.` };
  };

/** 사용 상태 배지 — 공통코드 화면과 같은 글자(사용 / 미사용) */
export const statusText = (status: string) => (status === "ACTIVE" ? "사용" : "미사용");
