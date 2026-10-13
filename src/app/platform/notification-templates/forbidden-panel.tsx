import { Button, PageBar } from "@/components/common";

// 플랫폼 운영자가 아니면(401 · 403) 등록 · 수정 화면 대신 보이는 안내.
export function ForbiddenPanel({ title }: { title: string }) {
  return (
    <>
      <PageBar title={title} />
      <div className="flex min-h-0 flex-1 p-[24px]">
        <section className="flex flex-1 flex-col items-center justify-center gap-[16px] rounded-[4px] border border-erp-panel-line bg-white p-[25px] text-[14px] text-erp-muted">
          <p>알림 템플릿을 볼 권한이 없습니다.</p>
          <Button variant="off" href="/platform/notification-templates">
            목록
          </Button>
        </section>
      </div>
    </>
  );
}
