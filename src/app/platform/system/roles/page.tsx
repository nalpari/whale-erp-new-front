import { PageBar } from "@/components/common";
import { ApiError, getEnum } from "@/lib/api";
import { getRoleGroup, getRoleGroups } from "@/lib/platform-role-groups";
import { type RoleDetailState } from "./role-parts";
import { RolesScreen } from "./roles-screen";

// 플랫폼 권한 관리(MN000214 · S-JDCOAG · 메뉴 등록 S-EFQREM). 데모 docs/demo/system/roles.html 을 공통 컴포넌트로 옮겼다.
// 왼쪽 권한 목록(쪽 나눔 없음), 오른쪽 고정 칸에 고른 권한의 수정(고칠 수 없으면 상세) · 등록 양식. 메뉴 권한은 줄마다 [메뉴등록] 팝업이다.
// 고른 권한은 주소(?role=)에 둔다. 상세만 못 불러오면 목록은 그대로 두고 오른쪽 칸에서 알린다.
// 막힌 이유 한글은 api enum(PlatformRoleGroupLockReason · PlatformRoleMenuBlockReason)에서 읽는다 — 못 받으면 영문 값 대신 일반 문구를 보인다.
export default async function PlatformRolesPage({ searchParams }: PageProps<"/platform/system/roles">) {
  const params = await searchParams;
  const selected = positiveInt(params.role);
  const [roles, lockReasons, menuReasons, detail] = await Promise.all([
    getRoleGroups(),
    getEnum("PlatformRoleGroupLockReason").catch(enumFailed("PlatformRoleGroupLockReason")),
    getEnum("PlatformRoleMenuBlockReason").catch(enumFailed("PlatformRoleMenuBlockReason")),
    selected ? loadDetail(selected) : null,
  ]);
  return (
    <>
      <PageBar title="플랫폼 권한 관리" />
      <RolesScreen roles={roles} selected={selected} detail={detail} lockReasons={lockReasons} menuReasons={menuReasons} />
    </>
  );
}

/** 어느 enum 이 실패했는지 로그에 남기고 빈 목록으로 연다 — 화면은 일반 문구로 대신한다(reasonLabel) */
const enumFailed = (name: string) => (error: unknown) => {
  console.error(`플랫폼 권한 막힘 이유 한글(${name}) 조회 실패`, error);
  return [];
};

/** 상세를 못 불러오면 칸은 열되 실패 띠로 알린다 — 404(지웠거나 없는 권한)는 그 사실을, 그 밖은 일반 문구를. */
async function loadDetail(id: number): Promise<NonNullable<RoleDetailState>> {
  try {
    return { role: await getRoleGroup(id) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { failed: "삭제되었거나 없는 권한입니다." };
    console.error("플랫폼 권한 상세 조회 실패", id, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

function positiveInt(value: string | string[] | undefined): number | undefined {
  const n = typeof value === "string" && /^\d{1,9}$/.test(value) ? Number(value) : 0;
  return n >= 1 ? n : undefined;
}
