# threads-affiliate

Finds Shopee Malaysia affiliate products, drafts Threads posts with an LLM, queues them for **human approval**, publishes through the **official Threads API**, and tracks clicks and conversions to show what converts.

> Work in progress. Phase 1 (scaffold, schema, Docker, CI) is done. See the roadmap below.

## Ground rules baked into the code

- Official Meta Threads API only. No browser automation, no private APIs.
- No auto-follow, auto-like or auto-comment on anyone else's posts.
- Every post needs a human approval stamp, enforced by a Postgres `CHECK` constraint, not just the UI.
- Every affiliate post carries a commission disclosure.
- Secrets live in `.env` (never committed), and the logger redacts tokens.

## Stack

Node 24 (runs TypeScript natively, no build step) · Fastify · PostgreSQL + Drizzle · Redis + BullMQ · React + Vite · Docker Compose · GitHub Actions · pino

## Quick start

```bash
cp .env.example .env          # change HOST_PORT if 3000 is taken
docker compose up -d --build --wait
curl localhost:3000/health    # {"status":"ok","checks":{"db":"ok","redis":"ok"}}
```

Local dev without containers for the app (Postgres/Redis still from compose):

```bash
docker compose up -d postgres redis
npm install
npm run migrate -w server
npm run dev -w server         # API on :3000
npm run dev -w web            # dashboard on :5173
```

Checks: `npm run lint && npm run typecheck && npm test`. With `DATABASE_URL` set, `npm test` also runs the DB integration tests.

## Layout

```
server/src/    config.ts (zod-validated env) · logger.ts · deps.ts · http/ · db/ · server.ts · worker.ts
server/drizzle/ generated SQL migrations (CI fails if they drift from schema.ts)
web/           React dashboard
```

## Roadmap

1. ~~Scaffold, schema, Docker, CI~~
2. Shopee Affiliate client (with a mock mode) + product sourcing job
3. AI copy + 4:5 card rendering + approval queue UI
4. Threads OAuth, publishing worker with quota guard, link-in-first-reply, token refresh
5. Short-link redirect + click tracking
6. Insights polling + analytics + A/B results
7. Docs polish

## Credits

Inspired by [nerin81-netizen/threads-affiliate-automation](https://github.com/nerin81-netizen/threads-affiliate-automation) (MIT). This project is a from-scratch rewrite: Shopee instead of Toss, official API only, and no engagement automation.
