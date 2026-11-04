"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useDropdown } from "@/components/common/popup";
import { withScope } from "@/lib/store-scope";
import { useAccount, useCurrentBp, useMenus, useScope, useService, useStores } from "./session-gate";
import { bpPath, isBpPathScreen } from "@/lib/bp-path";
import { menuOfPath } from "@/lib/menus";
import { GUIDE_STEPS, initialTrackOf, TRACK_LABEL, tracksOf, type GuideStep, type GuideTrack } from "@/lib/start-guide";

// 헤더 서비스 바로가기 바로 앞의 [시작 가이드] — 누르면 아래로 단계 목록이 펼쳐진다(2026-11-04 사용자 지정, 쿠팡이츠 사장님 「시작 가이드」처럼).
// 처음엔 홈 제목 옆에 두었다가 헤더로 옮겼다 — 단계가 다른 화면으로 보내므로 어느 화면에서든 다시 열 수 있게(사용자 지정).
// 모양: 홈 현황 카드 제목(「재직 직원 >」)과 같은 글자 버튼 — 회색 14px 500 + 작은 꺾쇠, 호버 · 열림에 포인트 파랑(#4a7ae0, 사용자 지정). 열리면 꺾쇠가 아래를 본다(2026-11-04 사용자 지정).
// 웨일ERP 탭에서만 그린다(플랫폼 계정은 점포를 운영하지 않는다 — admin-header.tsx).
// BP 마스터 · BP 관리자는 위 탭에서 「매장 사장님 | 프랜차이즈 본사」를 직접 고른다(사용자 지정) — 처음 값만 점포 유형으로 짐작한다.
// 가맹 마스터 · 가맹 관리자는 「가맹점」 단계만 보인다. 단계 갈래와 화면 주소는 start-guide.ts.
export function StartGuideButton() {
  const { open, setOpen, close, ref, trigger, id } = useDropdown();
  const account = useAccount();
  const stores = useStores();
  const tracks = tracksOf(account.roleTypeCode);
  const [track, setTrack] = useState<GuideTrack>(() => initialTrackOf(account.roleTypeCode, stores.map((s) => s.storeTypeCode)));
  return (
    <div ref={ref} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-[42px] shrink-0 items-center gap-[6px] px-[6px] text-[14px] font-medium whitespace-nowrap transition-colors duration-150 ease-out hover:text-[#4a7ae0] ${open ? "text-[#4a7ae0]" : "text-erp-label"}`}
      >
        시작 가이드
        {/* 꺾쇠는 글자색을 따른다(currentColor) — 호버 · 열림에 같이 파랑. 모양은 /icons/chevron-small.svg 와 같다 */}
        <svg aria-hidden="true" width="5" height="8" viewBox="0 0 5.09 8.06" fill="none" className={`shrink-0 transition-transform duration-150 ease-out ${open ? "-rotate-90" : "rotate-180"}`}>
          <path d="M4.56 0.53L1.06 4.03l3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {/* 목록 상자는 서비스 바로가기 툴팁(HeaderTip)과 같은 모양 — 흰 바탕 · 회청 테두리 · 6px 모서리 · 꼬리 없음., 아래에서 4px 올라오며
          150ms 로 나타난다(2026-11-04 사용자 지정). 늘 그려 두고 닫혀 있는 동안은 inert 로 포커스가 들어가지 않는다 */}
      <div
        id={id}
        inert={!open}
        className={`absolute top-[calc(100%+8px)] right-0 z-20 w-[400px] rounded-[6px] border border-erp-brand bg-white px-[16px] py-[14px] text-left text-erp-ink transition-[opacity,translate,visibility] duration-150 ease-out motion-reduce:translate-y-0 ${open ? "visible translate-y-0 opacity-100" : "invisible translate-y-[4px] opacity-0"}`}
      >
        <div className="flex flex-col gap-[12px]">
          {tracks.length > 1 && (
            // 밑줄 탭 — 고른 칸만 파랑 글자 600 + 파랑 2px 밑줄, 아래는 표 선(erp-thead-line) 한 줄(2026-11-04 사용자 지정 — 회청 바탕은 칙칙했다).
            // 파랑 #4a7ae0 은 점포 없음 띠와 같은 색, 연파랑(#eef4ff · STEP 꼬리표)은 토큰에 없어 여기 적는다
            <div role="tablist" aria-label="운영 형태" className="grid grid-cols-2 border-b border-erp-thead-line">
              {tracks.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={track === t}
                  onClick={() => setTrack(t)}
                  className={`-mb-px h-[36px] border-b-2 text-[14px] transition-[border-color,color] duration-150 ease-out ${track === t ? "border-[#4a7ae0] font-semibold text-[#4a7ae0]" : "border-transparent font-medium text-erp-label hover:text-erp-ink"}`}
                >
                  {TRACK_LABEL[t]}
                </button>
              ))}
            </div>
          )}
          <ol className="flex flex-col gap-[2px]">
            {GUIDE_STEPS[track].map((step) => (
              <li key={`${track}-${step.label}`}>
                <StepRow step={step} onGo={close} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, onGo }: { step: GuideStep; onGo: () => void }) {
  const menus = useMenus();
  const service = useService();
  const bp = useCurrentBp().bpCodeId;
  const stores = useStores();
  const [scope] = useScope();
  // 점포를 하나라도 등록했으면(폐점 포함 — 등록은 한 것이다) 끝낸 단계로 체크한다
  const done = step.doneWhen === "stores" && stores.length > 0;
  // 묶음 단계(STEP 2 · 3 의 머리)는 갈 화면이 없다. 권한은 그 메뉴의 조회 권한 — 점포 등록은 등록 권한까지 본다
  const menu = step.path ? menuOfPath(menus, step.path === "/stores/new" ? "/stores" : step.path, service) : null;
  const allowed = !!menu && (step.path !== "/stores/new" || menu.permission.create);
  const body = (
    <>
      {/* STEP 꼬리표 — 연파랑 알약(20px · 11px 600 · 자간 조금), 하위 단계 번호는 꼬리표 폭에 맞춰 가운데(2026-11-04 사용자 지정) */}
      <span
        className={`flex h-[20px] w-[52px] shrink-0 items-center justify-center rounded-full font-semibold ${step.sub ? "text-[12px] text-erp-label" : "bg-[#eef4ff] text-[11px] tracking-[0.02em] text-[#4a7ae0]"}`}
      >
        {step.label}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="flex items-center gap-[6px]">
          <span className={step.sub ? "text-[13px]" : "text-[14px] font-medium"}>{step.title}</span>
          {step.optional && <span className="rounded-[2px] border border-erp-thead-line bg-erp-thead-bg px-[4px] text-[12px] text-erp-sub">선택</span>}
        </span>
        {step.note && <span className="text-[12px] text-erp-label">{step.note}</span>}
      </span>
      {/* 끝낸 단계는 오른쪽에 파랑 동그라미 체크(늘 보임) — 「완료」를 글로도 남겨 색만으로 말하지 않는다 */}
      {done && (
        <span className="flex shrink-0 items-center gap-[4px] text-[12px] font-semibold text-[#4a7ae0]">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="8" fill="#4a7ae0" />
            <path d="M4.6 8.2l2.2 2.2 4.6-4.7" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          완료
        </span>
      )}
      {/* 갈 수 있는 단계는 마우스를 올리면 오른쪽 끝에 꺾쇠가 나타난다 */}
      {step.path && <Image src="/icons/chevron-small.svg" alt="" width={5} height={8} className="shrink-0 rotate-180 opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100" />}
    </>
  );
  const row = `group flex w-full items-center gap-[10px] rounded-[4px] py-[7px] ${step.sub ? "pl-[20px]" : "pl-[6px]"} pr-[10px] text-left text-erp-ink`;
  if (!step.path) return <div className={row}>{body}</div>;
  if (!allowed)
    return (
      <div className={`${row} opacity-40`} title="이 메뉴의 권한이 없습니다.">
        {body}
      </div>
    );
  // 헤더 메뉴 · 홈 카드처럼 지금 범위(?scope=)를 싣는다 — 빼면 헤더 범위와 목록 검색 범위가 어긋난다(리뷰 반영)
  return (
    <Link href={withScope(isBpPathScreen(step.path) ? bpPath(bp, step.path) : step.path, scope)} onClick={onGo} className={`${row} transition-colors duration-150 ease-out hover:bg-[#f5f8ff]`}>
      {body}
    </Link>
  );
}
