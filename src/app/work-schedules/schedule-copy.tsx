"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, GuideBand, NoticeBand, useToast } from "@/components/common";
import { useAccount, usePagePermission, useStores } from "@/components/site/session-gate";
import { isPlatformRole } from "@/lib/auth-routes";
import { isClosedStore } from "@/lib/store-scope";
import type { CopyPreview } from "@/lib/work-schedules-api";
import { useFailure } from "../staff-members/[id]/use-action-failure";
import { copyLastWeekAction } from "./actions";
import { useScheduleNavigation } from "./schedule-controls";
import { addDays, type ScheduleQuery, weekRangeLabel } from "./work-schedule-query";
import { copyStatus, totalsLabel } from "./work-schedule-view";

// 지난 주 복사(#204, STAFF-13). 빈 주에서만 켜지고, 누르면 도구 줄 아래에 미리보기를 연다(주소 copy=1 — 서버가 GET /copy-last-week 를 읽는다).
// 원본은 직전 주 고정이고 받을 수 없는 날은 빠진다. 복사하면 바로 반영되고 생긴 직원마다 알림이 한 번 간다(2026-10-08 재영).
// 폐점 점포는 등록과 같이 막는다(운영 정책 ATT-33). 등록 권한이 없으면 열기 버튼을 두지 않고 미리보기도 막는다(api 는 미리보기 GET · 복사 POST 모두 create).

const NOTE = "text-[13px] text-erp-off";

/** 도구 줄 「지난 주 복사」(데모 soft 버튼) — 등록 권한이 없으면 두지 않는다. 근무스케줄이 있는 주 · 폐점 점포면 끈다(안내 글자는 두지 않는다, 2026-10-22 재영) */
export function CopyButton({ query, today, weekEmpty }: { query: ScheduleQuery & { storeId: number }; today: string; weekEmpty: boolean }) {
  const navigate = useScheduleNavigation(today);
  const store = useStores().find((s) => s.storeId === query.storeId);
  const closed = !!store && isClosedStore(store);
  const toast = useToast();
  const platform = isPlatformRole(useAccount().roleTypeCode);
  const canCreate = usePagePermission().create;
  // 플랫폼 계정은 등록 권한이 없어도 BP 마스터와 같은 버튼을 두고, 누르면 권한 안내만 띄운다 — 버튼이 없으면 BP 화면이 다르게 보였다
  // (2026-11-05 사용자 지정, 3팀 확인 필요 — 점포 없음 띠 [점포 등록하기]와 같은 문구). 그 밖의 계정은 지금처럼 두지 않는다
  if (!canCreate && !platform) return null;
  // 폐점은 근무지 칸 아래 안내가 함께 말한다
  return (
    <Button variant="soft" aria-expanded={query.copy} aria-controls="schedule-copy" disabled={!weekEmpty || closed} onClick={() => (canCreate ? navigate({ ...query, copy: !query.copy }) : toast("접근 권한이 없습니다."))}>
      지난 주 복사
    </Button>
  );
}

/** 미리보기를 받지 못한 까닭. 409(빈 주 아님 · 본사에게 가려진 직원)와 다른 4xx 는 api 문장 그대로 */
export type CopyPreviewResult = CopyPreview | { error: string };

/** 「10월 26일 ~ 11월 1일」 — 도구 줄 주 표시(weekRangeLabel)에서 앞 연도만 뺀다 */
const rangeOf = (monday: string) => weekRangeLabel(monday).replace(/^\d+년 /, "");

/** 지난 주 복사 미리보기 — 직원 · 지난 주 · 이번 주 · 처리(목업 STAFF-13 표) */
export function CopyPreviewPanel({ query, today, preview }: { query: ScheduleQuery & { storeId: number }; today: string; preview: CopyPreviewResult }) {
  const navigate = useScheduleNavigation(today);
  const router = useRouter();
  const toast = useToast();
  const onFailure = useFailure();
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const store = useStores().find((s) => s.storeId === query.storeId);
  const closed = !!store && isClosedStore(store);
  const close = () => navigate({ ...query, copy: false });
  // 복사는 등록이다 — api 는 미리보기 GET 도 create 라, 권한 없이 주소(copy=1)로 열면 api 403 문장이 온다. 미리보기를 받은 뒤
  // 권한이 빠지면(SessionGate 가 창 포커스 · 메뉴 이동 때 로그인 정보를 다시 받으면) [N명 복사]가 남으므로 여기서도 막는다
  const canCreate = usePagePermission().create;
  const data = "error" in preview ? null : preview;
  const count = data ? data.staff.filter((s) => s.copied.days > 0).length : 0;

  // 폐점 점포는 주소에 copy=1 을 붙여 열어도(북마크 · 공유 링크) 표와 복사 버튼을 그리지 않는다 — api 가 아직 막지 않는다(WHALEERP-614, front #96 리뷰).
  // 점포 상태는 로그인 정보(useStores)에만 있어 서버의 미리보기 읽기(GET, 쓰지 않음)는 막지 못한다
  if (closed)
    return (
      <section id="schedule-copy" aria-label="지난 주 복사 미리보기" className="flex items-center gap-[8px] rounded-[2px] border border-erp-thead-line p-[16px]">
        <p role="alert" className={`flex-1 ${NOTE}`}>
          폐점 점포는 근무스케줄을 등록할 수 없어 지난 주 복사도 할 수 없습니다.
        </p>
        <Button variant="off" onClick={close}>
          닫기
        </Button>
      </section>
    );
  // 등록 권한이 없으면 표와 복사 버튼 대신 안내와 [닫기]만 — 실패가 아니라 권한 안내라 info 띠다(DESIGN.md Notice Band, 공지 · FAQ 폼과 같다)
  if (!canCreate)
    return (
      <section id="schedule-copy" aria-label="지난 주 복사 미리보기" className="flex items-center gap-[8px]">
        <div className="min-w-0 flex-1">
          <NoticeBand tone="info" title="근무스케줄 등록 권한이 없어 지난 주 복사를 할 수 없습니다." />
        </div>
        <Button variant="off" onClick={close}>
          닫기
        </Button>
      </section>
    );

  const handleCopy = () => {
    setError("");
    startSaving(async () => {
      try {
        const result = await copyLastWeekAction(query.storeId, query.week);
        if (result.ok) {
          toast(`${result.copied}명의 근무스케줄을 복사했습니다.`);
          close();
          return;
        }
        // 결과 모름 — 화면을 새로 받았으니 닫고 알린다(다시 누르면 빈 주가 아니라 409 다)
        if (result.status === undefined) {
          toast(result.message);
          close();
          return;
        }
        const message = onFailure(result);
        if (message) setError(message);
        router.refresh();
      } catch (e) {
        console.error("지난 주 복사 실패", e);
        toast("복사 결과를 확인하지 못했습니다. 화면을 새로 불러왔으니 확인해 주세요.");
        router.refresh();
        close();
      }
    });
  };

  return (
    <section id="schedule-copy" aria-label="지난 주 복사 미리보기" className="flex flex-col gap-[12px] rounded-[2px] border border-erp-thead-line p-[16px]">
      {/* 제목은 카드 묶음 제목(Headline)과 같은 18px 600, 기간은 16px 500 회색 · 도구 줄과 같은 말투(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「지난 주 복사 · 미리보기」 16px · 「10-26 ~ 11-01 → …」 13px) */}
      {/* [취소] [복사]는 표 아래가 아니라 제목 줄 오른쪽 — 미리보기를 열자마자 보이게(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <div className="flex items-center gap-[10px]">
        <h2 className="text-[18px] font-semibold">지난 주 복사</h2>
        {/* 제목과 기간 사이 세로선 — 값 구분선(#d9d9d9)과 같은 색, 글자 높이에 맞춘 14px(2026-11-05 사용자 지정) */}
        <span aria-hidden="true" className="h-[14px] w-px bg-[#d9d9d9]" />
        <span className="flex-1 text-[16px] font-medium text-erp-label">
          {rangeOf(addDays(query.week, -7))} → {rangeOf(query.week)}
        </span>
        <span className="flex gap-[6px]">
          <Button variant="off" onClick={close}>
            취소
          </Button>
          {data && (
            <Button onClick={handleCopy} disabled={saving || count === 0}>
              {saving ? "복사 중" : count ? `${count}명 복사` : "복사"}
            </Button>
          )}
        </span>
      </div>
      {data ? (
        // 열 폭 · 정렬 — 직원 200 · 지난 주 · 이번 주 140 가운데, 처리는 남는 폭 왼쪽 · 앞 36px 띄움(지난 주 · 이번 주 값 사이 간격만큼), (2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 직원이 남는 폭을 다 써 너무 길고 숫자 칸도 왼쪽)
        <table className="w-full table-fixed border-collapse text-[14px]">
          <thead>
            <tr className="h-[38px] border-y border-erp-thead-line bg-erp-thead-bg text-left text-erp-thead-text">
              <th scope="col" className="w-[200px] px-[10px] font-medium">
                직원
              </th>
              <th scope="col" className="w-[140px] px-[10px] text-center font-medium">
                지난 주 근무
              </th>
              <th scope="col" className="w-[140px] px-[10px] text-center font-medium">
                이번 주 근무
              </th>
              <th scope="col" className="pr-[10px] pl-[36px] font-medium">
                처리
              </th>
            </tr>
          </thead>
          <tbody>
            {data.staff.map((s) => {
              const status = copyStatus(s);
              return (
                <tr key={s.staffMemberId} className="h-[42px] border-b border-erp-thead-line">
                  <td className="truncate px-[10px]">{s.name}</td>
                  <td className="px-[10px] text-center tabular-nums">{totalsLabel(s.source)}</td>
                  <td className="px-[10px] text-center tabular-nums">{totalsLabel(s.copied)}</td>
                  <td className="pr-[10px] pl-[36px]">
                    <Badge tone={status.kind === "excluded" ? "closed" : "on"}>{status.label}</Badge>
                    {status.detail && <span className="ml-[8px] text-[13px] text-erp-label">{status.detail}</span>}
                  </td>
                </tr>
              );
            })}
            {data.newcomers.map((s) => (
              <tr key={s.staffMemberId} className="h-[42px] border-b border-erp-thead-line">
                <td className="truncate px-[10px]">{s.name}</td>
                <td className="px-[10px] text-center text-erp-muted">-</td>
                <td className="px-[10px] text-center text-erp-muted">-</td>
                <td className="pr-[10px] pl-[36px]">
                  {/* 지난 주에 근무가 없어 복사하지 않는 직원 — 꼬리표로 이유만 — 할 일은 아래 안내 박스가 말한다(2026-11-05 사용자 지정, 3팀 확인 필요 — 전엔 「지난 주 없음 · 따로 넣는다」) */}
                  <Badge tone="closed">지난 주 근무 없음</Badge>
                </td>
              </tr>
            ))}
            {data.staff.length + data.newcomers.length === 0 && (
              <tr>
                {/* 빈 표 문구는 다른 목록처럼 가운데 14px 회색(2026-11-05 사용자 지정, 3팀 확인 필요) */}
                <td colSpan={4} className="px-[10px] py-[28px] text-center text-erp-label">
                  지난 주에 등록된 근무스케줄이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        // 복사가 실패한 뒤 화면을 새로 받으면 미리보기도 같은 409 문장이 된다 — 아래 실패 문장이 있으면 두 번 적지 않는다(front #96 리뷰)
        !error && (
          <p role="alert" className={NOTE}>
            {"error" in preview ? preview.error : ""}
          </p>
        )
      )}
      {error && (
        <p role="alert" className={NOTE}>
          {error}
        </p>
      )}
      {/* 작은 회색 한 줄 대신 등록 패널과 같은 안내 박스 — 주어 · 동사를 갖춘 문장(2026-11-05 사용자 지정, 3팀 확인 필요) */}
      <GuideBand
        title="지난 주 복사"
        lines={[
          "관리자가 [복사]를 누르면 지난 주 근무스케줄이 이번 주에 바로 등록됩니다.",
          "지난 주 근무가 없는 직원은 복사 대상에서 제외됩니다. 해당 직원은 [근무스케줄 등록]에서 직접 등록합니다.",
          <>
            복사한 근무스케줄은 해당 <u>직원의 근무 앱</u>과 <u>이메일</u>로 알림이 발송됩니다.
          </>,
        ]}
      />
    </section>
  );
}
