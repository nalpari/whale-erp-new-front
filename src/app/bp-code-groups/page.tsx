import { PageBar } from "@/components/common";
import { UnsavedChangesProvider } from "@/components/site/code-editor/unsaved-changes";
import { SaveFailedBand } from "@/components/site/code-editor/code-panel";
import { ApiError } from "@/lib/api";
import { searchTerm } from "@/lib/code-drafts";
import { BP_CODE_PAGE_SIZE, getBpCodeGroups, getBpCodeItems } from "@/lib/bp-codes";
import { BpCodeFilter } from "./bp-code-filter";
import { BpCodeGroupPanel } from "./bp-code-group-panel";
import { BpCodeItemPanel } from "./bp-code-item-panel";

// BP 공통코드 관리(MN000014 · S-FHVSAV · okf/config.md 공통코드). 데모 docs/demo/config/codes.html 의 배치 — 왼쪽 필터(그룹 코드 · 그룹명),
// 그룹 목록 카드(읽기만 — 그룹은 플랫폼이 만든다), 고른 그룹의 상세 코드 카드. BP 는 상세 코드만 더하고 고친다(삭제 없음).
// 화면 주소는 /bp/{탭 BP}/bp-code-groups 다 — proxy 가 이 폴더로 rewrite 하며 탭 BP 를 헤더에 싣고, api 호출(authHeaders)이 그 헤더를 넘긴다.
// 검색 · 쪽 · 고른 그룹은 주소(?groupCode · ?groupName · ?page · ?group)에 둔다. 고른 그룹이 이 쪽에 없으면 이 쪽의 첫 그룹을 고른다.
// 상세 코드만 못 불러오면 화면 전체를 오류로 넘기지 않고 오른쪽 패널만 실패를 보인다(플랫폼 공통코드와 같다).
export default async function BpCodesPage({ searchParams }: PageProps<"/bp-code-groups">) {
  const params = await searchParams;
  const page = positiveInt(params.page) ?? 1;
  const groupCode = searchTerm(params.groupCode, 20);
  const groupName = searchTerm(params.groupName, 50);

  const list = await getBpCodeGroups({ page, pageSize: BP_CODE_PAGE_SIZE, groupCode, groupName }).catch(listDenied);
  if ("denied" in list)
    return (
      <>
        <PageBar title="BP 공통코드 관리" />
        <div className="flex min-h-0 flex-1 p-[24px]">
          <section className="flex-1 rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
            <SaveFailedBand message={list.denied} detail={null} />
          </section>
        </div>
      </>
    );

  const selected = list.items.find((g) => g.groupCode === params.group) ?? list.items[0];
  const items = selected
    ? await getBpCodeItems(selected.groupCode).catch((error: unknown) => {
        console.error("BP 상세 코드 조회 실패", selected.groupCode, error);
        return null;
      })
    : { items: [], total: 0 };

  return (
    <>
      <PageBar title="BP 공통코드 관리" />
      <UnsavedChangesProvider>
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <BpCodeFilter key={`${groupCode}|${groupName}`} groupCode={groupCode} groupName={groupName} />
          <BpCodeGroupPanel
            groups={list.items}
            total={list.total}
            page={page}
            pageSize={BP_CODE_PAGE_SIZE}
            search={{ groupCode, groupName }}
            selected={selected?.groupCode}
          />
          <BpCodeItemPanel
            // 그룹을 바꾸면 입력 중이던 값이 다음 그룹으로 새지 않도록 새로 그린다
            key={selected?.groupCode}
            group={selected}
            items={items?.items ?? []}
            loadFailed={items === null}
          />
        </div>
      </UnsavedChangesProvider>
    </>
  );
}

/**
 * 목록을 api 가 거절했다(플랫폼 사용자가 BP 를 고르지 않음 400 · 다른 BP · 권한 없음 403 · 없는 BP 404) — 다시 시도해도 같으므로
 * 오류 화면 대신 그 문장을 보인다. 거절이 아닌 것은 그대로 던져 error.tsx 가 받는다: 서버 장애 · 응답 없음, 검증 실패 400(message 가
 * 배열 — 주소 · 계약이 어긋난 결함), 라우트가 없는 404(Nest 「Cannot GET …」 — api 배포가 어긋남). BP 권한 그룹 관리와 같다.
 */
const listDenied = (error: unknown): { denied: string } => {
  if (!(error instanceof ApiError)) throw error;
  const validation = error.status === 400 && Array.isArray((error.body as { message?: unknown } | null)?.message);
  const noRoute = error.status === 404 && error.message.startsWith("Cannot ");
  if (![400, 403, 404].includes(error.status) || validation || noRoute) throw error;
  console.warn("BP 공통코드 그룹 목록 거절", error.status, error.message);
  return { denied: error.message };
};

function positiveInt(value: string | string[] | undefined): number | undefined {
  const n = typeof value === "string" && /^\d{1,7}$/.test(value) ? Number(value) : 0;
  return n >= 1 ? n : undefined;
}
