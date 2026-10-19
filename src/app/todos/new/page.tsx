import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { TodoForm } from "../todo-form";

// TO-DO 등록(#117). 목업 TO-DO 탭의 등록 칸 · 데모 todoForm 을 공통 컴포넌트로 옮겼다. 저장하면 목록으로 간다.
export default async function NewTodoPage() {
  const [assigneeType, executionMode] = await Promise.all([getEnum("TodoAssigneeType"), getEnum("TodoExecutionMode")]);

  return (
    <>
      <PageBar title="TO-DO 리스트 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <TodoForm today={kstToday()} labels={{ assigneeType, executionMode }} />
        </div>
      </div>
    </>
  );
}
