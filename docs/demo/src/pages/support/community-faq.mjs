// 커뮤니티관리 › FAQ — 플랫폼 헤더 메뉴 커뮤니티관리 › FAQ.
import * as ui from "../../ui.mjs";
import { communitySections } from "../../community-sections.mjs";
import { platformHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const { filter, content } = communitySections({ A, R }).faq;
  return { title: "FAQ", html: ui.erpFrame({ header: platformHeader(A, R), title: "FAQ", body: ui.listBody(filter, content) }) };
};
