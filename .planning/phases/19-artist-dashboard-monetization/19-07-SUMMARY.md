---
phase: 19-artist-dashboard-monetization
plan: "07"
subsystem: billing
tags: [stripe, subscriptions, feature-gating, payments]
dependency_graph:
  requires: [19-03, 19-04, 19-05, 19-06]
  provides: [stripe-billing, feature-gating]
  affects: [dashboard]
tech_stack:
  added: [stripe@20.4.1]
  patterns: [stripe-checkout, stripe-webhooks, feature-access-gating]
key_files:
  created:
    - /home/swarn/decibel/src/lib/subscription.ts
    - /home/swarn/decibel/src/app/api/stripe/checkout/route.ts
    - /home/swarn/decibel/src/app/api/stripe/webhook/route.ts
  modified:
    - /home/swarn/decibel/src/app/dashboard/page.tsx
    - /home/swarn/decibel/src/app/dashboard/dashboard-client.tsx
decisions:
  - "Stripe v20 breaking change: current_period_end moved to subscription items — use sub.items.data[0].current_period_end"
  - "Stripe env vars documented as required for production but build succeeds without them (graceful 503 at runtime)"
  - "LockedFeature overlay uses backdrop-blur + gradient bg instead of blur filter on tab content — cleaner UX"
metrics:
  duration: "12m"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_modified: 5
requirements: [DASH-09, DASH-10, DASH-11]
---

# Phase 19 Plan 07: Stripe Billing & Feature Gating Summary

**One-liner:** Stripe Checkout + webhook lifecycle for $29/month subscription with 14-day free trial and feature-gating overlay on Fan Intelligence, Shows, and Messaging tabs.

## What Was Built

### Task 1: Stripe infrastructure

- **`src/lib/subscription.ts`** — server-only helper module:
  - `getSubscription(performerId)` — fetches `artist_subscriptions` row
  - `getFeatureAccess(sub)` — returns `'full' | 'trial' | 'locked'` based on plan + trial expiry
  - `isFeatureUnlocked(access)` — boolean convenience
  - `getTrialDaysLeft(sub)` — days remaining in trial

- **`POST /api/stripe/checkout`** — creates Stripe Checkout session:
  - Auth-gated (Supabase JWT)
  - Gets/creates Stripe customer, persists `stripe_customer_id` to `artist_subscriptions`
  - Returns `{ url }` for redirect to Stripe Checkout
  - Graceful 503 when env vars not configured

- **`POST /api/stripe/webhook`** — handles Stripe lifecycle events:
  - `checkout.session.completed` → set `plan=pro, status=active`
  - `customer.subscription.updated` → sync status + period end
  - `customer.subscription.deleted` → set `plan=cancelled, status=cancelled`
  - Raw body read + signature verification (STRIPE_WEBHOOK_SECRET)
  - `export const runtime = 'nodejs'` for raw body support

### Task 2: Feature gating in dashboard

- **`SubscriptionBanner`** — shown at top of all dashboard tabs:
  - Trial active: yellow banner with countdown, "Upgrade to Pro" button
  - Trial urgent (≤3 days): red banner
  - Pro active: teal "Decibel Pro" badge with renewal date
  - Expired: red banner with prominent upgrade CTA

- **`LockedFeature`** — overlay component for locked tabs:
  - Backdrop blur + gradient background
  - Gold star icon, descriptive message, upgrade button

- **`UpgradeButton`** — calls `POST /api/stripe/checkout`, redirects to Stripe URL

- **Feature access rules:**
  - Overview tab: always accessible (free tier)
  - Fan Intelligence, Messages, Shows: locked when `featureAccess === 'locked'`
  - Settings / link-in-bio: always accessible (free tier)

- **Billing success toast:** `?billing=success` URL param → "Welcome to Decibel Pro!" toast, URL cleaned up

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe v20 breaking change: `current_period_end` missing from `Stripe.Subscription`**
- **Found during:** Task 1 build verification
- **Issue:** Stripe v20 moved `current_period_end` from `Stripe.Subscription` to `Stripe.SubscriptionItem`. TypeScript build failed with "Property 'current_period_end' does not exist on type 'Subscription'".
- **Fix:** Created `getPeriodEnd(sub)` helper that reads `sub.items.data[0].current_period_end` (cast via `Stripe.SubscriptionItem & { current_period_end?: number }`). Used `as unknown as Stripe.Subscription` cast for the `subscriptions.retrieve()` return since Stripe v20 wraps in `Response<>`.
- **Files modified:** `src/app/api/stripe/webhook/route.ts`
- **Commit:** a750f65

## Known Limitations (Stripe Env Vars Required for Production)

The following Vercel env vars must be configured by Swarn before the billing flow works in production:

| Env Var | Source |
|---------|--------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key |
| `STRIPE_PRICE_ID` | Price ID for the $29/month "Decibel Pro for Artists" product |

Stripe Dashboard setup required:
1. Create product "Decibel Pro for Artists" with $29/month recurring price
2. Create webhook endpoint at `https://decible.live/api/stripe/webhook` listening for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

Without these, the build succeeds and the dashboard renders correctly — but clicking "Upgrade" returns a 503 with a user-friendly error message.

## Self-Check: PASSED

All created files exist. Both commits confirmed in git log:
- `a750f65` — feat(19-07): Stripe checkout, webhook, and subscription helper
- `df5063a` — feat(19-07): Feature gating and subscription banner in artist dashboard
