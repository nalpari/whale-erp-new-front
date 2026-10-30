// BP 관리자 등록 — 아이디 · 이메일이 이미 쓰이는 것. 칸을 벗어나면 확인해 칸 아래에 문구를 단다(앱 bp-admin-form.ts LOGIN_ID_TAKEN · EMAIL_TAKEN).
import { render } from "./admins.mjs";

export default (ctx) =>
  render(ctx, {
    title: "BP 관리자 관리 · 등록 · 중복",
    newOpts: {
      role: "BP관리자",
      group: "고객응대 · BA000006",
      taken: true,
      values: { loginId: "hgcs", name: "문가은", phone: ["010", "3308", "6214"], email: "gaeun.moon@hangang.co.kr" },
    },
    open: ["admin-new-open"],
  });
