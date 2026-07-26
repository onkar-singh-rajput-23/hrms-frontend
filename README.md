# HRMS Frontend

Next.js App Router frontend for the HRMS MVP.

## Architecture

This frontend follows the project layered architecture:

- `app/`: routing only. Route files stay thin and delegate to feature implementations.
- `shared/pages/`: page and feature implementations.
- `shared/components/`: reusable cross-page UI.
- `shared/lib/components/`: lower-level UI primitives.
- `shared/apis/`: API clients and shared request wrappers.
- `shared/types/`: shared TypeScript contracts.
- `client/`: browser-only providers and client infrastructure.
- `server/`: server-only helpers and request context code.
- `public/`: static assets.

## Web and mweb

This project is one Next.js app. It does not have separate desktop web and mobile web apps or
separate builds.

The active surface is carried through `AppData`:

- `server/cookie.ts` reads the request `user-agent`.
- `isMobile` is set from `/mobile/i.test(userAgent)`.
- desktop web uses `clientId = hrmsweb`.
- mobile web uses `clientId = hrmsmweb`.
- `app/layout.tsx` calls `getAppData()` and passes it into `client/AppStore/AppStore.tsx`.
- Client components read it with `useAppData()`.
- API requests include `x-client-id`, `x-api-key`, and `x-app-surface` headers.

Route files should stay thin. When a feature needs different desktop and phone behavior, use the
same route and branch by `isMobile`, keeping the default feature component as mweb and the desktop
component under `Web/`.

```text
app/(app)/dashboard/page.tsx                  # route-level isMobile selector
shared/pages/Dashboard/Dashboard.tsx          # default mweb
shared/pages/Dashboard/Web/DashboardWeb.tsx   # desktop web
```

## Development

```bash
cp .env.example .env
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`.

## Environment

```text
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

`NEXT_PUBLIC_API_URL` points the browser app at the backend API.

## Build

```bash
npm run build
npm run start
```

`npm run build` creates the normal Next.js production output in `.next/`. Request-time web/mweb
detection depends on the Next server, so this app is not configured as a static export.
