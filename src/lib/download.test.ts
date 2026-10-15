// node --test src/lib/download.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { downloadPercent, errorMessageOf, fileNameOfDisposition } from "./download.ts";

test("실패 문구 — 문자열 · 문장 배열(이어 붙임) · 없으면 기본값", () => {
  assert.equal(errorMessageOf({ message: "엑셀은 1분에 한 번" }, "기본"), "엑셀은 1분에 한 번");
  assert.equal(errorMessageOf({ message: ["statuses 형식", "storeTypes 형식"] }, "기본"), "statuses 형식, storeTypes 형식");
  assert.equal(errorMessageOf({ message: "  " }, "기본"), "기본");
  assert.equal(errorMessageOf(null, "기본"), "기본");
});

test("파일 이름 — UTF-8 한글 이름 · 따옴표 이름 · 없으면 기본값", () => {
  assert.equal(fileNameOfDisposition("attachment; filename*=UTF-8''%EC%A0%90%ED%8F%AC%EB%AA%A9%EB%A1%9D_20261014.xlsx", "x.xlsx"), "점포목록_20261014.xlsx");
  assert.equal(fileNameOfDisposition('attachment; filename="stores.xlsx"', "x.xlsx"), "stores.xlsx");
  assert.equal(fileNameOfDisposition("attachment; filename*=UTF-8''%E0%A4", "x.xlsx"), "x.xlsx");
  assert.equal(fileNameOfDisposition(null, "x.xlsx"), "x.xlsx");
});

test("받은 비율 — 전체 크기를 모르면 null, 100 을 넘지 않는다", () => {
  assert.equal(downloadPercent(62, 100), 62);
  assert.equal(downloadPercent(150, 100), 100);
  assert.equal(downloadPercent(10, 0), null);
  assert.equal(downloadPercent(10, Number.NaN), null);
});
