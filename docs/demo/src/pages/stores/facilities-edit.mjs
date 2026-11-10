// 시설물 및 장비 수정. 목업 docs/mockup/stores/facilities-edit.html — 등록 화면과 같은 칸 · 같은 입력 규칙이고,
// 점포는 읽기 전용, 미사용 분류는 지금 값으로 남고, 관리 정보 삭제가 있다(정책서 PL-1 · PL-3 · PL-4).
import { render } from "./facilities-new.mjs";

export default (ctx) => render(ctx, { mode: "edit" });
