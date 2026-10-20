import { PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { BP_ROLE_PAGE_SIZE, getBpRoleGroup, getBpRoleGroups } from "@/lib/bp-role-groups";
import type { BpRoleDetailState } from "./bp-actions";
import { BpRolesScreen } from "./roles-screen";

// BP 권한 그룹 관리(MN000013 · S-LYKAEI · 메뉴 등록 S-KUDELB). 플랫폼 권한 관리와 같은 틀 — 왼쪽 그룹 목록(쪽 나눔), 오른쪽 고정 칸에
// 고른 그룹의 수정(고칠 수 없으면 상세) · 등록 양식. 메뉴 권한은 줄마다 [메뉴등록] 팝업, 가맹 마스터 고정 권한은 [가맹마스터 보기] 팝업이다.
// 이 탭의 BP 는 브라우저에만 있어(current-bp) 주소 ?bp= 로 받는다 — 없거나 탭의 BP 와 다르면 화면이 주소를 맞춘다(roles-screen).
// 고른 그룹은 ?role=, 쪽은 ?page= 에 둔다. 상세만 못 불러오면 목록은 그대로 두고 오른쪽 칸에서 알린다.
export default async function BpRolesPage({ searchParams }: PageProps<"/bp-role-groups">) {
  const params = await searchParams;
  const bp = positiveInt(params.bp);
  const page = positiveInt(params.page) ?? 1;
  const selected = positiveInt(params.role);
  const [list, lockReasons, menuReasons, detail] = bp
    ? await Promise.all([
        getBpRoleGroups(bp, page),
        getEnum("PlatformRoleGroupLockReason").catch(enumFailed("PlatformRoleGroupLockReason")),
        getEnum("PlatformRoleMenuBlockReason").catch(enumFailed("PlatformRoleMenuBlockReason")),
        selected ? loadDetail(bp, selected) : null,
      ])
    : [null, [], [], null];
  return (
    <>
      <PageBar title="BP 권한 그룹 관리" />
      <BpRolesScreen
        bp={bp}
        page={page}
        totalPages={Math.max(1, Math.ceil((list?.total ?? 0) / BP_ROLE_PAGE_SIZE))}
        list={list} selected={selected} detail={detail} lockReasons={lockReasons} menuReasons={menuReasons} />
    </>
  );
}

/** 어느 enum 이 실패했는지 로그에 남기고 빈 목록으로 연다 — 화면은 일반 문구로 대신한다(reasonLabel) */
const enumFailed = (name: string) => (error: unknown) => {
  console.error(`BP 권한 그룹 막힘 이유 한글(${name}) 조회 실패`, error);
  return [];
};

/** 상세를 못 불러오면 칸은 열되 실패 띠로 알린다 — 404(지웠거나 볼 수 없는 그룹)는 그 사실을, 그 밖은 일반 문구를. */
async function loadDetail(bp: number, id: number): Promise<NonNullable<BpRoleDetailState>> {
  try {
    return { role: await getBpRoleGroup(bp, id) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { failed: "삭제되었거나 없는 권한 그룹입니다." };
    console.error("BP 권한 그룹 상세 조회 실패", id, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

function positiveInt(value: string | string[] | undefined): number | undefined {
  const n = typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : 0;
  return n >= 1 ? n : undefined;
}
