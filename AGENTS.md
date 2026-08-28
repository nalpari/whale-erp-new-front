<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## okf/

`okf/`는 이 저장소의 OKF v0.2 지식 번들이다. 코드를 수정했을 때, 그 파일이 어떤
concept의 `sources[].resource`에 들어 있으면 해당 concept 본문을 고치고
`generated.at`을 갱신한 뒤 `okf/log.md`에 한 줄 남긴다. 해당 없으면 건드리지 않는다.

## 워크트리

워크트리는 저장소 안이 아니라 플랫폼별 루트 아래에 만든다.

| 플랫폼 | 루트 |
|---|---|
| Windows | `C:\workspace\.whale-erp-worktrees\` |
| macOS / Linux | `~/.whale-erp-worktrees/` |

이름은 포켓몬 이름(소문자, 영문)으로 짓는다. `git worktree list` 로 이미 쓰는
이름을 피한다. 특별한 주문이 없으면 항상 `main` 을 기준으로 분기한다 (현재
체크아웃된 브랜치가 아니라).

```bash
git worktree add ~/.whale-erp-worktrees/pikachu -b feat/some-branch main
cp .env* ~/.whale-erp-worktrees/pikachu/ 2>/dev/null   # Windows: copy .env* <루트>\pikachu\
```

`.env`, `.env.develop`, `.env.production` 등은 git 이 관리하지 않아 새 워크트리에
따라오지 않는다. 서버를 띄우려면 워크트리를 만든 직후 메인 체크아웃에서 복사한다.
