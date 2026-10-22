import type { Metadata } from "next";
import { connection } from "next/server";
import { LeadForm, LeadScreen, type LeadOptions } from "@/app/design/guest/inquiry/lead-form";
import { GuestPage } from "@/app/design/guest/guest-ui";
import { GuestNote } from "@/app/design/guest/notices/notice-views";
import { getEnum, request } from "@/lib/api";
import type { Codes } from "@/lib/session";
import { RetryButton } from "../notices/retry-button";
import { submitLead } from "./actions";

export const metadata: Metadata = { title: "도입문의 · Whale ERP" };

/** 선택지를 받는다. 받지 못했거나 꼭 고를 업종 · 관심 서비스가 비었으면 null — 원인은 서버 로그에 남긴다. 도입 예정 시기는 선택이라 비어도 된다. */
async function loadOptions(): Promise<LeadOptions | null> {
  try {
    const [{ codes }, interests] = await Promise.all([request<{ codes: Codes }>("/public-code-items?groups=INDUSTRY,PLAN_PERIOD"), getEnum("LeadInterest")]);
    const options = { industries: codes.INDUSTRY ?? [], periods: codes.PLAN_PERIOD ?? [], interests };
    if (options.industries.length && options.interests.length) return options;
    console.error("비로그인 도입문의 선택지가 비었습니다", { industries: options.industries.length, interests: options.interests.length });
  } catch (error) {
    console.error("비로그인 도입문의 선택지 조회 실패", error);
  }
  return null;
}

// 비로그인 도입문의(#297 · #298, S-SDMDKC). 디자인 샘플(design/guest/inquiry)과 같은 폼이고, 선택지는 api 에서 받아 접수를 보낸다.
// 선택지가 없으면 고를 수 없어 폼 대신 다시 시도를 둔다.
export default async function LeadsPage() {
  // 요청마다 그린다 — 빌드 때 api 가 없어 다시 시도 화면이 정적 페이지로 굳지 않게(terms 와 같다).
  await connection();
  const options = await loadOptions();

  return (
    <GuestPage>
      <LeadScreen>{options ? <LeadForm options={options} submit={submitLead} /> : <GuestNote action={<RetryButton />}>도입문의 화면을 불러오지 못했습니다.</GuestNote>}</LeadScreen>
    </GuestPage>
  );
}
