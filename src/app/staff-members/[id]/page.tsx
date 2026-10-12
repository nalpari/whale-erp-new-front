import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlarmLink, DetailTable, GlobalHeader, PageBar, ServiceLinks, StoreSelect, UserPop } from "@/components/common";
import { getStaffMember, kstToday } from "@/lib/staff-members";
// 헤더 메뉴 · 사용자 메뉴는 아직 디자인 견본의 값뿐이다(목록 화면과 같다).
import { MENUS, STORES, USER_ITEMS } from "../../design/sample";
import { EMPLOYMENT_TYPE_LABELS, formatPhone, joinCell, statusCells } from "../staff-row";
import { CellView } from "../staff-table";
import { StaffDetailActions } from "./staff-detail-actions";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 현황 영역. 내용은 직원 상세 요약 api(WHALEERP-183)가 나온 뒤 채운다 — 그때 이 화면을 다시 작업한다.
const SECTIONS = ["근로계약 관리", "근무스케줄 관리", "출퇴근 현황 관리", "급여명세서 관리", "TO-DO 관리"];

// 직원 상세(WHALEERP-184). 지금은 틀과 기본 정보만이다 — 목록 한 줄에 있는 값으로 그린다. 직무 · 입사일 · 생년월일 ·
// 이메일 · 본인인증은 상세 요약 api 가 나오면 더한다. 가린 직원 · 없는 직원 · 이상한 id 는 404 다.
export default async function StaffMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffMember((await params).id);
  if (!staff) notFound();

  const basicRows = [
    { label: "이름", value: staff.name },
    { label: "고용형태", value: staff.employmentType ? EMPLOYMENT_TYPE_LABELS[staff.employmentType] : "-" },
    { label: "소속 근무지", value: staff.store.name },
    { label: "휴대전화번호", value: staff.phone ? formatPhone(staff.phone) : "-" },
    { label: "가입·인증", value: <CellView cell={joinCell(staff, kstToday())} /> },
    {
      label: "재직 상태",
      value: statusCells(staff).map((cell) => <CellView key={cell.text} cell={cell} />),
    },
  ];

  return (
    <div className="h-[100dvh] overflow-x-auto overflow-y-hidden bg-erp-thead-bg">
      <div className="flex h-full min-w-[1720px] flex-col">
        <GlobalHeader
          menus={MENUS}
          right={
            <>
              <StoreSelect options={STORES} />
              <ServiceLinks />
              <AlarmLink href="#" />
              <UserPop name="정하윤 (BP 마스터)" items={USER_ITEMS} />
            </>
          }
        />
        <PageBar title="직원 상세" />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
          <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
            <div className="flex items-end gap-[6px]">
              <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">{staff.name}</h2>
              <StaffDetailActions />
            </div>
            <div className="flex gap-[24px]">
              <div className="w-[560px] shrink-0">
                <DetailTable title="기본 정보" rows={basicRows} />
              </div>
              <div className="flex min-w-px flex-1 flex-col gap-[18px]">
                {SECTIONS.map((title) => (
                  <section key={title}>
                    <h3 className="flex h-[42px] items-center rounded-t-[2px] border border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
                      {title}
                    </h3>
                    <p className="flex h-[92px] items-center justify-center rounded-b-[2px] border-x border-b border-erp-thead-line text-[14px] text-erp-muted">
                      준비 중입니다.
                    </p>
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
