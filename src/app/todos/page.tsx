import { ListToolbar, PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getTodos } from "@/lib/todos-api";
import { TodoFilter } from "./todo-filter";
import { TodoCreateButton, TodoPageSize, TodoPagination } from "./todo-list-controls";
import { hasTodoFilter, parseTodoListQuery, todoListApiSearch, toTodoListSearch } from "./todo-list-query";
import { TodoTable } from "./todo-table";

// TO-DO 리스트 관리 목록(#116). 목업 docs/mockup/staff/index.html TO-DO 탭 · 데모 docs/demo/staff/todos.html 을 공통 컴포넌트로 옮겼다.
// 데이터는 GET /todos 다. 화면 상태는 URL 에만 둔다. 등록 · 수정은 데모의 슬라이드 패널 대신 화면(/todos/new · /todos/[id]/edit)으로 둔다(계획 문서).
// 목업의 상태별 건수 줄은 api 가 상태별 건수를 주지 않아 총 건수만 보인다.
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
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return (
    <>
      <PageBar title="TO-DO 리스트 관리">
        <TodoCreateButton />
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
            listSearch={toTodoListSearch(query)}
            filtered={hasTodoFilter(query)}
          />
          <div className="pt-[14px]">
            <TodoPagination query={query} totalPages={totalPages} />
          </div>
        </main>
      </div>
    </>
  );
}
