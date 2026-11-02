// 점포 상세 — 미운영 점포(모리커피 청담점 · 사업자 미인증 · 이미지 없음 · 층별 정보 없음). [상태 변경]은 운영 · 폐점을 고르는 라디오와
// 운영 조건 체크리스트, [삭제]는 삭제 확인 창을 연다(앱 store-detail-actions.tsx 와 같다, 2026-10-30). 그리는 것은 detail.mjs 의 render.
import { render } from "./detail.mjs";

export default (ctx) => render(ctx, { code: "ST000007" });
