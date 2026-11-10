// 수리 이력 등록 · 입력 오류 — [저장]을 눌러 수리 일자 · 수리기사 전화번호 · 교체 부품명이 검사에 걸린 견본(수리 이력 정책서 PL-2 · PL-3).
// 걸린 칸 바로 아래 빨간 문구만 보이고 알럿은 띄우지 않는다. 목업 「날짜 · 전화번호 · 부품명 오류」 상태.
import { render } from "./repairs-new.mjs";

export default (ctx) => {
  const page = render(ctx, { errors: true });
  return { ...page, title: "수리 이력 등록 · 입력 오류" };
};
