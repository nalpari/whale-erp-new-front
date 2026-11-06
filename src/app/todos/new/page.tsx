import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { TodoForm } from "../todo-form";
import { backHrefOf } from "../todo-list-query";

// TO-DO 등록(#117). 목업 TO-DO 탭의 등록 칸을 점포 등록 모양의 두 단으로 옮겼다(데모 staff/todos-new.mjs). 저장하면 만든 TO-DO 의 상세로 간다(상세의 ?back= 은 점포 검색을 비운 목록).
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
