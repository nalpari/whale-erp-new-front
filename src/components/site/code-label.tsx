"use client";

import { labelOf } from "@/lib/enums";
import { useCodes } from "./session-gate";

// 공통코드 값의 한글 — 로그인 정보의 이 탭 BP 공통코드(useCodes)에서 읽는다. front 에 상수 대응표를 두지 않는다(네이밍 규칙 화면 문구).
// 목록에 없으면(사용하지 않는 코드 · 새 값) 값을 그대로 보인다. 클라이언트 컴포넌트라 서버 컴포넌트 안에도 그대로 둘 수 있다.

export function CodeLabel({ group, value }: { group: string; value: string }) {
  return labelOf(useCodes(group), value);
}

/** 문구 · 속성처럼 글자가 필요한 곳에서 쓴다. */
export function useCodeLabel(group: string): (value: string) => string {
  const codes = useCodes(group);
  return (value) => labelOf(codes, value);
}
