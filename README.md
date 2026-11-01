<img width="1200" height="900" alt="landing-page" src="https://github.com/user-attachments/assets/9bd75bfb-b57e-48fd-93d3-e8979e6aa509" />

# 🐺 Wolf Lodges – Accommodation Booking & Management System

A full-stack booking platform for a small holiday-cottage business: public website, multi-step booking wizard with Stripe payments, and a complete admin panel with a dynamic pricing engine, occupancy calendar and automatic payment reconciliation.

## 🔗 Live Demo

**https://accommodation.rafalsprengel.com/**

Admin panel: `/admin-login` (a link is also available in the site footer and in the welcome modal).

## 📌 Project Scope

- Public website with availability search and booking flow
- Online payments via Stripe (Checkout + webhooks)
- Transactional and contact emails via Resend + React Email
- Admin panel for bookings, payments, pricing, properties and settings
- Backend powered by Next.js Server Actions + MongoDB (Mongoose)

---

## 🚀 Key Features

### 💰 Advanced Dynamic Pricing Engine

- **Three-level price priority:** `Individual (per-date) prices → Seasonal prices → Base prices`
- **Recurring annual seasons** – defined once by day/month, repeated every year; supports seasons that **cross the new year** (e.g. 20 Dec – 5 Jan)
- **Season overlap validation** – the system rejects overlapping season ranges (including cross-year ones)
- **Weekday / weekend rates** – separate price lists for Sun–Thu and Fri–Sat
- **Guest-based price tiers** – price depends on the number of paying guests (e.g. 1–3, 4–6 persons), with full tier validation (no gaps, overlaps or negative values)
- **Free children rule** – children up to a configurable age stay free and are excluded from price tiers
- **Extra beds** – separately configurable price per night (weekday / weekend, per season, per custom date)
- **Per-date / date-range overrides** – pick a day or a range in the calendar and set special prices with their own tiers
- **Per-property pricing** – every cottage has its own price lists; one click copies the full pricing (base, seasonal, custom, extra beds) to all other cottages
- **Season price preview for guests** – when the searched dates touch a high season, the booking page shows a warning and an expandable season price list
- **Prices are always recalculated on the server** before creating a booking or a Stripe session – the client can never tamper with the amount

### 🛡️ Availability & Data Consistency

- **Lazy cleanup of abandoned payments** – no cron job needed. Whenever availability is checked, stale `pending` bookings (older than 15 min) are verified against Stripe:
  - session `complete` → booking confirmed and marked as paid,
  - session `open` → session is actively expired and booking marked as failed,
  - session `expired` → booking marked as failed and dates released,
  - Stripe error → booking kept as occupied and the error is logged in internal notes (safe fallback)
- **15-minute hold** – fresh pending bookings block the dates while the guest is paying
- **"Single group on premises" rule** – optional auto-blocking of all cottages when one is booked (shared sauna / jacuzzi / pavilion)
- **"No-rush cleaning" rule** – configurable whether a new guest can check in on the same day another guest checks out
- **Strict admin blocks** – administrative date blocks are fully unavailable (no check-in/check-out half-days)
- **Availability re-verified at every step** of the booking wizard and again right before payment
- **Atomic order numbering** – human-readable IDs (`ORD-000001`) generated with an atomic MongoDB counter
- **Multi-cottage orders** – one order / one Stripe session can cover several cottages (separate booking documents linked by one `orderId`)
- **Automatic data retention** – failed online bookings are removed by a MongoDB TTL index after 30 days

### 💳 Payments (Stripe)

- Checkout Session created server-side with booking metadata (`orderId`, `bookingIds`, dates, guests)
- Webhook with signature verification handling `checkout.session.completed`, `checkout.session.expired` and `checkout.session.async_payment_failed`
- Payment-success page that **polls the payment status** (with retries) and only shows confirmation once Stripe reports the session as complete
- Dedicated *payment cancelled* and *payment failed* pages with retry options
- Admin **"Sync" button** to manually reconcile a pending online payment with Stripe (confirms, expires, or reports "still open")
- Direct links from the admin table to the Stripe dashboard session

### 🏠 Public Website & Booking Flow

- Mobile-first, animated landing page: 3D hero slider, offer & live pricing (read from the database), gallery with lightbox, local attractions, contact section
- Availability search by dates and guests (adults / children) with a custom range calendar that respects blocked dates, min/max stay and the check-in rule
- Multi-step wizard with stepper: **Search → Guest details → Summary → Stripe payment**
- Optional **VAT invoice** data (company name, address, postal code, city)
- **Draft persistence** – booking progress is saved in `localStorage`; returning guests see a "continue your previous booking" shortcut (validated against current availability)
- Network-error recovery modals with retry, and clear "dates no longer available" handling
- Terms & Conditions page that automatically shows the **current check-in / check-out hours** from settings
- Contact form validated with Zod – sends a notification to the owner and an auto-reply to the guest

### ⚙️ Comprehensive Admin Panel

| Area | What you can do |
|---|---|
| **Dashboard** | Upcoming confirmed bookings and quick actions |
| **Calendar** | Month view per cottage with colour-coded bookings, split **OUT / IN** half-day cells, smart tooltips (guest, dates, nights, guests, payment status, contact data), blocked and pending states |
| **Booking list** | Status filters (confirmed / pending / rejected / all), search by name, e-mail or order number, accordion cards, upcoming vs. past bookings |
| **Add booking** | Manual (e.g. phone) bookings with live price calculation, capacity validation, conflict detection, deposit / paid amount tracking and automatic payment status |
| **Booking details** | Edit guest data, dates, prices, payments, invoice data and internal notes; delete booking |
| **Block dates** | Block a single cottage or all cottages for maintenance / private use, with notes |
| **Properties** | Add, edit, activate / deactivate, delete (protected if bookings exist); capacity limits for adults, children and extra beds |
| **Prices** | Base, seasonal and individual prices, copy between cottages, unsaved-changes bar |
| **Payments** | Separate tabs for online (Stripe) and cash / transfer payments, search, status filters |
| **System settings** | Auto-block rule, contact data shown on the site, booking-notification e-mails, admin account |
| **Booking settings** | Min / max nights, check-in / check-out hours, free-children age, check-in on departure day, season management |

- Customer + owner **confirmation e-mails** after booking; e-mails on booking changes are sent only when meaningful fields change (not on internal-note edits)
- Toggle to **disable booking e-mails globally** and a separate notification address
- Admin account management: change username, e-mail and password from the panel

### 🔐 Security & Authentication

- **Better Auth** with the Username plugin and role-based access (`user` / `admin`)
- `/admin/*` protected by a request proxy (redirects unauthenticated users and non-admins)
- **Every admin server action re-checks the session** (`ensureAdmin`) – UI protection alone is never trusted
- Session cookie cache to avoid a database hit on every navigation
- Password reset by **username** (link sent to the associated e-mail) and **username reminder** by e-mail – without revealing whether an account exists
- Stripe webhook signature verification; server-side re-validation of capacity, extra beds, availability and price

### 🧰 Developer Experience

- Password-protected **`/dev` console** (separate cookie auth) to seed or reset the database, create the admin user and inspect logs
- Seed actions for properties, seasons, prices, bookings, system and booking config
- Smoke test script for the lazy-cleanup logic
- Event logging model (`error` / `warn` / `info`)
- Reusable UI kit: `Button`, `Modal`, `QuantityPicker`, `CalendarPicker`, `AdminShell`, `AdminSection`, `SettingRow`, `FormField`, `StatusBadge`

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Frontend** | Next.js (App Router), React, TypeScript, CSS Modules (mobile-first) |
| **Backend** | Next.js Server Actions, Route Handlers, Node.js |
| **Database** | MongoDB Atlas, Mongoose ODM |
| **Payments** | Stripe API (Checkout + Webhooks) |
| **Auth** | Better Auth (Username plugin, role-based access) |
| **Emails** | Resend, React Email Components |
| **Validation** | Zod |
| **UI / Animation** | Framer Motion (`motion`), GLightbox, React Hot Toast, Font Awesome |
| **Utilities** | Day.js, Biome (Lint/Format) |
| **Analytics / Monitoring** | Vercel Speed Insights, GoatCounter |

---

## 📁 Project Structure

```
src/
├── actions/          # Server actions: pricing, availability, bookings, payments, seasons, settings, seeding
├── app/
│   ├── _components/  # Shared UI (Button, Modal, CalendarPicker, Hero, Gallery, ...)
│   ├── (root)/       # Public website (landing, gallery, terms, booking wizard)
│   ├── admin/        # Admin panel (bookings, calendar, prices, payments, settings, properties)
│   ├── admin-login/  # Admin login + password / username recovery
│   ├── reset-password/
│   ├── dev/          # Developer console (protected)
│   └── api/          # Stripe webhook, checkout status, contact form, auth
├── db/               # Mongoose models and connection
├── emails/           # React Email templates
├── hooks/            # Reusable hooks
├── lib/              # Integrations (auth, stripe, email sender, admin guard, logger)
├── scripts/          # Maintenance / smoke-test scripts
├── types/            # Shared TypeScript types
├── utils/            # Pricing, overlap, date helpers, lazy cleanup, order ID generator
└── proxy.ts          # Route protection for /admin/*
```

### Main Data Models

`Property` · `Booking` · `Season` · `PropertyPrices` (per property + season, `seasonId: null` = base prices) · `CustomPrice` (per property + date) · `BookingConfig` · `SystemConfig` · `SiteSettings` · `Log`

---

## 🧮 Pricing Algorithm (per night)

```
for each night in [checkIn, checkOut):
  1. Custom price for this property + date?      → use its guest tiers + extra bed price
  2. Date inside an active (recurring) season
     AND prices exist for this property + season → use season prices
  3. Otherwise                                    → use base prices
  → pick weekday or weekend list (Fri & Sat = weekend)
  → pick the tier matching the number of paying guests
  → add (extra beds × extra bed price)
total = sum of all nights
```

---

## ⚙️ Environment Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your values:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret

# Auth & Email
BETTER_AUTH_SECRET=your_random_secret
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key

# Developer console (/dev)
DEV_AUTH_LOGIN=your_dev_login
DEV_AUTH_PASSWORD=your_dev_password
```

3. Run the development server:

```bash
npm run dev
```

4. (Optional) Forward Stripe webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 🗄️ Database Seeding

Open the developer console at `/dev` and sign in with `DEV_AUTH_LOGIN` / `DEV_AUTH_PASSWORD`. From there you can:

- **Seed All Data (Full Reset)** – clears all collections and rebuilds demo data (seasons, cottages, prices, configs, bookings)
- Seed individual parts (properties, seasons, prices, system / booking config, bookings)
- **Seed Admin User** – creates the admin account through Better Auth
- Clear all collections

> ⚠️ The full reset is destructive – never expose `/dev` in production without strong credentials.

---

## 💳 Payment Flow

1. **Validation:** a server action re-checks availability, cottage capacity, extra beds and **recalculates every price on the server**.
2. **Draft bookings:** bookings are created with `pending` / `unpaid` status under one `orderId` (one per cottage), which temporarily holds the dates.
3. **Stripe Session:** a Checkout session is created with metadata (`orderId`, `bookingIds`, dates, guests) and attached to all bookings. If session creation fails, the draft bookings are rolled back.
4. **Webhook handling:**
   - `checkout.session.completed` → bookings become `confirmed` + `paid`, confirmation e-mails go to the guest and the owner.
   - `checkout.session.expired` / `async_payment_failed` → bookings become `failed`, the guest is notified and the dates are released.
5. **Lazy verification:** if a webhook is missed, pending sessions older than 15 minutes are verified directly against Stripe the next time availability is checked, so the calendar stays accurate.
6. **Manual fallback:** admins can force a sync of any pending online payment from the Payments panel.

---

## 📬 E-mail Templates

Booking confirmation (guest & admin) · Failed payment · Contact form notification · Contact auto-reply · Password reset · E-mail change verification · Username reminder

---

## 📄 License

Portfolio / commercial project by [Rafał Sprengel](https://rafalsprengel.com).
