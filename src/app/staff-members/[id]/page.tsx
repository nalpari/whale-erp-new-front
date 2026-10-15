import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { DetailTable, PageBar } from "@/components/common";
import { getStaffMember } from "@/lib/staff-members";
import { staffListHref } from "../staff-list-query";
import { EMPLOYMENT_TYPE_LABELS, employmentStatusCells, formatPhone } from "../staff-row";
import { CellView } from "../staff-table";
import { PasswordResetButton, StaffDetailActions } from "./staff-detail-actions";

export const metadata: Metadata = {
  title: "직원 상세 · Whale ERP",
};

// 아직 값이 없는 칸. 상세 요약 api(WHALEERP-183)가 나오면 채운다.
const PENDING = "-";

// 데모 staff-parts.mjs 의 box — 제목 줄(오른쪽에 「관리」 링크) + 내용. 내용은 상세 요약 api 가 나온 뒤 채운다.
function Box({ title, manageHref, children }: { title: string; manageHref: string; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <h3 className="flex h-[42px] items-center gap-[6px] rounded-t-[2px] border border-b-0 border-erp-thead-line bg-erp-thead-bg px-[10px] text-[16px] font-medium text-erp-ink">
        <span className="flex-1">{title}</span>
        <span className="flex items-center gap-[6px] text-[14px] font-normal">
          <Link href={manageHref} className="text-erp-link hover:underline">
            관리
          </Link>
        </span>
      </h3>
      {children}
    </section>
  );
}

function NotReady() {
  return (
    <p className="flex h-[92px] items-center justify-center rounded-b-[2px] border border-erp-thead-line bg-white text-[14px] text-erp-muted">
      준비 중입니다.
    </p>
  );
}

const RIGHT_BOXES = [
  { title: "근무스케줄", manageHref: "/work-schedules" },
  { title: "출퇴근 현황", manageHref: "/attendance-records" },
  { title: "급여명세서", manageHref: "/payslips" },
  { title: "TO-DO", manageHref: "/todos" },
];

// 직원 상세(WHALEERP-184). 배치는 데모 docs/demo/staff/detail.html(원본 src/pages/staff/detail.mjs)과 같다 — 5:7 두 단,
// 왼쪽은 기본 정보 · 비밀번호 초기화 · 근로계약, 오른쪽은 근무스케줄 · 출퇴근 현황 · 급여명세서 · TO-DO.
// 지금은 목록 한 줄에 있는 값만 채운다. 직무 · 입사일 · 생년월일 · 본인인증 · 이메일과 각 영역의 내용은 상세 요약
// api(WHALEERP-183)가 나오면 다시 작업한다. 가린 직원 · 없는 직원 · 이상한 id 는 404 다.
export default async function StaffMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const staff = await getStaffMember((await params).id);
  if (!staff) notFound();
  const employmentStatus = employmentStatusCells(staff);
  const listHref = staffListHref(await searchParams);

  const basicRows = [
    { label: "이름", value: staff.name },
    { label: "직무", value: PENDING },
    { label: "고용 형태", value: staff.employmentType ? EMPLOYMENT_TYPE_LABELS[staff.employmentType] : PENDING },
    { label: "소속 근무지", value: staff.store.name },
    { label: "입사일", value: PENDING },
    { label: "재직 상태", value: employmentStatus.length ? employmentStatus.map((cell) => <CellView key={cell.text} cell={cell} />) : PENDING },
    { label: "생년월일", value: PENDING },
    { label: "휴대전화번호", value: staff.phone ? formatPhone(staff.phone) : PENDING },
    { label: "본인인증", value: PENDING },
    { label: "이메일", value: PENDING },
  ];

  return (
    <>
      <PageBar title="직원 정보 관리" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
        <div className="flex flex-1 flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[6px]">
              <h2 className="flex-1 text-[18px] font-semibold text-erp-ink">직원 상세</h2>
              <StaffDetailActions listHref={listHref} />
            </div>
            <div className="grid grid-cols-[5fr_7fr] items-start gap-[24px]">
              <div className="flex min-w-0 flex-col gap-[24px]">
                <DetailTable title="기본 정보" rows={basicRows} />
                <div className="flex items-center gap-[6px]">
                  <span className="flex-1" />
                  <PasswordResetButton />
                </div>
                <Box title="근로계약" manageHref="/contracts">
                  <NotReady />
                </Box>
              </div>
              <div className="flex min-w-0 flex-col gap-[24px]">
                {RIGHT_BOXES.map((box) => (
                  <Box key={box.title} title={box.title} manageHref={box.manageHref}>
                    <NotReady />
                  </Box>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
