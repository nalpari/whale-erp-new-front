import { Button } from "@/components/common";
import { bpHref } from "@/lib/api";
import { MENU_CODE } from "@/lib/menus";
import { labelOf } from "@/lib/enums";
import { getStaffMemberContractSummary } from "@/lib/staff-members-api";
import { StatusBadge } from "../../contracts/columns";
import { ContractMenuPermission } from "../../contracts/contract-permission";
import { contractSummaryTexts, payrollAccountRows, TAX_PROFILE_UNAVAILABLE } from "./contract-summary";
import { AreaFailure, BoxMessage } from "./detail-box";
import { MenuTextLink } from "./manage-link";
import { loadArea, loadLabels } from "./summary-load";

/**
 * 직원 상세의 「근로계약」 칸(WHALEERP-184). 근로계약 영역 요약(GET /staff-members/:id/summary/contracts, api #183)으로 가장 최근
 * 계약 하나를 받는다. 이 경로는 근로계약 관리 조회 권한도 보므로, 그 권한이 없으면 403 「조회 권한이 없습니다.」라 이 칸만 안내한다
 * (front #79 와 같은 자리). 못 받으면 이 칸만 안내를 그리고 throw 하지 않는다 — 기본 정보 · 다른 칸은 그대로 둔다.
 */
export async function ContractBox({ staffMemberId, detailSearch, manageHref }: { staffMemberId: number; detailSearch: string; manageHref: string }) {
  const [result, statuses, employmentTypes] = await Promise.all([
    loadArea("근로계약 칸", () => getStaffMemberContractSummary(staffMemberId)),
    loadLabels("ContractStatus"),
    loadLabels("EmploymentType"),
  ]);
  if (result.kind !== "ok") return <AreaFailure kind={result.kind} subject="근로계약을" />;

  const c = result.data.contract;
  // 근로계약서를 쓰면서 직원이 생기므로 계약 없음은 거의 나오지 않는다(2026-10-19 노영주). 나오면 작성으로 넘긴다 —
  // 버튼은 근로계약 관리 등록 권한이 있을 때만(front #57 규칙: 다른 메뉴는 useMenuRole)
  if (!c)
    return (
      <BoxMessage>
        등록된 근로계약이 없습니다.
        <ContractMenuPermission action="create">
          {/* [취소]가 이 직원 상세(같은 [목록] 주소 · 주)로 돌아오게 들어온 주소를 싣는다(?entry=, WHALEERP-683) */}
          <Button href={await bpHref(`/contracts/new?entry=${encodeURIComponent(`/staff-members/${staffMemberId}${detailSearch}`)}`)}>
            근로계약서 작성
          </Button>
        </ContractMenuPermission>
      </BoxMessage>
    );

  const texts = contractSummaryTexts(c, c.employmentType && employmentTypes ? labelOf(employmentTypes, c.employmentType) : null);
  const statusCell = c.status && statuses ? <StatusBadge status={c.status} label={labelOf(statuses, c.status)} /> : "-";
  const rows = [
    { label: "계약 유형", value: texts.type },
    { label: "계약 기간", value: texts.period },
    { label: "계약 상태", value: statusCell },
    // 신고 정보를 풀지 못하면 그 줄만 회색 안내 — 근로계약 상세와 같은 모양(WHALEERP-758)
    ...payrollAccountRows(result.data).map((r) => ({
      ...r,
      value: r.value === TAX_PROFILE_UNAVAILABLE ? <span className="text-erp-label">{r.value}</span> : r.value,
    })),
    { label: "최근 발송일", value: texts.lastSent },
    { label: "갱신 예정일", value: texts.renewal },
  ];

  // 제목 줄은 Box 가 그려 DetailTable 을 쓰지 않는다. 줄 모양은 DetailTable 의 줄을 옮겨 왔다 — 라벨 110 고정, 줄 46.
  // DetailTable 의 줄 모양을 고치면 여기도 같이 고친다(공통 컴포넌트는 1팀과 맞춰 고치므로 줄만 따로 내보내지 않았다).
  return (
    <>
      <dl className="flex w-full flex-col border-t border-erp-thead-line">
        {rows.map(({ label, value }, i) => {
          const last = i === rows.length - 1;
          return (
            <div key={label} className="flex w-full">
              <dt
                className={`flex h-[46px] w-[110px] shrink-0 items-center truncate border-b border-l border-erp-thead-line bg-white p-[12px] text-[14px] font-medium text-erp-label ${
                  last ? "rounded-bl-[2px]" : ""
                }`}
              >
                {label}
              </dt>
              <dd
                className={`flex h-[46px] min-w-px flex-1 items-center gap-[10px] overflow-hidden border-r border-b border-erp-thead-line bg-white p-[12px] text-[14px] text-erp-ink ${
                  last ? "rounded-br-[2px]" : ""
                }`}
              >
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
      {/* [근로계약 관리]는 그 직원 이름 · 근무지로 검색한 근로계약 목록으로 간다 — 조회 권한이 없으면 글자만(2026-11-23 사용자 지정) */}
      <p className="mt-[6px] text-[13px] text-erp-label">
        최근 체결한 근로계약 1건만 표시됩니다. 이전 계약은{" "}
        <MenuTextLink menuCode={MENU_CODE.contracts} href={manageHref}>
          [근로계약 관리]
        </MenuTextLink>
        에서 확인할 수 있습니다.
      </p>
    </>
  );
}
