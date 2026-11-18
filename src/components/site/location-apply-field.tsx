"use client";

import type { ReactNode } from "react";
import { HelpTip } from "@/components/common";

/**
 * 「출퇴근 위치적용」 칸 — 이름은 그대로 두고 라벨 옆 도움말 i 로 뜻을 알린다(2026-11-17 사용자 지정 — 「위치적용」만으로는
 * 무엇이 달라지는지 모호했다). 점포 등록 · 수정이 쓰고, 점포 상세는 도움말 내용(LocationApplyTip)을 「출퇴근 위치적용」 줄 라벨 도움말로 쓴다. 뜻은 3팀 출퇴근(api
 * attendance/my-attendance.service.ts)이 이 값으로 하는 일 그대로다 — 사용이면 직원 앱이 위치를 읽어 근무지 반경을
 * 확인하고(반경 밖이어도 막지 않고 「확인 필요」를 붙여 받는다 — ATT-11), 미사용이면 위치를 읽지 않는다. 도움말 버튼이 <label> 안에 들면 누를 때 선택칸으로 초점이 가므로 공통 Field
 * 대신 묶음(group)으로 그리고, 선택칸에는 aria-label 을 단다(children 쪽).
 */
export function LocationApplyField({ children }: { children: ReactNode }) {
  return (
    <div role="group" aria-label="출퇴근 위치적용" className="flex w-[150px] flex-col justify-center gap-[8px]">
      <span className="flex items-center gap-[4px] text-[14px] font-medium text-erp-label">
        출퇴근 위치적용
        <LocationApplyHelp alignGroup />
      </span>
      {children}
    </div>
  );
}

/** 「출퇴근 위치적용」 도움말 i — 칸(LocationApplyField)이 쓴다. alignGroup — 상자를 감싼 묶음 왼쪽 끝에 맞춘다(칸) */
export function LocationApplyHelp({ alignGroup = false }: { alignGroup?: boolean }) {
  return <HelpTip label="출퇴근 위치적용 도움말" floating alignGroup={alignGroup} text={<LocationApplyTip />} />;
}

/**
 * 도움말 상자 내용 — 제목 「출퇴근 위치적용」 + 사용 · 미사용 두 줄 표. 노출 대상 표(post-form.tsx)와 같은 선 · 머리 바탕, 말은 짧게(2026-11-17 사용자 지정).
 * 점포 상세는 「출퇴근 위치적용」 줄 라벨의 도움말(DetailTable help)로 이 내용을 쓴다
 */
export function LocationApplyTip() {
  return (
    <span className="flex flex-col gap-[8px]">
      <span className="font-semibold text-erp-ink">출퇴근 위치적용</span>
      <table className="border-collapse text-[14px]">
        <tbody>
          {[
            ["사용", "출퇴근 위치가 근무지 반경 밖이면 「확인 필요」로 표시됩니다."],
            ["미사용", "위치 확인 없이 어디서나 출퇴근할 수 있습니다."],
          ].map(([name, text]) => (
            <tr key={name} className="border border-erp-thead-line">
              <th scope="row" className="border-r border-erp-thead-line bg-erp-thead-bg px-[10px] py-[6px] text-left font-semibold whitespace-nowrap text-erp-ink">
                {name}
              </th>
              <td className="px-[10px] py-[6px] font-normal break-keep text-erp-ink">{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
}
