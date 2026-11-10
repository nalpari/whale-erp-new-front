// 수리 이력 수정. 목업 docs/mockup/stores/repairs-edit.html — 등록 화면과 같은 칸 · 같은 입력 규칙이고,
// 대상(점포 · 그룹 · 분류 · 시설물·장비)은 읽기 전용이다. 대상이 보관 · 폐기가 돼도 이 이력은 고칠 수 있다(수리 이력 정책서 PL-1).
import { render } from "./repairs-new.mjs";

export default (ctx) => render(ctx, { mode: "edit" });
