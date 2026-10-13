import { PageBar } from "@/components/common";
import { DEFAULT_PAGE_SIZE, getCodeGroups, getCodeItems } from "@/lib/codes";
import { getCodePermission } from "@/lib/current-permission";
import { CodeGroupPanel } from "./code-group-panel";
import { CodeItemPanel } from "./code-item-panel";
import { UnsavedChangesProvider } from "./unsaved-changes";

// 플랫폼 공통코드 관리 (S-UQPNIH). 한 화면에 왼쪽 그룹 목록, 오른쪽 고른 그룹의 상세 코드를 둔다.
// 쪽과 고른 그룹은 주소(?page · ?group)에 둔다. 고른 그룹이 이 쪽에 없으면 이 쪽의 첫 그룹을 고른다.
// TODO(로그인): 메뉴 조회 권한이 없으면 메뉴에서 숨기고, 주소로 들어오면 권한 없음 안내 뒤 홈으로 보낸다(okf/system.md 공통).
export default async function PlatformCodesPage({ searchParams }: PageProps<"/platform/system/codes">) {
  const params = await searchParams;
  const permission = getCodePermission(params);
  const page = positiveInt(params.page) ?? 1;
  const query = permission === "view" ? ({ permission: "view" } as const) : {};

  const [groups, owners] = await Promise.all([
    getCodeGroups({ page, pageSize: DEFAULT_PAGE_SIZE }),
    // 관리 주체 한글은 화면에 상수로 두지 않고 공통코드 MANAGE_OWNER 에서 읽는다(naming.md 화면 문구).
    getCodeItems("MANAGE_OWNER"),
  ]);
  const selected = groups.items.find((g) => g.groupCode === params.group) ?? groups.items[0];
  // 고른 그룹의 상세 코드만 못 불러오면 화면 전체를 오류로 넘기지 않는다 — 주소에 ?group= 이 남아 [다시 시도]도 같은 그룹을 다시 불러
  // 다른 그룹으로 갈 수 없게 된다. 그룹 목록은 그대로 그리고 오른쪽 패널만 실패를 보인다.
  const items = selected
    ? await getCodeItems(selected.groupCode).catch((error: unknown) => {
        console.error("상세 코드 조회 실패", selected.groupCode, error);
        return null;
      })
    : { items: [], total: 0 };
  const ownerLabels = Object.fromEntries(owners.items.map((o) => [o.itemCode, o.label]));

  return (
    <>
      <PageBar title="플랫폼 공통코드 관리" />
      <UnsavedChangesProvider>
        <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
          <CodeGroupPanel
            // 다른 쪽으로 가면 새로 그린다. 그룹만 바꿀 때는 그대로 두어 목록 스크롤 위치를 지킨다 —
            // 버리기로 한 변경은 패널이 고른 그룹이 바뀔 때 스스로 지운다.
            key={page}
            groups={groups.items}
            total={groups.total}
            page={page}
            pageSize={DEFAULT_PAGE_SIZE}
            selected={selected?.groupCode}
            ownerLabels={ownerLabels}
            permission={permission}
            query={query}
          />
          <CodeItemPanel
            // 그룹을 바꾸면 입력 중이던 값이 다음 그룹으로 새지 않도록 새로 그린다
            key={selected?.groupCode}
            group={selected}
            items={items?.items ?? []}
            ownerLabel={selected && ownerLabels[selected.manageOwnerCode]}
            loadFailed={items === null}
            permission={permission}
          />
        </div>
      </UnsavedChangesProvider>
    </>
  );
}

function positiveInt(value: string | string[] | undefined): number | undefined {
  const n = typeof value === "string" && /^\d{1,6}$/.test(value) ? Number(value) : 0;
  return n >= 1 ? n : undefined;
}
