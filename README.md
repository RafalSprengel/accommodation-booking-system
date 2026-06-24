<img width="1200" height="900" alt="landing-page" src="https://github.com/user-attachments/assets/9bd75bfb-b57e-48fd-93d3-e8979e6aa509" />

# Wolf Lodges - Accommodation Booking & Dynamic Pricing System

## <a href="https://accommodation.rafalsprengel.com/">See Live: http://accommodation.rafalsprengel.com/</a>

A Next.js application for the Wilcze Chatki accommodation property (Szumles Krolewski, Kaszuby).

Project scope:
- public website with availability search and booking flow,
- online payments via Stripe,
- transactional and contact emails via Resend,
- admin panel for bookings, pricing, and settings,
- backend powered by MongoDB + Mongoose.

## 🚀 Key Features

### 💰 Advanced Dynamic Pricing Engine
*   **Multi-tier Logic:** Supports base rates, recurring annual seasons, weekday/weekend splits, and custom per-date overrides.
*   **Guest-based Tiers:** Prices automatically adjust based on the number of adults and children.
*   **Extra Beds:** Configurable additional costs for extra sleeping accommodations.
*   **Smart Availability:** Intelligent blocking logic for shared amenities (e.g., sauna/jacuzzi) and configurable check-in/check-out rules to prevent booking conflicts.

### 🛡️ Robust Payment & Data Consistency
*   **Stripe Integration:** Seamless Checkout flow with webhook handling for automatic booking confirmation and failed payment recovery.
*   **Lazy Cleanup:** Background process verifies pending Stripe sessions to automatically release blocked dates if payment fails or expires, ensuring high calendar accuracy.
*   **Auto-blocking:** Configurable rules to block all properties when one is booked ("single group on premises" rule).

### 🏠 Public Website & Booking Flow
*   **Interactive UI:** Mobile-first design with animated components (Framer Motion) and lazy-loaded images.
*   **Multi-step Wizard:** Date selection, guest details, summary, and secure payment redirect.
*   **Draft Persistence:** Saves booking progress in localStorage/cookies to prevent data loss during navigation.

### ⚙️ Comprehensive Admin Panel
*   **Dashboard:** Overview of upcoming bookings and quick access to management tools.
*   **Booking Management:** Create manual bookings, view detailed histories, edit guest data, and manage administrative blocks.
*   **Calendar View:** Visual representation of occupancy with tooltips for booking details.
*   **Pricing Manager:** UI for managing complex seasonal pricing structures and copying prices between properties.
*   **System Settings:** Configure global rules (check-in/out hours, child age limits, auto-blocking) via database-driven config.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, CSS Modules (Mobile-first) |
| **Backend** | Next.js Server Actions, Node.js |
| **Database** | MongoDB Atlas, Mongoose ORM |
| **Payments** | Stripe API (Checkout + Webhooks) |
| **Auth** | Better Auth (with Username plugin) |
| **Emails** | Resend, React Email Components |
| **Utilities** | Biome (Lint/Format), Day.js, Framer Motion |

---

## 📁 Project Structure

```text
src/
├── actions/          # Server actions for business logic (pricing, bookings, admin)
├── app/
│   ├── (root)/       # Public website pages (landing, booking wizard)
│   ├── admin/        # Admin dashboard and management interfaces
│   └── api/          # API routes (Stripe webhooks, auth)
├── db/               # Mongoose models and database connection
├── emails/           # React Email templates for notifications
├── lib/              # Integrations (auth, stripe, email sender)
└── utils/            # Helper functions (date formatting, price calculation)
