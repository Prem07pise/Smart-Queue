# Smart Queue System

## Project overview

This repository contains the Smart Queue System — a web application for managing customer queues with live status, ticket generation, admin dashboards, and AI-assisted predictions/optimizations. It uses Vite + React + TypeScript and a lightweight component library powered by Tailwind CSS and shadcn-ui.

## Quick start (local development)

Prerequisites: Node.js (16+), npm or pnpm.

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd smart-queue-system

# Install dependencies
npm install

# Start dev server
npm run dev
```

To build for production:

```bash
npm run build
```

## Project structure and detailed workings

- `src/` — application source.
	- `main.tsx` — app entry, router and global providers.
	- `App.tsx` — top-level layout and route outlets.
	- `components/` — UI components and feature components used across the app:
		- `RegistrationForm.tsx` — handles new customer registrations and issues a queue ticket.
		- `QueueTicket.tsx` — renders the issued ticket (number, QR code, ETA info).
		- `LiveStatusDisplay.tsx` — real-time display of current serving number and queue metrics.
		- `AdminQueueList.tsx` — admin-facing queue management (call next, mark served, requeue).
		- `AdminStats.tsx` — aggregated statistics and KPIs for day/period.
		- `QRScanner.tsx` — client-side QR scanning to validate or fetch ticket info.
		- `AICustomerInsights.tsx`, `AIOptimizationPanel.tsx`, `AIPredictionCard.tsx` — AI features that surface predicted wait times and optimization suggestions.
		- `ui/` — design-system primitives (buttons, dialogs, forms, tables) used by pages.

- `src/context/QueueContext.tsx` — React Context providing queue state (tickets, current number, history) and actions (enqueue, dequeue, update). This is the central place to subscribe UI components to queue changes.

- `src/hooks/` — custom hooks such as `useQueueAI.ts` (interacts with AI endpoints), `use-mobile.tsx` (detects mobile layout), and `use-toast.ts` (notifications).

- `src/integrations/supabase/` — Supabase integration:
	- `client.ts` — Supabase client initialization (uses `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables).
	- `types.ts` — shared TypeScript types for DB rows and function payloads.

- `supabase/functions/` — server-side edge functions (deployed to Supabase functions):
	- `queue-ai/index.ts` — handles AI-related processing (predictions, optimizations) for the queue.
	- `send-sms/index.ts` — sends SMS notifications (e.g., ticket ready) using configured SMS provider credentials.

## How the queue flows (detailed)

1. A user opens the public site and submits the `RegistrationForm` with their details.
2. The frontend calls the backend/Supabase to create a new ticket record and returns a ticket number and optional QR token.
3. The `QueueContext` updates local state and broadcasts the update through any realtime channel (Supabase Realtime or websockets) so `LiveStatusDisplay` and admin pages update immediately.
4. Admins use `AdminQueueList` to call the next ticket. When a ticket is served, the frontend updates the ticket status in the DB and optionally triggers `send-sms` to notify the customer.
5. AI features use `queue-ai` to analyze recent patterns and produce:
	 - predicted wait time per ticket,
	 - recommended staffing or window allocations,
	 - anomaly detection for sudden surges.

## Environment variables

Set these in your local environment or deployment platform:

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_ANON_KEY` — public anon key for Supabase
- `SMS_PROVIDER_KEY` / `SMS_PROVIDER_SECRET` — credentials for your SMS service (if used by `send-sms` function)

## Development notes & tips

- Realtime updates: Supabase Realtime or a websocket server is used to push ticket/state changes to connected clients. See `src/context/QueueContext.tsx` for subscription code.
- AI endpoints: AI workload runs server-side in `supabase/functions/queue-ai`. Keep heavy model processing server-side and keep the client lightweight.
- Tests: There are no test suites included by default — add unit/integration tests for critical flows (registration, serving, notifications).

## Deployment

This app can be hosted on any static-host + serverless backend combination (Vercel, Netlify, Supabase Hosting, etc.). Ensure your Supabase credentials and any SMS provider secrets are set in the target environment.

## Contributing

- Fork the repo, create a branch for your change, and open a pull request.
- Keep changes scoped and add tests where appropriate.

---

If you'd like, I can also:
- add a sample `.env.example` with the exact variable names,
- add a short architecture diagram or README badges (build, license), or
- open a PR that wires a simple local mock for the `send-sms` function for easier local development.

If you want any of those, tell me which and I'll add it.
