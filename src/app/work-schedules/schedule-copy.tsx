"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Badge, Button, useToast } from "@/components/common";
import { usePagePermission, useStores } from "@/components/site/session-gate";
import { isClosedStore } from "@/lib/store-scope";
import type { CopyPreview } from "@/lib/work-schedules-api";
import { useFailure } from "../staff-members/[id]/use-action-failure";
import { copyLastWeekAction } from "./actions";
import { useScheduleNavigation } from "./schedule-controls";
import { addDays, type ScheduleQuery } from "./work-schedule-query";
import { copyStatus, totalsLabel } from "./work-schedule-view";

// 지난 주 복사(#204, STAFF-13). 빈 주에서만 켜지고, 누르면 도구 줄 아래에 미리보기를 연다(주소 copy=1 — 서버가 GET /copy-last-week 를 읽는다).
// 원본은 직전 주 고정이고 받을 수 없는 날은 빠진다. 복사하면 바로 반영되고 생긴 직원마다 알림이 한 번 간다(2026-10-08 재영).
// 폐점 점포는 등록과 같이 막는다(운영 정책 ATT-33).

const NOTE = "text-[13px] text-erp-off";

/** 도구 줄 「지난 주 복사」 — 등록 권한이 없으면 두지 않는다. 근무스케줄이 있는 주 · 폐점 점포면 끄고 까닭을 옆에 적는다 */
export function CopyButton({ query, today, weekEmpty }: { query: ScheduleQuery & { storeId: number }; today: string; weekEmpty: boolean }) {
  const navigate = useScheduleNavigation(today);
  const store = useStores().find((s) => s.storeId === query.storeId);
  const closed = !!store && isClosedStore(store);
  if (!usePagePermission().create) return null;
  // 막힌 버튼은 마우스를 받지 않아 title 이 뜨지 않는다 — 까닭은 글자로 둔다. 폐점은 등록 버튼 옆 안내가 함께 말한다
  return (
    <>
      {!weekEmpty && !closed && <span className={NOTE}>이미 근무스케줄이 있는 주 · 덧붙일 때는 여러 명 일괄 등록</span>}
      <Button
        variant="off"
        aria-expanded={query.copy}
        aria-controls="schedule-copy"
        disabled={!weekEmpty || closed}
        onClick={() => navigate({ ...query, copy: !query.copy, history: false })}
      >
        지난 주 복사
      </Button>
    </>
  );
}

/** 미리보기를 받지 못한 까닭. 409(빈 주 아님 · 본사에게 가려진 직원)와 다른 4xx 는 api 문장 그대로 */
export type CopyPreviewResult = CopyPreview | { error: string };

const mmdd = (d: string) => d.slice(5);

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
      <div className="flex items-center gap-[8px]">
        <h2 className="text-[16px] font-semibold">지난 주 복사 · 미리보기</h2>
        <span className="text-[13px] text-erp-label">
          {mmdd(addDays(query.week, -7))} ~ {mmdd(addDays(query.week, -1))} → {mmdd(query.week)} ~ {mmdd(addDays(query.week, 6))}
        </span>
      </div>
      {data ? (
        <table className="w-full border-collapse text-[14px]">
          <thead>
            <tr className="h-[38px] border-y border-erp-thead-line bg-erp-thead-bg text-left text-erp-thead-text">
              <th scope="col" className="px-[10px] font-medium">
                직원
              </th>
              <th scope="col" className="w-[140px] px-[10px] font-medium">
                지난 주
              </th>
              <th scope="col" className="w-[140px] px-[10px] font-medium">
                이번 주
              </th>
              <th scope="col" className="px-[10px] font-medium">
                처리
              </th>
            </tr>
          </thead>
          <tbody>
            {data.staff.map((s) => {
              const status = copyStatus(s);
              return (
                <tr key={s.staffMemberId} className="h-[42px] border-b border-erp-thead-line">
                  <td className="px-[10px]">{s.name}</td>
                  <td className="px-[10px] tabular-nums">{totalsLabel(s.source)}</td>
                  <td className="px-[10px] tabular-nums">{totalsLabel(s.copied)}</td>
                  <td className="px-[10px]">
                    <Badge tone={status.kind === "excluded" ? "closed" : "on"}>{status.label}</Badge>
                    {status.detail && <span className="ml-[8px] text-[13px] text-erp-label">{status.detail}</span>}
                  </td>
                </tr>
              );
            })}
            {data.newcomers.map((s) => (
              <tr key={s.staffMemberId} className="h-[42px] border-b border-erp-thead-line">
                <td className="px-[10px]">{s.name}</td>
                <td className="px-[10px] text-erp-muted">—</td>
                <td className="px-[10px] text-erp-muted">—</td>
                <td className="px-[10px]">
                  <Badge tone="closed">지난 주 없음 · 따로 넣는다</Badge>
                </td>
              </tr>
            ))}
            {data.staff.length + data.newcomers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-[10px] py-[14px] text-erp-label">
                  지난 주에 근무스케줄이 없어 복사할 것이 없습니다.
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
      <div className="flex items-center gap-[6px]">
        <span className="flex-1 text-[13px] text-erp-label">복사하면 바로 반영되고 해당 직원에게 알림이 갑니다.</span>
        <Button variant="off" onClick={close}>
          취소
        </Button>
        {data && (
          <Button onClick={handleCopy} disabled={saving || count === 0}>
            {saving ? "복사 중" : `${count}명 복사`}
          </Button>
        )}
      </div>
    </section>
  );
}
