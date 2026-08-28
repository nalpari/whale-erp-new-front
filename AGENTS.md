<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## okf/

`okf/`는 이 저장소의 OKF v0.2 지식 번들이다. 코드를 수정했을 때, 그 파일이 어떤
concept의 `sources[].resource`에 들어 있으면 해당 concept 본문을 고치고
`generated.at`을 갱신한 뒤 `okf/log.md`에 한 줄 남긴다. 해당 없으면 건드리지 않는다.
