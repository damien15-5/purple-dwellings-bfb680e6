# Xavorian

> Nigeria's trust-first real estate marketplace — built for Benin City, engineered to scale.

Xavorian solves the core problem in Nigerian property search: **you can't trust what you're looking at**. We fix that with KYC-backed agent verification, scam detection infrastructure, and a verified listings layer — before we touch anything else.

---

## What This Repo Is

This is the core platform monorepo. It contains:

- **Frontend** — React + Vite SPA, deployed on Vercel
- **Backend** — Supabase (PostgreSQL + RLS + Edge Functions on Deno)
- **Storage** — Cloudinary (cloud name: `dp21kb6dy`, preset: `xavorian_uploads`)
- **Payments** — Paystack (listings fees + agent payouts via Transfer API)
- **Email** — Zoho Mail at `infos@xavorian.xyz`, integrated via Supabase Edge Functions
- **SEO** — Static prerender + dynamic rendering via `middleware.ts`, `vercel.json`, `generate-static.js`

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, TypeScript |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Serverless | Supabase Edge Functions (Deno) |
| Image Storage | Cloudinary |
| Payments | Paystack |
| Email | Zoho Mail (custom domain) |
| SEO | Static prerender + middleware dynamic rendering |

---

## Project Structure

```
xavorian/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-level page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Supabase client, Cloudinary config, Paystack utils
│   └── types/            # TypeScript types and interfaces
├── supabase/
│   ├── functions/        # Deno Edge Functions
│   └── migrations/       # SQL migration files
├── public/               # Static assets
├── scripts/
│   └── generate-static.js  # Static prerender script for SEO
├── middleware.ts          # Vercel middleware for dynamic rendering
├── vercel.json            # Vercel routing and header config
├── .env.example           # Environment variable template
└── README.md
```

---

## URL Schema

| Route | Purpose |
|---|---|
| `/property/[slug]` | Individual property listing |
| `/location/[city]/[area]` | Location/neighborhood pages |
| `/agents/[slug]` | Agent profile pages |
| `/blog/[slug]` | SEO blog content |

---

## Core Features

### Trust Infrastructure
- **Agent KYC Verification** — Agents are verified before listings go live. Verified badge managed via admin Telegram bot.
- **Scam Detection** — Listing-level signals flagged for review.
- **Identity Layer** — Supabase RLS enforces data access at the row level across all tables.

### Listings
- Property upload with Cloudinary image storage (unsigned upload preset).
- Listings tied to verified agent accounts.
- Search and filter by location, price, and property type.

### Payments
- Listing fees collected via Paystack.
- Agent payouts handled via Paystack Transfer API (not subaccounts).

### Email
- Transactional email via Zoho Mail (`infos@xavorian.xyz`).
- Sent through Supabase Edge Functions using SMTP.

### SEO
- SPA client-side rendering problem solved with a hybrid approach:
  - `generate-static.js` prerenders key routes to static HTML at build time.
  - `middleware.ts` handles dynamic rendering for crawlers at request time.
  - `vercel.json` configures routing rules and cache headers.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CLOUDINARY_CLOUD_NAME=dp21kb6dy
VITE_CLOUDINARY_UPLOAD_PRESET=xavorian_uploads
VITE_PAYSTACK_PUBLIC_KEY=
ZOHO_SMTP_USER=infos@xavorian.xyz
ZOHO_SMTP_PASS=
PAYSTACK_SECRET_KEY=
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run static prerender (before deploy)
node scripts/generate-static.js
```

---

## Supabase Edge Functions

```bash
# Deploy a function
supabase functions deploy <function-name>

# Set secrets
supabase secrets set ZOHO_SMTP_PASS=your_password
```

---

## Deployment

The frontend deploys automatically to Vercel on push to `main`. Supabase functions are deployed manually via the Supabase CLI.

Make sure to run `generate-static.js` before each production build to keep prerendered pages fresh.

---

## Current Focus — Benin City

Xavorian is currently live and operating in **Benin City, Edo State**. Location pages cover neighborhoods across Oredo, Egor, and Ikpoba-Okha LGAs.

Growth is driven by direct agent recruitment and organic SEO targeting Benin City real estate queries.

---

## Repo Access

Private. Internal use only.

Built by [@damien15-5](https://github.com/damien15-5) · [xavorian.xyz](https://xavorian.xyz) · [@Eze_Damien](https://x.com/Eze_Damien)
## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

