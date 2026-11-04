"use client";

import Link from "next/link";
import { isFranchiseRole, isPlatformRole } from "@/lib/auth-routes";
import { bpPath } from "@/lib/bp-path";
import { menuOfPath } from "@/lib/menus";
import { isClosedStore } from "@/lib/store-scope";
import { useAccount, useCurrentBp, useMenus, useService, useStores } from "./session-gate";

// 미운영 · 운영 점포가 하나도 없을 때 메뉴 줄 바로 아래 한 줄 띠(2026-11-04 사용자 지정 — 배민 외식업광장 상단 띠처럼).
// 폐점 점포만 있어도 띄운다 — 「점포가 없다」는 쓸 수 있는(미운영 · 운영) 점포가 없다는 뜻이다(2026-11-04 사용자 지정).
// 웨일ERP 탭의 BP 쪽 계정만 본다(플랫폼 계정은 점포를 운영하지 않는다). 점포 목록은 로그인 정보의 관리 점포(useStores)다.
// 가맹 마스터 · 가맹 관리자는 점포를 등록하지 못해(api 403) 배정을 요청하라고만 한다 — 홈 안내(HOME-4)와 같은 규칙.
// 토스식 회색 띠 — 바탕 erp-subtle(#f0f1f3) · 먹색 500 글자 · 앞에 정보 아이콘, 할 일(「점포를 등록」)과 [점포 등록하기]만 포인트 파랑(erp-point, #4a7ae0)
// (2026-11-04 사용자 지정 — 파랑 띠는 화면이 칙칙해 보였다).
export function NoStoreBand() {
  const account = useAccount();
  const bp = useCurrentBp().bpCodeId;
  const stores = useStores();
  const menus = useMenus();
  const service = useService();
  if (service !== "WHALE_ERP" || isPlatformRole(account.roleTypeCode) || !stores.every(isClosedStore)) return null;
  const franchise = isFranchiseRole(account.roleTypeCode);
  // 폐점 점포만 있으면 「등록된 점포가 없다」가 틀린 말이라 앞 문장을 바꾼다
  // BP 마스터만 BP 의 점포 전체를 본다 — 그 밖은 맡은 점포만 보이므로 BP 에 점포가 있어도 0 일 수 있어 「담당 점포」라 한다(리뷰 반영)
  const lead = stores.length ? "운영 중이거나 운영 예정인 점포가 없습니다." : account.roleTypeCode === "BM" ? "아직 등록된 점포가 없습니다." : "아직 담당 점포가 없습니다.";
  const canCreate = !franchise && !!menuOfPath(menus, "/stores", service)?.permission.create;
  return (
    <div role="status" className="flex h-[40px] shrink-0 items-center justify-center gap-[10px] border-b border-erp-bar-line bg-erp-subtle text-[14px] font-medium text-erp-ink">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 text-erp-sub">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 7.2v3.6" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.4" fill="currentColor" />
      </svg>
      {franchise ? (
        <p>
          {lead} <b className="font-semibold text-erp-point">관리자에게 점포 배정을 요청</b>해 주세요.
        </p>
      ) : (
        <p>
          {lead} <b className="font-semibold text-erp-point">점포를 등록</b>하면 직원 · 근무 · 급여 관리를 바로 시작할 수 있습니다.
        </p>
      )}
      {canCreate && (
        <Link
          href={bpPath(bp, "/stores/new")}
          className="ml-[2px] flex h-[26px] items-center rounded-[6px] border border-erp-point bg-erp-point px-[12px] text-[13px] leading-none font-semibold text-white transition-colors duration-150 ease-out hover:bg-white hover:text-erp-point"
        >
          점포 등록하기
        </Link>
      )}
    </div>
  );
}
