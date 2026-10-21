# ── build: 개발 의존성까지 설치해 빌드한다 ──
FROM node:24-slim AS build
WORKDIR /app
RUN npm install -g pnpm@11.18.0
ENV NEXT_TELEMETRY_DISABLED=1

# 의존성 파일만 먼저 복사해, 소스만 바뀐 빌드는 install 층을 캐시에서 쓴다.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── prod-deps: 운영 의존성만 남긴다 ──
FROM build AS prod-deps
RUN pnpm prune --prod

# ── runtime ──
FROM node:24-slim
# next start 는 dev · prod 프로파일 모두 NODE_ENV=production 으로 돈다. 프로파일 차이는 마운트하는 값 파일뿐이다.
# PORT 는 컨테이너 안에서 고정하고, 밖의 포트는 docker run -p 로 프로파일마다 정한다.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
WORKDIR /app
COPY --from=build /app/package.json /app/next.config.ts ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
USER node
EXPOSE 3000
# next start 가 /app/.env.production 을 읽는다 — 배포 때 그 경로에 읽기 전용으로 마운트한다.
CMD ["node_modules/.bin/next", "start"]
