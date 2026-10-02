// 커뮤니티관리 › 도입문의 — 플랫폼 헤더 메뉴 커뮤니티관리 › 도입문의.
import * as ui from "../../ui.mjs";
import { communitySections } from "../../community-sections.mjs";
import { platformHeader } from "../../site.mjs";

export default ({ A, R }) => {
  const { filter, content } = communitySections({ A, R }).leads;
  return { title: "도입문의", html: ui.erpFrame({ header: platformHeader(A, R), title: "도입문의", body: ui.listBody(filter, content) }) };
};
