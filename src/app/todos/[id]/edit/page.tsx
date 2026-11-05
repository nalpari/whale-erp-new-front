import { notFound } from "next/navigation";
import { PageBar } from "@/components/common";
import { deniedMessageOf, getEnum } from "@/lib/api";
import { kstToday } from "@/lib/staff-members";
import { getTodo } from "@/lib/todos-api";
import { TodoForm } from "../../todo-form";
import { backHrefOf } from "../../todo-list-query";

// TO-DO 수정. 제목 · 내용 · 수행 예정 일시 · 긴급만 고치고, 그룹이면 api 가 그룹 전체에 쓴다. 저장하면 상세로 돌아간다(목록 주소 ?back= 은 그대로 넘긴다).
export default async function EditTodoPage({ params, searchParams }: PageProps<"/todos/[id]/edit">) {
  const [detail, assigneeType, executionMode, search] = await Promise.all([
    // api 의 거절(BP 를 고르지 않은 플랫폼 계정 400 · 다른 BP 403 — deniedMessageOf)은 그 문장으로 보인다. 404 는 getTodo 가 null 로 바꿔 notFound 다(상세와 같다)
    getTodo((await params).id).catch((e: unknown) => {
      const notice = deniedMessageOf(e);
      if (notice === null) throw e;
      return { notice };
    }),
    getEnum("TodoAssigneeType"),
    getEnum("TodoExecutionMode"),
    searchParams,
  ]);
  if (!detail) notFound();
  if ("notice" in detail)
    return (
      <>
        <PageBar title="TO-DO 리스트 관리" />
        <p role="alert" className="p-[24px] text-[14px] text-erp-label">
          {detail.notice}
        </p>
      </>
    );

  return (
    <>
      <PageBar title="TO-DO 리스트 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <TodoForm detail={detail} today={kstToday()} labels={{ assigneeType, executionMode }} backHref={backHrefOf(search.back)} />
        </div>
      </div>
    </>
  );
}
