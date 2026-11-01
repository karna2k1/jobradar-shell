# jobradar-shell

JobRadar host app (React 18, TypeScript, Vite 8, Module Federation, port 3000): login/register, layout and routing, the **kanban board** (dnd-kit, optimistic moves) and the **profile** page (React Hook Form + Zod, resume upload). Loads `jobs-feed-mfe` and `insights-mfe` at runtime and exposes the shared UI kit as `shell/ui`.

Auth: Zustand store; Axios interceptors attach the access token and refresh it once on 401 (single-flight, because the refresh token rotates).

```bash
npm ci
npm run build && npm run preview   # http://localhost:3000 (remotes on 3001 / 3002)
npm test
```

Env: see `.env.example` (API and remote URLs).
