// whale-erp-api 가 커밋한 openapi/openapi.json 에서 요청·응답 타입을 만든다(naming.md 「API 타입·enum 공유」).
// api 저장소 위치는 WHALE_API_DIR, 기본 ../whale-erp-api. 결과는 src/lib/api-types.generated.ts — 손으로 고치지 않는다.
//   pnpm openapi:types
//   WHALE_API_DIR=../../.whale-erp-worktrees/whale-erp-api/petra pnpm openapi:types   (브랜치의 api 로 만들 때)
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import openapiTS, { astToString } from "openapi-typescript";

const apiDir = resolve(process.env.WHALE_API_DIR ?? "../whale-erp-api");
const source = resolve(apiDir, "openapi/openapi.json");
const target = resolve("src/lib/api-types.generated.ts");

const document = JSON.parse(await readFile(source, "utf8"));
const ast = await openapiTS(document);
const header = `// 자동 생성 파일 — 손으로 고치지 않는다. pnpm openapi:types 로 다시 만든다.\n// 원본: whale-erp-api openapi/openapi.json (${document.info?.version ?? ""})\n\n`;
await writeFile(target, header + astToString(ast));
console.log(`${target} ← ${source}`);
