import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getTodo } from "@/lib/todos-api";
import { TodoForm } from "../../todo-form";

// TO-DO 수정. 제목 · 내용 · 수행 예정 일시 · 긴급만 고치고, 그룹이면 api 가 그룹 전체에 쓴다. 저장하면 상세로 돌아간다.
export default async function EditTodoPage({ params }: { params: Promise<{ id: string }> }) {
  const [detail, assigneeType, executionMode] = await Promise.all([getTodo((await params).id), getEnum("TodoAssigneeType"), getEnum("TodoExecutionMode")]);
  if (!detail) notFound();

  return (
    <>
      <PageBar title="TO-DO 리스트 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <TodoForm detail={detail} today={kstToday()} labels={{ assigneeType, executionMode }} />
        </div>
      </div>
    </>
  );
}
