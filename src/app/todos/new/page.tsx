import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { TodoForm } from "../todo-form";
import { backHrefOf } from "../todo-list-query";

// TO-DO 등록(#117). 목업 TO-DO 탭의 등록 칸 · 데모 todoForm 을 공통 컴포넌트로 옮겼다. 저장하면 들어올 때의 목록(?back=)으로 간다.
export default async function NewTodoPage({ searchParams }: PageProps<"/todos/new">) {
  const [assigneeType, executionMode, search] = await Promise.all([getEnum("TodoAssigneeType"), getEnum("TodoExecutionMode"), searchParams]);

  return (
    <>
      <PageBar title="TO-DO 리스트 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <TodoForm today={kstToday()} labels={{ assigneeType, executionMode }} backHref={backHrefOf(search.back)} />
        </div>
      </div>
    </>
  );
}
