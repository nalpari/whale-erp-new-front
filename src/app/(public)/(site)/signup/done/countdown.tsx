"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}분 ${String(s).padStart(2, "0")}초`;
}

// 가입완료 쿠키(signup-done-cookie.ts)가 실제로 몇 초 뒤에 사라지는지 보여준다 — "10분 동안만 열립니다"라고만
// 적어두면 공용 PC에서 지금 몇 분이나 남았는지 몰라 자리를 오래 비울 수 있다(2026-10-15 코드리뷰). 0 이 되면
// 로그인으로 보낸다 — 쿠키도 같은 시각에 만료되니 새로고침해도 어차피 로그인으로 가지만, 기다리지 않고 바로 보낸다.
export function Countdown({ initialSeconds }: { initialSeconds: number }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      router.replace("/login");
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, router]);

  return <span className="font-semibold">{format(seconds)}</span>;
}
