import { PageBar } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getMenu, getMenuServices, getMenuTree } from "@/lib/platform-menus";
import { type MenuDetailState } from "./menu-parts";
import { MenusScreen } from "./menus-screen";

// 플랫폼 메뉴 관리(MN000215 · S-GXMZOU · F-CWWQUR). 데모 docs/demo/system/menus.html 을 공통 컴포넌트로 옮기고, 끌어 옮기기는 목업
// docs/mockup/system/menus.html 을 따른다. 서비스 탭(공통코드 SERVICE 전부 — 사용중지 포함) 아래 왼쪽 메뉴 트리, 오른쪽 고정 칸에 고른 메뉴의
// 수정(조회 권한만이면 상세) · 등록 양식. 서비스 목록 화면은 없고 처음 들어오면 첫 탭의 트리를 본다(2026-10-08).
// 고른 서비스 · 메뉴는 주소(?service= · ?menu=)에 둔다. 상세만 못 불러오면 트리는 그대로 두고 오른쪽 칸에서 알린다.
export default async function PlatformMenusPage({ searchParams }: PageProps<"/platform/system/menus">) {
  const params = await searchParams;
  const services = await getMenuServices();
  const service = services.find((s) => s.serviceCode === params.service) ?? services[0];
  const selected = positiveInt(params.menu);
  const [tree, detail] = await Promise.all([service ? getMenuTree(service.serviceCode) : null, selected ? loadDetail(selected) : null]);
  return (
    <>
      <PageBar title="플랫폼 메뉴 관리" />
      <MenusScreen
        services={services}
        tree={tree}
        selected={selected}
        // 다른 서비스의 메뉴 id 가 주소에 남았으면(탭을 바꾼 직후 · 손으로 고친 주소) 고르지 않은 것으로 본다
        detail={detail && "menu" in detail && detail.menu.serviceCode !== service?.serviceCode ? null : detail}
      />
    </>
  );
}

/** 상세를 못 불러오면 칸은 열되 실패 띠로 알린다 — 404(없거나 지운 메뉴)는 그 사실을, 그 밖은 일반 문구를. */
async function loadDetail(id: number): Promise<NonNullable<MenuDetailState>> {
  try {
    return { menu: await getMenu(id) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { failed: "없거나 지운 메뉴입니다." };
    console.error("플랫폼 메뉴 상세 조회 실패", id, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

function positiveInt(value: string | string[] | undefined): number | undefined {
  const n = typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : 0;
  return n >= 1 ? n : undefined;
}
