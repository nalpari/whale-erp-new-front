// node --test src/lib/expiry-guard.test.ts
// 로그인 만료 규칙 지키기(AGENTS.md 「로그인 만료」). 화면 코드는 401 을 다루지 않고, 만료는 공통 길목이 처리한다.
// 이 시험은 src 코드를 구문 분석해 길목을 거치지 않는 코드를 찾는다. 새 화면이 규칙을 어기면 여기서 실패한다.
// 허용 목록은 401 의 뜻이 만료가 아니거나(비밀번호 · 탈퇴 최종 · 카카오 키) 길목 자체인 파일뿐이다 — 늘리기 전에 이유를 적는다.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import ts from "typescript";

const SRC = join(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name) && !/\.test\.ts$/.test(name) && !name.endsWith(".generated.ts")) out.push(p);
  }
  return out;
}
const rel = (p: string) => relative(SRC, p).replace(/\\/g, "/");
const FILES = walk(SRC).filter((p) => !rel(p).startsWith("app/design/"));
const text = new Map(FILES.map((p) => [rel(p), readFileSync(p, "utf8")]));
const parsed = new Map<string, ts.SourceFile>();
const sourceOf = (file: string) => {
  let sf = parsed.get(file);
  if (!sf) parsed.set(file, (sf = ts.createSourceFile(file, text.get(file)!, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS)));
  return sf;
};
const directive = (file: string) => (/^["']use (server|client)["']/m.exec(text.get(file)!)?.[1] ?? null) as "server" | "client" | null;
const lineOf = (sf: ts.SourceFile, node: ts.Node) => `${sf.fileName}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
function visit(node: ts.Node, fn: (n: ts.Node) => void) {
  fn(node);
  node.forEachChild((c) => visit(c, fn));
}

/** 로그인 전 화면 · 로그아웃 — 로그인 세션이 없거나 401 의 뜻이 다르다 */
const PUBLIC = [/^app\/\(public\)\//, /^lib\/terms-actions\.ts$/, /^components\/site\/terms-/];
const isPublic = (file: string) => PUBLIC.some((r) => r.test(file));

/** import 경로를 src 기준 파일로 */
function resolveImport(from: string, spec: string): string | null {
  const base = spec.startsWith("@/") ? spec.slice(2) : spec.startsWith(".") ? relative(SRC, join(SRC, dirname(from), spec)).replace(/\\/g, "/") : null;
  if (base === null) return null;
  for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (text.has(base.replace(/\.ts$/, "") + ext) || text.has(base + ext)) return text.has(base + ext) ? base + ext : base.replace(/\.ts$/, "") + ext;
  return null;
}

// ── G1. 화면 코드에 401 분기가 없다 ───────────────────────────────────────────
/** 401 을 다뤄도 되는 곳 — 길목 자체이거나 401 의 뜻이 만료가 아니다 */
const G1_ALLOW = new Set([
  "proxy.ts", // 길목: 갱신 401 → 로그인 화면
  "lib/api.ts", // 길목: request() 의 만료 판정
  "lib/bff.ts", // 길목: BFF 401 → 팝업
  "lib/action-failure.ts", // 길목: expiredFailureOf · 공통 failureOf
  "app/api/[...path]/route.ts", // 길목: BFF 401 · 쿠키 삭제
  "lib/use-load.ts", // bff() 가 팝업을 띄운 BffError(401) — 실패 문구를 그리지 않는다
  "components/site/session-gate.tsx", // 첫 준비 401 은 로그인 화면으로, 맞추기 401 은 멈춤(팝업은 bff())
  "app/excel-downloads/[id]/excel-download-view.tsx", // bff() 가 팝업을 띄운 BffError(401) — 실패 화면을 그리지 않는다
  "lib/address-search.ts", // 카카오 · 행정안전부 키 오류 401(로그인과 무관)
  "lib/withdrawal-form.ts", // 탈퇴 최종 제출의 401 = 이미 탈퇴돼 세션이 끊김(만료 제외 경로)
  "components/site/withdraw-panel.tsx", // 위 결과로 로그아웃
  "components/site/force-password-dialog.tsx", // 강제 변경의 401 = 발급 비밀번호 만료
  "app/actions.ts", // 강제 비밀번호 변경 · 로그아웃(만료 제외 경로)
  // 3차: fetch 를 직접 쓰는 업로드 · 받기 창구와 그 화면 — bff 계열 도우미로 옮길 때 뺀다
  "app/platform-notices/save/route.ts",
  "app/support-inquiries/save/route.ts",
  "app/contracts/paper/route.ts",
  "app/contracts/[contractId]/documents/[contractDocumentId]/route.ts",
  "components/community/post-form.tsx",
  "components/support/inquiry-form.tsx",
  "components/support/support-detail.tsx",
  "components/common/excel-download.tsx",
  "app/contracts/new/contract-form.tsx",
  "app/staff-members/export/export-screen.tsx",
]);
const IS_401 = /\bstatus\s*[!=]==\s*401\b|\b401\s*[,\]][^\n]*\]\.includes\(|\.includes\([^)]*\)\s*&&[^\n]*401|\[[^\]\n]*\b401\b[^\]\n]*\]\.includes\(/;

test("G1 화면 · 액션 코드는 401 을 다루지 않는다 — 만료는 길목이 처리한다", () => {
  const found: string[] = [];
  for (const [file, src] of text) {
    if (G1_ALLOW.has(file) || isPublic(file) || file.startsWith("lib/session-expiry") || file === "lib/auth-routes.ts") continue;
    src.split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      if (IS_401.test(line)) found.push(`${file}:${i + 1}  ${line.trim().slice(0, 100)}`);
    });
  }
  assert.deepEqual(found, [], "401 분기를 지우세요. 만료는 expiredFailureOf · useAction · bff() · request() 가 처리합니다(AGENTS.md 「로그인 만료」)");
});

// ── G2. 서버 액션의 실패 처리는 만료를 먼저 거른다 ──────────────────────────────
/** 만료를 거르는 함수 — 이 이름을 부르면 통과다 */
const EXPIRY_AWARE = new Set(["expiredFailureOf", "actionFailure"]);
/** 함수 본문이 만료를 거르는가(같은 파일 · import 한 파일의 함수, 한 단계만 따라간다) */
function functionAware(file: string, name: string, seen = new Set<string>()): boolean {
  const key = `${file}#${name}`;
  if (seen.has(key)) return false;
  seen.add(key);
  if (EXPIRY_AWARE.has(name)) return true;
  const sf = sourceOf(file);
  let body: ts.Node | undefined;
  visit(sf, (n) => {
    if (body) return;
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) body = n.body;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) body = n.initializer;
  });
  if (body) return callsAware(file, body, seen);
  // import 한 이름이면 그 파일에서 찾는다(as 로 바꾼 이름도)
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
    for (const el of st.importClause.namedBindings.elements) {
      if (el.name.text !== name) continue;
      const target = resolveImport(file, (st.moduleSpecifier as ts.StringLiteral).text);
      const original = el.propertyName?.text ?? el.name.text;
      if (EXPIRY_AWARE.has(original)) return true;
      if (original === "failureOf" && target === "lib/action-failure.ts") return true;
      return target ? functionAware(target, original, seen) : false;
    }
  }
  return false;
}
function callsAware(file: string, node: ts.Node, seen = new Set<string>()): boolean {
  let aware = false;
  visit(node, (n) => {
    if (aware || !ts.isCallExpression(n) || !ts.isIdentifier(n.expression)) return;
    if (functionAware(file, n.expression.text, seen)) aware = true;
  });
  return aware;
}
/** 만료 제외 경로를 부르는 액션 — 401 의 뜻이 만료가 아니다(session-expiry.ts NOT_EXPIRY) */
const G2_ALLOW = new Set(["components/site/withdraw-actions.ts#createWithdrawalAction"]);

test("G2 서버 액션의 catch 는 만료를 먼저 거른다(expiredFailureOf)", () => {
  const found: string[] = [];
  for (const file of text.keys()) {
    if (directive(file) !== "server" || isPublic(file) || file === "app/actions.ts") continue;
    const sf = sourceOf(file);
    visit(sf, (n) => {
      if (!ts.isCatchClause(n)) return;
      // 잡은 오류로 결과를 만들어 돌려주는 catch 만 본다(화면 갱신 실패처럼 오류와 상관없는 값을 돌려주는 catch 는 화면 결과가 아니다)
      const caught = n.variableDeclaration?.name.getText();
      let returns = false;
      visit(n.block, (m) => {
        if (ts.isReturnStatement(m) && caught && m.expression && new RegExp(`\\b${caught}\\b`).test(m.expression.getText())) returns = true;
      });
      if (!returns) return;
      let owner: ts.Node | undefined = n.parent;
      while (owner && !ts.isFunctionDeclaration(owner)) owner = owner.parent;
      const ownerName = owner && ts.isFunctionDeclaration(owner) ? owner.name?.text : undefined;
      if (ownerName && G2_ALLOW.has(`${file}#${ownerName}`)) return;
      if (!callsAware(file, n.block)) found.push(lineOf(sf, n));
    });
  }
  assert.deepEqual(found, [], "catch 첫 줄에서 `const expired = expiredFailureOf(error); if (expired) return expired;` 로 만료를 거르세요");
});

// ── G3. 서버 화면의 catch 는 만료 이동을 삼키지 않는다 ──────────────────────────
const isServerRender = (file: string) =>
  directive(file) === null && (/^app\/.*\/(page|layout)\.tsx$/.test(file) || /^app\/.*\/load-[\w-]+\.ts$/.test(file) || /^components\/community\/(post-page|inquiry-page|list-load)\.tsx$/.test(file));

/** 다시 던지거나 unstable_rethrow 를 부르면 이동 신호를 삼키지 않는다 */
function rethrows(body: ts.Node): boolean {
  let ok = false;
  visit(body, (n) => {
    if (ts.isThrowStatement(n)) ok = true;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ["unstable_rethrow", "notFound"].includes(n.expression.text)) ok = ok || n.expression.text === "unstable_rethrow";
  });
  return ok;
}
/** getEnum 만 감싼 catch — enum 은 request() 를 거치지 않아 만료 이동이 없다 */
const onlyEnum = (node: ts.Node) => /\bgetEnum\(/.test(node.getText()) && !/\b(request|send|get[A-Z]\w*(?<!Enum))\(/.test(node.getText().replace(/getEnum\(/g, ""));

test("G3 서버 화면의 catch 는 로그인 만료 이동을 삼키지 않는다(unstable_rethrow)", () => {
  const found: string[] = [];
  for (const file of text.keys()) {
    if (!isServerRender(file) || isPublic(file)) continue;
    const sf = sourceOf(file);
    visit(sf, (n) => {
      if (ts.isTryStatement(n) && n.catchClause && !rethrows(n.catchClause.block) && !onlyEnum(n.tryBlock)) found.push(lineOf(sf, n.catchClause));
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === "catch" && n.arguments[0]) {
        const handler = n.arguments[0];
        const body = ts.isArrowFunction(handler) || ts.isFunctionExpression(handler) ? handler.body : null;
        // 이름으로 넘긴 처리 함수(listDenied 등)는 그 본문을 본다
        const named = ts.isIdentifier(handler) ? findLocal(sf, handler.text) : null;
        const target = body ?? named;
        if (target && !rethrows(target) && !onlyEnum(n.expression.expression)) found.push(lineOf(sf, n));
      }
    });
  }
  assert.deepEqual(found, [], "모든 오류를 받아 대체값으로 바꾸는 catch 첫 줄에 unstable_rethrow(error) 를 두세요 — request() 의 만료 이동을 삼킵니다");
});
function findLocal(sf: ts.SourceFile, name: string): ts.Node | null {
  let found: ts.Node | null = null;
  visit(sf, (n) => {
    if (found) return;
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) found = n.body ?? null;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.name.text === name && n.initializer) found = n.initializer;
  });
  return found;
}

// ── G4. 서버 액션은 useAction 으로 부른다 ──────────────────────────────────────
/** 로그아웃(signOut 이 부른다) · 강제 비밀번호 변경(만료 제외)은 useAction 밖이다 */
const G4_ALLOW_ACTIONS = new Set(["app/actions.ts"]);

test("G4 화면은 서버 액션을 useAction 으로 부른다 — 만료 결과를 팝업으로 바꾸는 길목이다", () => {
  const found: string[] = [];
  for (const file of text.keys()) {
    if (directive(file) !== "client" || isPublic(file)) continue;
    const sf = sourceOf(file);
    const actions = new Set<string>();
    for (const st of sf.statements) {
      if (!ts.isImportDeclaration(st) || st.importClause?.isTypeOnly || !st.importClause?.namedBindings || !ts.isNamedImports(st.importClause.namedBindings)) continue;
      const target = resolveImport(file, (st.moduleSpecifier as ts.StringLiteral).text);
      if (!target || directive(target) !== "server" || G4_ALLOW_ACTIONS.has(target) || isPublic(target)) continue;
      for (const el of st.importClause.namedBindings.elements) if (!el.isTypeOnly) actions.add(el.name.text);
    }
    if (!actions.size) continue;
    visit(sf, (n) => {
      if (!ts.isIdentifier(n) || !actions.has(n.text)) return;
      const p = n.parent;
      if (ts.isImportSpecifier(p) || ts.isTypeQueryNode(p)) return;
      // useAction(액션, …) 의 첫 인자이거나, useAction 에 넘긴 함수 안이면 통과
      let a: ts.Node | undefined = n;
      while (a && !(ts.isCallExpression(a) && ts.isIdentifier(a.expression) && a.expression.text === "useAction")) a = a.parent;
      if (!a) found.push(`${lineOf(sf, n)}  ${n.text}`);
    });
  }
  assert.deepEqual(found, [], "서버 액션을 useAction(액션, { overlay: false }) 로 감싸 부르세요 — 로그인 만료면 팝업을 띄웁니다");
});
