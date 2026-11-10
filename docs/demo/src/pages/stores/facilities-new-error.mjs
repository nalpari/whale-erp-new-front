// 시설물 및 장비 등록 · 입력 오류 — [저장]을 눌러 전화번호 자릿수 · 설치일이 검사에 걸린 견본(정책서 PL-5).
// 걸린 칸 바로 아래 빨간 문구만 보이고 알럿은 띄우지 않는다. 목업 「전화번호 · 날짜 오류」 상태.
import { render } from "./facilities-new.mjs";

export default (ctx) => {
  const page = render(ctx, { errors: true });
  return { ...page, title: "시설물 및 장비 등록 · 입력 오류" };
};
