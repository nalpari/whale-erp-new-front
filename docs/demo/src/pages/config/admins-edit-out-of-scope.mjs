// BP 관리자 수정 — 내 관리 범위 밖에 이미 매핑된 점포가 있는 계정(hghr). 관리 범위가 일부 점포인 사람이 고칠 때만 생긴다 —
// 데모 헤더는 BP 마스터지만 그 경우를 보이려고 둔 견본이다. 범위 밖 점포는 칩이 아니라 아래 읽기 전용 표로 보인다(앱 admin-form-panel.tsx).
import { render } from "./admins.mjs";

export default (ctx) =>
  render(ctx, {
    title: "BP 관리자 관리 · 수정 · 범위 밖 매핑",
    edit: { outOfScope: [["모리커피 을지로점", "ST000005", "운영"], ["모리커피 연남점", "ST000006", "운영"]] },
    open: ["admin-open-hghr", "admin-edit-open"],
  });
