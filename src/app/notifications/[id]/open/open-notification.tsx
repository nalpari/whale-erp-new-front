"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, useAction } from "@/components/common";
import { useAllMenus, useService } from "@/components/site/session-gate";
import { serviceOfPath } from "@/lib/menus";
import { openAction } from "../../actions";

// 화면에 실제로 뜬 뒤에만 읽음 처리하고 업무 화면으로 보낸다. 프리렌더 중이면 보일 때까지 기다린다 — 브라우저가 링크를
// 미리 불러 둔 것만으로 읽음이 되면 안 된다(2026-10-13 종 팝오버를 지나가며 읽음이 된 일). 개발 모드의 effect 두 번은 ref 로 막는다.
export function OpenNotification({ id }: { id: number | null }) {
  const router = useRouter();
  const started = useRef(false);
  const open = useAction(openAction, { overlay: false });
  const service = useService();
  const menus = useAllMenus();
  // 웨일ERP 탭에서 연 플랫폼 화면 알림의 갈 곳 — 있으면 안내와 [플랫폼관리에서 열기]를 보인다
  const [platformTarget, setPlatformTarget] = useState<string | null>(null);

  useEffect(() => {
    const go = async () => {
      if (started.current) return;
      started.current = true;
      const target = id === null ? "/notifications?gone=1" : await open(id);
      if (typeof target !== "string") return; // 만료면 useAction 이 팝업을 띄워 여기까지 오지 않는다
      // 알림은 로그인한 계정의 것이라, 플랫폼 계정이 BP 를 골라 연 웨일ERP 탭에서도 플랫폼 업무(문의사항 · 도입문의 접수 등) 알림이 온다.
      // 그 화면은 이 탭의 메뉴에 없어 그대로 가면 「접근 권한이 없는 메뉴입니다.」로 막혔다(2026-11-13 사용자 지적, 통합테스트).
      // 헤더의 「플랫폼관리」 바로가기처럼 새 탭으로 열어야 하는데, 읽음 처리를 기다린 뒤라 바로 window.open 하면 팝업 차단에 걸린다 —
      // 안내와 버튼을 보이고 사용자가 누를 때 연다. 이 탭을 플랫폼으로 바꾸지 않는다(뒤로 가기마다 앞서 본 ERP 화면이 막힌다).
      if (service === "WHALE_ERP" && serviceOfPath(menus, target) === "PLATFORM") {
        setPlatformTarget(target);
        return;
      }
      router.replace(target);
    };
    const doc = document as Document & { prerendering?: boolean };
    if (!doc.prerendering) {
      void go();
      return;
    }
    doc.addEventListener("prerenderingchange", go, { once: true });
    return () => doc.removeEventListener("prerenderingchange", go);
  }, [id, router, open, service, menus]);

  if (platformTarget)
    return (
      <div className="flex flex-col items-start gap-[12px] p-[24px] text-[14px] text-erp-ink">
        <p>플랫폼관리 화면의 알림입니다. 플랫폼관리를 새 탭으로 열어 확인해 주세요.</p>
        <div className="flex gap-[6px]">
          <Button onClick={() => window.open(platformTarget, "_blank", "noopener")}>플랫폼관리에서 열기</Button>
          <Button variant="off" href="/notifications">
            알림함으로
          </Button>
        </div>
      </div>
    );
  return <p className="p-[24px] text-[14px] text-erp-muted">알림을 여는 중입니다…</p>;
}
