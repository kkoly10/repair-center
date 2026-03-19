# Repair Center

Repair Center is a premium, trust-first mail-in repair website built with Next.js for Vercel and designed to grow into a full repair operations platform.

## Current build

This repository already includes:
- premium homepage and service pages
- free estimate flow
- model-based pricing preview
- repair tracking UI
- Supabase backend schema
- Supabase catalog seed data
- API route for saving estimate requests into Supabase

## Tech stack

- Next.js App Router
- React
- Supabase (database + storage)
- Vercel-ready structure

## Environment variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Do not expose the service role key in client code.

## Supabase setup order

Run these in order:

1. `supabase/migrations/20260319_repair_center_core.sql`
2. `supabase/migrations/20260319_pricing_rule_conditions_unique.sql`
3. `supabase/seed/20260319_repair_center_catalog_seed.sql`

## What the backend currently saves

The estimate route stores:
- customer
- quote request
- selected pricing rule
- uploaded photos in the private `repair-uploads` bucket
- photo metadata rows linked to the quote request

## Next long-term build steps

- admin review queue for quote requests
- quote estimate generation workflow
- final quote approval flow
- payment integration for deposits and balances
- shipment integration and customer tracking updates
- customer account portal

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
