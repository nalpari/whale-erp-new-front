import { unstable_rethrow } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getBpMaster, getBpMasters, type BpMasterDetail } from "@/lib/bp-masters";
import { bpMastersHref, parseBpMastersQuery } from "./bp-masters-href";
import { BpMastersScreen } from "./bp-masters-screen";

// BP 마스터 계정 관리 (S-ALHCJS · 상세 S-GZDODB · 초기화 S-PRRLMA · 등록 S-OJEYQJ · 수정 S-CQGGZS · okf/bp.md).
// 왼쪽 필터, 오른쪽 목록. 상세 · 등록 · 수정은 목록 위로 밀려 나오는 슬라이드 패널이다(플랫폼 관리자 관리와 같은 틀, BP-6).
// 목록 조건과 연 상세는 주소에 둔다(bp-masters-href.ts). 상세만 못 불러오면 목록은 그대로 두고 패널에서 알린다.
// 메뉴 권한(등록 · 수정 · 삭제)은 로그인 정보에서 화면(클라이언트)이 읽는다(SessionGate).
export default async function BpMastersPage({ searchParams }: PageProps<"/bp-masters">) {
  const query = parseBpMastersQuery(await searchParams);
  // 상태를 셋 다 끄면(status=NONE) 결과 없음 — api 를 부르지 않는다(플랫폼 관리자와 같다, 2026-10-28 사용자 지정)
  const [list, detail] = await Promise.all([query.statusNone ? { items: [], total: 0 } : getBpMasters(query), query.bp ? loadDetail(query.bp) : null]);

  // 0건이면 조건 없이(검색어 · 상태 · 인증 여부 없음) 한 번 더 물어 「BP 가 아예 없는지」와 「조건에 맞는 BP 가 없는지」를 가른다 — 관리자 목록과 같다.
  // 상태를 모두 끈 0건도 같다(이유를 따로 말하지 않는다, 2026-11-05 사용자 지정). 지금 조회가 이미 조건 없음이면 다시 묻지 않고, 묻지 못하면 「조건에 맞는 …」
  const allQuery = { ...parseBpMastersQuery({}), pageSize: query.pageSize };
  const noBpAtAll =
    list.total === 0 &&
    (bpMastersHref({ ...query, page: 1, bp: undefined, edit: undefined }) === bpMastersHref(allQuery) ||
      (await getBpMasters(allQuery)
        .then((all) => all.total === 0)
        .catch((error: unknown) => {
          unstable_rethrow(error); // 로그인 만료 이동(request())은 삼키지 않는다
          console.warn("BP 마스터 전체 건수 확인 실패", error);
          return false;
        })));

  // 제목 줄(PageBar)은 BpMastersScreen 이 그린다 — [등록]이 등록 패널을 여는 상태와 같은 곳에 있어야 해서다(플랫폼 관리자와 같다)
  return <BpMastersScreen list={list} noBpAtAll={noBpAtAll} query={query} detail={detail} />;
}

/** 상세를 못 불러오면 패널은 열되 실패 띠로 알린다 — 404(지웠거나 없는 BP)는 그 사실을, 그 밖은 일반 문구를. */
async function loadDetail(bpCodeId: number): Promise<{ bp: BpMasterDetail } | { failed: string }> {
  try {
    return { bp: await getBpMaster(bpCodeId) };
  } catch (error) {
    unstable_rethrow(error); // 로그인 만료 이동(request())은 삼키지 않는다
    if (error instanceof ApiError && error.status === 404) return { failed: "삭제되었거나 없는 BP 입니다." };
    console.error("BP 마스터 계정 상세 조회 실패", bpCodeId, error);
    return { failed: "상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
