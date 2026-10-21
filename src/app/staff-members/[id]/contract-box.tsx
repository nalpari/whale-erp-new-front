import { unstable_rethrow } from "next/navigation";
import { ApiError, authHeaders, getEnum, request } from "@/lib/api";
import { labelOf, type EnumValue } from "@/lib/enums";
import { kstToday } from "@/lib/staff-members";
import { StatusBadge } from "../../contracts/columns";
import { contractFailureOf, contractSummaryTexts, labelsOrNull, type ContractDetail } from "./contract-summary";
import { BoxMessage } from "./detail-box";
import { RetryButton } from "./retry-button";

/** 「근로계약」 칸이 계약을 받는 동안. 기본 정보는 먼저 그려지고 이 칸만 기다린다. */
export function ContractBoxLoading() {
  return <BoxMessage>불러오는 중입니다.</BoxMessage>;
}

// enum 한글. 받지 못했거나 응답에 그 enum 이 빠져 비었어도 칸은 그린다 — 그 값만 「-」가 되고 원인은 서버 로그에 남긴다
// (빈 목록은 getEnum 이 남긴다). 이메일 칸의 가입 상태와 같다.
async function loadLabels(name: "ContractStatus" | "EmploymentType"): Promise<EnumValue[] | null> {
  try {
    return labelsOrNull(await getEnum(name));
  } catch (error) {
    unstable_rethrow(error);
    console.error(`직원 상세 근로계약 칸: GET /enums/${name} 를 받지 못했습니다`, error);
    return null;
  }
}

/**
 * 직원 상세의 「근로계약」 칸(WHALEERP-184). 직원 상세 응답의 가장 최근 계약(contract)으로 계약 상세(GET /contracts/:id)를 한 번 더
 * 받는다. 못 받으면 이 칸만 안내를 그리고 throw 하지 않는다 — 기본 정보 · 다른 칸은 그대로 둔다.
 */
export async function ContractBox({ contractId }: { contractId: number }) {
  const headers = await authHeaders();
  const [result, statuses, employmentTypes] = await Promise.all([
    request<ContractDetail>(`/contracts/${contractId}`, { headers }).then(
      (contract) => ({ contract }),
      (error: unknown) => ({ error }),
    ),
    loadLabels("ContractStatus"),
    loadLabels("EmploymentType"),
  ]);

  if ("error" in result) {
    const { error } = result;
    unstable_rethrow(error);
    const status = error instanceof ApiError ? error.status : null;
    // 근로계약 api 는 「근로계약 관리」 메뉴 조회 권한을 본다(api #97, WHALEERP-592) — 직원 정보 관리 권한만 있는 관리자에게
    // 403 은 정상이라 로그를 남기지 않고 안내만 한다
    if (contractFailureOf(status) === "forbidden") return <BoxMessage>근로계약을 볼 권한이 없습니다.</BoxMessage>;
    console.error(`직원 상세 근로계약 칸: GET /contracts/${contractId} 를 받지 못했습니다 (status ${status ?? "연결 실패"})`, error);
    return (
      <BoxMessage alert>
        근로계약을 불러오지 못했습니다.
        <RetryButton />
      </BoxMessage>
    );
  }

  const c = result.contract;
  const texts = contractSummaryTexts(c, employmentTypes ? labelOf(employmentTypes, c.employmentType) : null, kstToday());
  const statusCell = c.status && statuses ? <StatusBadge status={c.status} label={labelOf(statuses, c.status)} /> : "-";
  const rows = [
    { label: "계약 유형", value: texts.type },
    { label: "계약 기간", value: texts.period },
    { label: "계약 상태", value: statusCell },
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
      <p className="mt-[6px] text-[13px] text-erp-label">가장 최근 계약 1건만 보입니다. 이전 이력은 근로계약 관리에서 봅니다.</p>
    </>
  );
}
