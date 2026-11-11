"use client";

import Link from "next/link";
import { useToast } from "@/components/common";
import { isFranchiseRole, isPlatformRole } from "@/lib/auth-routes";
import { bpPath } from "@/lib/bp-path";
import { menuOfPath } from "@/lib/menus";
import { initialTrackOf } from "@/lib/start-guide";
import { isClosedStore } from "@/lib/store-scope";
import { useAccount, useCurrentBp, useMenus, useService, useStores } from "./session-gate";

// 미운영 · 운영 점포가 하나도 없을 때 메뉴 줄 바로 아래 한 줄 띠(2026-11-04 사용자 지정 — 배민 외식업광장 상단 띠처럼).
// 폐점 점포만 있어도 띄운다 — 「점포가 없다」는 쓸 수 있는(미운영 · 운영) 점포가 없다는 뜻이다(2026-11-04 사용자 지정).
// 웨일ERP 탭에서 본다 — BP 쪽 계정과 BP 를 골라 넘어온 플랫폼 계정(2026-11-05). 점포 목록은 그 탭의 점포(useStores)다.
// 가맹 마스터 · 가맹 관리자는 점포를 등록하지 못해(api 403) 배정을 요청하라고만 한다 — 홈 안내(HOME-4)와 같은 규칙.
// 토스식 회색 띠 — 바탕 erp-subtle(#f0f1f3) · 먹색 500 글자 · 앞에 정보 아이콘, 할 일(「점포를 등록」)과 [점포 등록하기]만 포인트 파랑(erp-point, #4a7ae0)
// (2026-11-04 사용자 지정 — 파랑 띠는 화면이 칙칙해 보였다).
// 띠는 높이 56px · 글자 16px · 아이콘 18px, [점포 등록하기]는 34px · 14px 로 키웠다 — 더 넓게 눈에 띄게(2026-11-11 사용자 지정, 전엔 40px · 14px · 버튼 26px · 13px). 바탕은 회색 그대로다.
const REGISTER =
  "ml-[4px] flex h-[34px] items-center rounded-[6px] border border-erp-point bg-erp-point px-[16px] text-[14px] leading-none font-semibold text-white transition-colors duration-150 ease-out hover:bg-white hover:text-erp-point";

export function NoStoreBand() {
  const account = useAccount();
  const bp = useCurrentBp().bpCodeId;
  const stores = useStores();
  const menus = useMenus();
  const service = useService();
  const toast = useToast();
  // 웨일ERP 탭이면 플랫폼 계정이 BP 를 골라 넘어온 경우도 띄운다(2026-11-05 사용자 지정 — 전엔 플랫폼 계정에 숨겼다)
  if (service !== "WHALE_ERP" || !stores.every(isClosedStore)) return null;
  const franchise = isFranchiseRole(account.roleTypeCode);
  // 폐점 점포만 있으면 「등록된 점포가 없다」가 틀린 말이라 앞 문장을 바꾼다
  // BP 마스터 · 플랫폼 계정은 BP 의 점포 전체를 본다 — 그 밖은 맡은 점포만 보이므로 BP 에 점포가 있어도 0 일 수 있어 「담당 점포」라 한다(리뷰 반영)
  const lead = stores.length ? "운영 중이거나 운영 예정인 점포가 없습니다." : account.roleTypeCode === "BM" || isPlatformRole(account.roleTypeCode) ? "등록된 점포가 없습니다." : "담당 점포가 없습니다.";
  const canCreate = !franchise && !!menuOfPath(menus, "/stores", service)?.permission.create;
  return (
    <div role="status" className="flex h-[56px] shrink-0 items-center justify-center gap-[12px] border-b border-erp-bar-line bg-erp-subtle text-[16px] font-medium text-erp-ink">
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="shrink-0 text-erp-sub">
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
      {/* [점포 등록하기]는 등록 권한과 상관없이 늘 보인다 — 권한이 있으면 등록 화면으로, 없으면 「접근 권한이 없습니다.」를 알린다(2026-11-05 사용자 지정, 전엔 권한이 없으면 숨겼다).
          가맹 마스터 · 가맹 관리자는 점포를 등록하는 역할이 아니라 배정 요청 문구만 둔다 */}
      {!franchise &&
        (canCreate ? (
          // 시작 가이드 STEP 1 미니 카드를 함께 띄운다(?guide=, 2026-11-11 사용자 지정) — 갈래는 시작 가이드의 처음 값과 같다(가맹 역할이 아니면 매장 사장님)
          <Link href={`${bpPath(bp, "/stores/new")}?guide=${initialTrackOf(account.roleTypeCode)}-1`} className={REGISTER}>
            점포 등록하기
          </Link>
        ) : (
          <button type="button" onClick={() => toast("접근 권한이 없습니다.")} className={REGISTER}>
            점포 등록하기
          </button>
        ))}
    </div>
  );
}
