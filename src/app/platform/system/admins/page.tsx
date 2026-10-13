import { PageBar } from "@/components/common";
import { ApiError } from "@/lib/api";
import { getCurrentAdmin } from "@/lib/current-admin";
import { getPlatformAdminPermission } from "@/lib/current-permission";
import { getPlatformAdmin, getPlatformAdmins, getPlatformRoleGroups, type PlatformAdminDetail } from "@/lib/platform-admins";
import { parseAdminsQuery } from "./admins-href";
import { AdminsScreen } from "./admins-screen";

// 플랫폼 관리자 관리 (S-YTKWGG · 상세 S-BRSPGB · 등록 S-FOJJKB · 수정 S-CZGHBS · 삭제 S-NLVXWJ · 초기화 S-XKYOND).
// 왼쪽 필터, 오른쪽 목록. 상세 · 등록 · 수정은 목록 위로 밀려 나오는 슬라이드 패널이다(데모와 같다 · 2026-10-08).
// 목록 조건과 연 상세는 주소에 둔다(admins-href.ts). 상세만 못 불러오면 목록은 그대로 두고 패널에서 알린다.
export default async function PlatformAdminsPage({ searchParams }: PageProps<"/platform/system/admins">) {
  const params = await searchParams;
  const query = parseAdminsQuery(params);
  const permission = getPlatformAdminPermission(params);

  const [list, roleGroups, me, detail] = await Promise.all([
    getPlatformAdmins({ page: query.page, keyword: query.keyword, roleGroupId: query.roleGroupId, statuses: query.status && [query.status] }),
    getPlatformRoleGroups(),
    getCurrentAdmin(),
    query.admin ? loadDetail(query.admin) : null,
  ]);

  return (
    <>
      <PageBar title="플랫폼 관리자 관리" />
      <AdminsScreen list={list} roleGroups={roleGroups} me={me} permission={permission} query={query} detail={detail} />
    </>
  );
}

/** 상세를 못 불러오면 패널은 열되 실패 띠로 알린다 — 404(지웠거나 없는 계정)는 그 사실을, 그 밖은 일반 문구를. */
async function loadDetail(id: number): Promise<{ admin: PlatformAdminDetail } | { failed: string } | null> {
  try {
    return { admin: await getPlatformAdmin(id) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { failed: "삭제되었거나 없는 계정입니다." };
    console.error("플랫폼 관리자 상세 조회 실패", id, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
