# AI Infinitiv

Endless vertical jumping game for the browser and Android. Climb platforms as high as you can, collect coins, unlock skins and look after a virtual pet between runs.

**Play:** https://ai-infinitiv.vercel.app

## Features

- Canvas game loop with custom physics (gravity, air resistance, fall damage)
- Touch joystick, on-screen buttons, keyboard and device tilt controls
- Skill tree shop, unlockable skins and achievements
- Virtual pet hub with feeding, shop and a rock-paper-scissors mini-game
- Optional AI-generated skins using the player's own Gemini API key
- Global leaderboard (Vercel serverless function + Upstash Redis)
- Installable PWA; Android build through Capacitor

## Stack

React 19, TypeScript, Vite, vite-plugin-pwa, Capacitor, Vercel Functions, Upstash Redis.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

The dev server runs on `https://localhost:5173` with a self-signed certificate (needed for device sensors on mobile).

Without the `/api` functions, login falls back to a local mock and the leaderboard shows empty entries. To run them locally, use `vercel dev`.

## Configuration

Set these in the Vercel project, not in the repository:

| Variable | Used by | Required |
|---|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Leaderboard | No (leaderboard is empty without it) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login | No (no admin account without it) |

The Gemini key for AI skins is entered by each player in **Settings** and stays in their browser.

## Build

```bash
npm run build          # web build in dist/
npx cap sync android   # copy the web build into the Android project
```

## Project layout

```
components/game/   game loop, physics, rendering, input, UI
components/pet/    virtual pet logic and screens
api/               serverless functions (auth, leaderboard)
android/           Capacitor Android project
apk-build/         Trusted Web Activity wrapper
```
