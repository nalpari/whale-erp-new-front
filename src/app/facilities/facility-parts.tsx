"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Badge, Button, PageBar, Pagination, Select, useToast } from "@/components/common";
import { BulkUploadDialog } from "@/components/site/bulk-upload-dialog";
import { useCurrentBp, usePagePermission } from "@/components/site/session-gate";
import { bpPath } from "@/lib/bp-path";
import { FACILITY_PAGE_SIZES, facilityListHref, withFilter, type FacilityListQuery, type FacilityPageSize } from "./facility-list-query";

// 시설물 · 장비 화면들이 함께 쓰는 작은 부품 — 운영상태 배지 · 제목 줄 · 권한 · 목록 쪽 이동.

/** 운영상태 배지 — 운영 파랑 · 보관 회색 · 폐기 빨강(데모 facilityBadge). 글자는 api 가 주는 한글 */
export function FacilityStatusBadge({ code, label }: { code: string; label: string }) {
  return <Badge tone={code === "OPERATING" ? "on" : code === "DISPOSED" ? "off" : "closed"}>{label}</Badge>;
}

/** 제목 줄(「시설물 및 장비 관리」) — 헤더 · 화면 높이는 로그인 후 공통 틀이 잡는다 */
export function FacilityFrame({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <>
      <PageBar title="시설물 및 장비 관리">{actions}</PageBar>
      {children}
    </>
  );
}

/** 상세 · 등록 · 수정의 본문 — 흰 카드 하나, 넘치면 이 안에서 스크롤한다(점포 화면과 같다) */
export function FacilityCardBody({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[24px]">
      <div className="flex flex-col gap-[24px] rounded-[4px] border border-erp-panel-line bg-white p-[24px]">{children}</div>
    </div>
  );
}

/**
 * 지금 화면(메뉴 /facilities)의 등록 · 수정 · 삭제 권한이 있을 때만 children 을 그린다. 메뉴 권한은 로그인 정보(브라우저)에 있어 서버 컴포넌트가 감싸 쓴다.
 * 화면은 숨기기만 하고 막는 것은 api 다.
 */
export function FacilityPermission({ action, children, fallback = null }: { action: "create" | "update" | "delete"; children: ReactNode; fallback?: ReactNode }) {
  return usePagePermission()[action] ? children : fallback;
}

/** 목록 제목 줄의 [일괄 등록] · [등록] — 권한 그룹이 이 메뉴에 등록 권한을 준 계정에만(PL-1, PL-7) */
export function FacilityCreateButton({ href }: { href: string }) {
  return (
    <FacilityPermission action="create">
      <div className="flex gap-[6px]">
        <FacilityBulkButton />
        <Button href={href}>등록</Button>
      </div>
    </FacilityPermission>
  );
}

/**
 * [일괄 등록] — 공통 일괄 등록 팝업(BulkUploadDialog)을 연다(정책서 PL-7). 양식 · 검사 · 미리보기 열은 api(/facilities/bulk-*)가 정한다.
 * 등록하면 「N건을 등록했습니다.」 토스트를 띄우고 목록을 다시 받는다.
 */
function FacilityBulkButton() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="soft" onClick={() => setOpen(true)}>
        일괄 등록
      </Button>
      <BulkUploadDialog
        resource="facilities"
        title="시설물 · 장비 일괄 등록"
        open={open}
        onClose={() => setOpen(false)}
        onDone={(count) => {
          setOpen(false);
          toast(count === null ? "등록했습니다." : `${count.toLocaleString("ko-KR")}건을 등록했습니다.`);
          router.refresh();
        }}
        onUncertain={() => router.refresh()}
        templateFileName="시설물장비_일괄등록_양식.xlsx"
        templateGuide={
          <>
            운영상태 · 그룹 · 분류 · 점검 주기는 양식 안 드롭다운에서 고르고, 점포는 둘째 시트의 점포코드를 적어 주세요.
            <br />
            문서 · 관리 담당자 · A/S센터 주소는 등록한 뒤 수정 화면에서 넣습니다.
          </>
        }
        uploadGuide="내려받은 양식으로 작성한 .xlsx 파일 1개, 한 번에 500건까지 올릴 수 있습니다. 올리면 바로 등록하지 않고 먼저 확인합니다."
      />
    </>
  );
}

function useListNavigation(query: FacilityListQuery) {
  const router = useRouter();
  const bp = useCurrentBp().bpCodeId;
  const [, startTransition] = useTransition();
  const [current, setCurrent] = useOptimistic(query);
  const navigate = (next: FacilityListQuery) =>
    startTransition(() => {
      setCurrent(next);
      router.replace(bpPath(bp, facilityListHref(next)), { scroll: false });
    });
  return { current, navigate };
}

/** 한 쪽 건수(50 · 100). 바꾸면 1쪽으로 */
export function FacilityPageSizeSelect({ query }: { query: FacilityListQuery }) {
  const { current, navigate } = useListNavigation(query);
  return (
    <div className="w-[80px] shrink-0">
      <Select aria-label="페이지당 건수" value={String(current.pageSize)} onChange={(e) => navigate(withFilter(current, { pageSize: Number(e.target.value) as FacilityPageSize }))}>
        {FACILITY_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function FacilityPagination({ query, totalPages }: { query: FacilityListQuery; totalPages: number }) {
  const { current, navigate } = useListNavigation(query);
  return <Pagination page={current.page} totalPages={totalPages} onPageChange={(page) => navigate({ ...current, page })} />;
}
