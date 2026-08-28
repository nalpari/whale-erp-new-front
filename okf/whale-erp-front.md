---
type: Application
title: Whale ERP Frontend
description: Next.js 16 App Router frontend for Whale ERP.
resource: https://github.com/nalpari/whale-erp-front
tags: [erp, frontend, nextjs]
sources:
  - { id: package-json, resource: ../package.json, title: Dependency manifest }
  - { id: app-dir, resource: ../src/app, title: App Router entry }
generated: { by: claude-code/opus-5, at: 2026-08-28T06:39:16Z }
---

# Stack

| Piece      | Version | Notes                                   |
|------------|---------|-----------------------------------------|
| Next.js    | 16.3.3  | App Router, React Compiler enabled.     |
| React      | 19.2.8  | `react-dom` at the same version.        |
| TypeScript | ^5      | Strict config in `tsconfig.json`.       |
| Tailwind   | ^4      | Via `@tailwindcss/postcss`.             |

# Layout

* `src/app/` - App Router entry (`layout.tsx`, `page.tsx`, `globals.css`).
* `public/` - Static assets served at the site root.

# Commands

```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # eslint
```
