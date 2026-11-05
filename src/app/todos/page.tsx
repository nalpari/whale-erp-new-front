import { redirect } from "next/navigation";
import { ListToolbar, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getTodos } from "@/lib/todos-api";
import { TodoFilter } from "./todo-filter";
import { TodoCreateButton, TodoPageSize, TodoPagination } from "./todo-list-controls";
import { DEFAULT_TODO_LIST_QUERY, emptyPageHref, parseTodoListQuery, todoListApiSearch, toTodoListSearch, withBack } from "./todo-list-query";
import { TodoTable } from "./todo-table";

// TO-DO 리스트 관리 목록(#116). 목업 docs/mockup/staff/index.html TO-DO 탭 · 데모 docs/demo/staff/todos.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /todos 다. 화면 상태는 URL 에만 둔다. 등록 · 수정은 데모의 슬라이드 패널 대신 화면(/todos/new · /todos/[id]/edit)으로 둔다(계획 문서).
// 목업의 상태별 건수 줄은 api 가 상태별 건수를 주지 않아 총 건수만 보인다.
// 점포 조건은 점포 목록과 같은 네 가지(todo-list-query.ts)이고, 고른 점포 · 점포 하나 범위는 storeIds, 직영 · 가맹 범위는 storeTypes 로 api 에 보낸다.
// 상세 · 등록으로 갈 때 지금 목록 주소를 ?back= 으로 넘긴다.
export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseTodoListQuery(await searchParams);
  const [{ items, total }, statusLabels, assigneeTypeLabels] = await Promise.all([
    getTodos(todoListApiSearch(query)),
    getEnum("TodoStatus"),
    getEnum("TodoAssigneeType"),
  ]);
  // 상세에서 지우고 돌아온 쪽이 비었으면 남은 마지막 쪽으로 — 「등록된 TO-DO 가 없습니다」가 보이지 않게
  const moveTo = emptyPageHref(query, items.length, total);
  if (moveTo) redirect(moveTo);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  // 0건이면 조건 없이(전체 점포 · 상태 전체 · 담당 전체 · 기간 없음) 한 번 더 물어 「TO-DO 가 아예 없는지」와 「조건에 맞는 TO-DO 가 없는지」를 가른다
  // (직원 · 점포 목록과 같은 방식, 2026-11-04 사용자 지정). 묻지 못하면 「조회된 TO-DO 가 없습니다.」
  // 지금 조회가 이미 「전체」(조건 없음)면 다시 묻지 않는다 — 같은 요청을 두 번 보내지 않게(리뷰 반영)
  const allSearch = todoListApiSearch({ ...DEFAULT_TODO_LIST_QUERY, storesCleared: true, pageSize: query.pageSize });
  const noTodosAtAll =
    total === 0 &&
    (todoListApiSearch({ ...query, page: 1 }) === allSearch ||
      (await getTodos(allSearch)
        .then((all) => all.total === 0)
        .catch((error: unknown) => {
        // 확인에 실패하면 예전처럼 「조회된 …」 — 장애를 알아챌 수 있게 로그만 남긴다(리뷰 반영)
        console.warn("TO-DO 전체 건수 확인 실패", error);
        return false;
      })));
  const listHref = `/todos${toTodoListSearch(query)}`;

  return (
    <>
      <PageBar title="TO-DO 리스트 관리">
        <TodoCreateButton href={withBack("/todos/new", listHref)} />
      </PageBar>
      <div className="flex min-h-0 flex-1 gap-[12px] p-[24px]">
        <TodoFilter query={query} statusLabels={statusLabels} assigneeTypeLabels={assigneeTypeLabels} />
        <main className="flex min-h-0 flex-1 flex-col gap-[12px] overflow-y-auto rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={total}>
            <TodoPageSize query={query} />
          </ListToolbar>
          <TodoTable
            items={items}
            page={query.page}
            pageSize={query.pageSize}
            today={kstToday()}
            statusLabels={statusLabels}
            listHref={listHref}
            empty={noTodosAtAll ? "등록된 TO-DO 가 없습니다." : "조회된 TO-DO 가 없습니다."}
          />
          <div className="pt-[14px]">
            <TodoPagination query={query} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </>
  );
}
