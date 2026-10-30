import { PageBar } from "@/components/common";
import { CARD, FailedBand } from "@/components/site/side-parts";
import { ApiError, deniedMessageOf } from "@/lib/api";
import { getBpAdmin, getBpAdminRoleGroups, getBpAdmins, type BpAdminDetail } from "@/lib/bp-admins";
import { AdminsScreen } from "./admins-screen";
import { bpAdminListQueryOf, parseBpAdminsQuery } from "./bp-admins-href";

// BP 관리자 관리(MN000012 · 목록 S-AJHXFU · 등록 S-NIMSMQ · 상세 S-EBIPGZ · 초기화 S-TKSRJX · 수정 S-OENTFQ).
// 왼쪽 필터, 오른쪽 목록. 상세 · 등록 · 수정은 목록 위로 밀려 나오는 슬라이드 패널이다(데모 config/admins · 플랫폼 관리자와 같은 동작).
// 화면 주소는 /bp/{탭 BP}/bp-admins 다 — proxy 가 이 폴더로 rewrite 하며 탭 BP 를 헤더에 싣고, api 호출(authHeaders)이 그 헤더를 넘긴다.
// 목록 조건 · 연 상세 · 수정은 주소에 둔다(bp-admins-href.ts). api 가 대상 BP 를 거절하면(400 · 403 · 404) 오류 화면 대신 그 문장을 보인다.
// 상세만 못 불러오면 목록은 그대로 두고 패널에서 알린다.
export default async function BpAdminsPage({ searchParams }: PageProps<"/bp-admins">) {
  const query = parseBpAdminsQuery(await searchParams);

  const [list, roleGroups, detail] = await Promise.all([
    // 계정상태를 모두 끄면(NONE) 결과 없음 — api 를 부르지 않는다(플랫폼 관리자와 같다, 2026-10-27 사용자 지정).
    // 그래서 이 BP 를 api 가 거절해도(400 · 403 · 404) 이때는 거절 띠 대신 빈 목록이 보이고, 상태를 하나 켜면 띠가 나온다
    // 역할을 모두 꺼도(빈 배열) 같다(2026-10-30)
    query.accountStatus === "NONE" || query.roleTypeCodes?.length === 0
      ? { items: [], total: 0, inactiveCount: 0 }
      : getBpAdmins(bpAdminListQueryOf(query)).catch(listDenied),
    // 권한 그룹 선택지를 못 받아도 목록은 연다 — null 로 넘겨 필터 · 폼이 받지 못한 것을 알린다(빈 선택지로 조용히 두지 않는다).
    // 로그인 만료 · 권한 없음은 목록도 같은 이유로 막혀 그쪽이 알리므로 장애 로그를 남기지 않는다
    getBpAdminRoleGroups().catch((error: unknown) => {
      if (!(error instanceof ApiError && (error.status === 401 || error.status === 403))) console.error("BP 관리자 권한 그룹 선택지 조회 실패", error);
      return null;
    }),
    query.admin ? loadDetail(query.admin) : null,
  ]);

  if ("denied" in list)
    return (
      <>
        <PageBar title="BP 관리자 관리" />
        <div className="flex min-h-0 flex-1 p-[24px]">
          <section className={`${CARD} flex-1`}>
            <FailedBand message={list.denied} />
          </section>
        </div>
      </>
    );

  // 제목 줄은 AdminsScreen 이 그린다 — [등록]이 그 줄에 선다
  return <AdminsScreen list={list} roleGroups={roleGroups} query={query} detail={detail} />;
}

/** 목록을 api 가 거절했으면(deniedMessageOf) 오류 화면 대신 그 문장을 보인다. 거절이 아닌 것은 그대로 던져 error.tsx 가 받는다. */
const listDenied = (error: unknown): { denied: string } => {
  const denied = deniedMessageOf(error);
  if (denied === null) throw error;
  console.warn("BP 관리자 목록 거절", error instanceof ApiError ? error.status : undefined, denied);
  return { denied };
};

/**
 * 상세를 못 불러오면 패널은 열되 실패 띠로 알린다. 404 는 지웠거나 볼 수 없는 계정이다 — 가맹 쪽 사용자가 BP 관리자 · 가맹 마스터를 열 때도
 * api 는 있는지 드러내지 않고 404 를 준다(목업의 「접근할 수 없는 계정」 안내와 같은 뜻으로 알린다).
 */
async function loadDetail(id: number): Promise<{ admin: BpAdminDetail } | { failed: string } | null> {
  try {
    return { admin: await getBpAdmin(id) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { failed: "볼 수 없거나 없는 계정입니다." };
    // 볼 수 없는 BP · 권한이면 목록도 같은 이유로 거절돼 그쪽이 알린다 — 장애 로그를 남기지 않는다
    if (error instanceof ApiError && error.status === 403) return { failed: error.message };
    console.error("BP 관리자 상세 조회 실패", id, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
