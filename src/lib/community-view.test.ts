// node --test src/lib/community-view.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseInquiryQuery,
  parsePostQuery,
  postFields,
  queryString,
  sizeLabel,
  validatePost,
  type PostForm,
} from "./community-view.ts";

const notice = (over: Partial<PostForm> = {}): PostForm => ({
  kind: "NOTICE",
  title: "9월 정기 점검 안내",
  body: "새벽 2시부터 5시까지",
  noticeType: "MAINTENANCE",
  isPinned: true,
  publishStartDate: "2026-09-05",
  publishEndDate: "2026-09-14",
  faqCategoryCode: "",
  audiences: ["GUEST", "MEMBER"],
  ...over,
});
const faq = (over: Partial<PostForm> = {}): PostForm => notice({ kind: "FAQ", noticeType: "", faqCategoryCode: "STAFF_LABOR", ...over });

test("parsePostQuery — 이상한 값은 기본값(1쪽 · 20건 · 전체)으로", () => {
  assert.deepEqual(parsePostQuery({}), { page: 1, pageSize: 20, status: "" });
  assert.deepEqual(parsePostQuery({ page: "3", pageSize: "50", status: "PRIVATE" }), { page: 3, pageSize: 50, status: "PRIVATE" });
  assert.deepEqual(parsePostQuery({ page: "0", pageSize: "30", status: "x" }), { page: 1, pageSize: 20, status: "" });
  assert.equal(parsePostQuery({ page: "10000001" }).page, 1);
});

test("parseInquiryQuery — 검색어는 다듬고 api 한도로 자른다", () => {
  const q = parseInquiryQuery({ title: "  주휴수당 ", sender: "가".repeat(150), answerStatus: "WAITING" });
  assert.equal(q.title, "주휴수당");
  assert.equal(q.sender.length, 100);
  assert.equal(q.answerStatus, "WAITING");
});

test("queryString — 빈 값과 기본값은 싣지 않는다", () => {
  assert.equal(queryString({ page: 1, pageSize: 20, status: "" }), "");
  assert.equal(queryString({ page: 2, pageSize: 50, answerStatus: "ANSWERED", title: "a b" }), "?page=2&pageSize=50&answerStatus=ANSWERED&title=a+b");
});

test("validatePost — 맞으면 빈 목록", () => {
  assert.deepEqual(validatePost(notice(), "PUBLISHED", 0, []), []);
  assert.deepEqual(validatePost(faq(), "PUBLISHED", 0, []), []);
});

test("validatePost — 게시만 노출 대상이 있어야 한다", () => {
  assert.deepEqual(validatePost(notice({ audiences: [] }), "PUBLISHED", 0, []), ["게시하려면 노출 대상을 하나 이상 골라 주세요"]);
  assert.deepEqual(validatePost(notice({ audiences: [] }), "DRAFT", 0, []), []);
});

test("validatePost — 공지는 유형, FAQ 는 카테고리가 필수", () => {
  assert.deepEqual(validatePost(notice({ noticeType: "" }), "DRAFT", 0, []), ["공지사항 유형을 골라 주세요"]);
  assert.deepEqual(validatePost(faq({ faqCategoryCode: "" }), "DRAFT", 0, []), ["FAQ 카테고리를 골라 주세요"]);
});

test("validatePost — 제목 · 본문 공백과 길이", () => {
  assert.deepEqual(validatePost(notice({ title: " ", body: "\n" }), "DRAFT", 0, []), ["제목을 입력해 주세요", "본문을 입력해 주세요"]);
  assert.equal(validatePost(notice({ title: "a".repeat(201) }), "DRAFT", 0, []).length, 1);
});

test("validatePost — 게시 종료일이 시작일보다 앞서면 막는다(FAQ 는 기간을 보지 않는다)", () => {
  const swapped = { publishStartDate: "2026-09-14", publishEndDate: "2026-09-05" };
  assert.deepEqual(validatePost(notice(swapped), "DRAFT", 0, []), ["게시 종료일이 시작일보다 앞설 수 없습니다"]);
  assert.deepEqual(validatePost(faq(swapped), "DRAFT", 0, []), []);
});

test("validatePost — 첨부는 남는 것 + 더하는 것 5개, 종류 · 크기", () => {
  const ok = { name: "a.PDF", size: 1024 };
  assert.deepEqual(validatePost(notice(), "DRAFT", 4, [ok]), []);
  assert.equal(validatePost(notice(), "DRAFT", 4, [ok, ok]).length, 1);
  assert.deepEqual(validatePost(notice(), "DRAFT", 0, [{ name: "a.gif", size: 1 }]), ["a.gif: JPG · PNG · PDF 만 올릴 수 있습니다"]);
  assert.deepEqual(validatePost(notice(), "DRAFT", 0, [{ name: "a.jpg", size: 10 * 1024 * 1024 + 1 }]), ["a.jpg: 파일 하나는 10MB 까지 올릴 수 있습니다"]);
});

test("postFields — 공지 칸은 공지에만, 노출 대상은 이름을 되풀이", () => {
  assert.deepEqual(postFields(notice(), "PUBLISHED"), [
    ["title", "9월 정기 점검 안내"],
    ["body", "새벽 2시부터 5시까지"],
    ["status", "PUBLISHED"],
    ["audiences", "GUEST"],
    ["audiences", "MEMBER"],
    ["noticeType", "MAINTENANCE"],
    ["isPinned", "true"],
    ["publishStartDate", "2026-09-05"],
    ["publishEndDate", "2026-09-14"],
  ]);
  const fields = postFields(faq({ audiences: [] }), "DRAFT");
  assert.deepEqual(fields.at(-1), ["faqCategoryCode", "STAFF_LABOR"]);
  assert.ok(!fields.some(([k]) => k === "isPinned" || k === "audiences"));
});

test("sizeLabel", () => {
  assert.equal(sizeLabel(10), "1KB");
  assert.equal(sizeLabel(2048), "2KB");
  assert.equal(sizeLabel(3.5 * 1024 * 1024), "3.5MB");
});
