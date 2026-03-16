# FabricIntel

**Know What's On Your Skin.**

FabricIntel is a fabric health awareness app that helps you make informed clothing choices by providing detailed information about the materials used in garments — their health impacts, breathability, skin sensitivity, and sustainability.

**Live App:** https://d3hgvdkp3pujs3.cloudfront.net

---

## Table of Contents

- [How the App is Built](#how-the-app-is-built)
- [Features](#features)
- [Data Used in the App](#data-used-in-the-app)
- [API Calls & External Integrations](#api-calls--external-integrations)
- [Fabric Awareness Table](#fabric-awareness-table)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Monetization](#monetization)
- [Roadmap](#roadmap)

---

## How the App is Built

FabricIntel is a **fully client-side React single-page application (SPA)** — there is no backend server or database. All logic, data, and state runs entirely in the browser.

### Architecture Overview

```
Browser (React + Vite SPA)
    │
    ├── React Router v6 ─── client-side page routing (no server round-trips)
    │
    ├── Static Data Files ── fabrics.js / brands.js / reviews.js
    │       └── Imported directly at build time, no network requests
    │
    ├── localStorage ─────── persists onboarding state and user preferences
    │
    ├── html5-qrcode ─────── accesses device camera via browser MediaDevices API
    │       └── Scans barcodes/QR codes without any external API call
    │
    └── AWS CloudFront ───── serves the built static files globally (CDN)
```

### Key Design Decisions

| Decision | Reason |
|---|---|
| No backend / no database | Keeps the app free to run, zero latency, works offline |
| Static data files | All fabric and brand data is curated and bundled at build time |
| localStorage for state | Onboarding "seen" flag persists across sessions without a server |
| Client-side routing | React Router handles all navigation; CloudFront redirects 404s to index.html |
| html5-qrcode | Uses native browser camera API — no external scanning service needed |
| Vite build tool | Fast dev server, optimised production bundle with code splitting |

### Page-by-Page Breakdown

| Page | What it does |
|---|---|
| **Home** | Landing page — hero section, feature highlights, call-to-action links |
| **Fabric Library** | Lists all 9 fabrics; filter by category (Natural / Semi-Natural / Synthetic) |
| **Fabric Detail** | Individual fabric page — full health breakdown, best-for/avoid lists |
| **Scanner** | Activates device camera via html5-qrcode; matches barcode to a fabric from static mock map |
| **Brand Directory** | Lists 6 brands with sustainability scores, certifications, and affiliate links |
| **Community** | Displays seed reviews; users can add new reviews (stored in React state, resets on refresh) |
| **Health Insights** | Comparison table, skin-type guides, health facts, practical tips |
| **Premium** | Upgrade page describing planned premium features |

### Onboarding / Help System

- On first visit, a 7-step modal tutorial auto-opens (checks `localStorage` key `fw_onboarding_done`)
- Each step explains a feature with an icon, tip, and a direct navigation shortcut
- A **"?" button** in the navbar lets users reopen the tutorial at any time
- Dismissing or completing the tutorial sets `fw_onboarding_done = 1` in localStorage

---

## Features

### Fabric Library
Browse all 9 major fabric types with detailed health scores, breathability ratings, skin sensitivity levels, and allergen risk. Filter by Natural, Semi-Natural, or Synthetic categories.

### Barcode / QR Scanner
Scan the barcode or QR code on clothing labels using your device camera to instantly retrieve fabric information. Manual entry supported as a fallback. Currently uses a built-in mock barcode map — real barcode database integration is on the roadmap.

### Brand Directory
Explore 6 clothing brands with sustainability scores, ethics ratings, material sourcing info, certifications (Fair Trade, B Corp, GOTS, bluesign®), and affiliate purchase links.

### Community Reviews
Read and write real experiences with specific fabrics and brands. Sort by newest, most liked, or highest rating. Filter by fabric type. Reviews added by users are held in React component state (not persisted — backend persistence is on the roadmap).

### Health Insights
Detailed health information including:
- Full fabric comparison table with allergen badges
- Skin-type guides (Normal, Sensitive, Eczema, Active)
- Research-backed health facts about synthetic fabrics
- Practical tips for healthier clothing choices

### In-App Onboarding
7-step interactive tutorial for new users. Accessible at any time via the "?" help button in the navbar.

### Premium (Coming Soon)
- Personalized fabric recommendations based on your skin type
- Allergen alerts when scanning labels
- Full scan history
- Ad-free experience

---

## Data Used in the App

All data is **static and bundled into the app** — no external data APIs are called at runtime. Data files live in `src/data/`.

### `src/data/fabrics.js`

The core dataset. Contains 9 fabric records, each with:

| Field | Type | Description |
|---|---|---|
| `id` | string | URL-safe slug (e.g. `organic-cotton`) |
| `name` | string | Display name |
| `category` | string | `natural`, `semi-natural`, or `synthetic` |
| `breathability` | string | `excellent`, `good`, `moderate`, `poor`, `very-poor` |
| `skinSensitivity` | string | `very-low`, `low`, `moderate`, `high` |
| `odorRetention` | string | `low`, `moderate`, `high`, `very-high` |
| `moistureWicking` | string | `low`, `moderate`, `good`, `high` |
| `comfortLevel` | string | Comfort rating |
| `healthScore` | number | 0–100 health score |
| `healthNotes` | string | One-line health summary |
| `description` | string | Paragraph description |
| `naturalPercent` | number | % natural fibre content |
| `ecoRating` | number | 1–5 eco/sustainability rating |
| `allergenRisk` | string | `none`, `low`, `moderate`, `high` |
| `bestFor` | string[] | Use cases this fabric suits |
| `avoidIf` | string[] | Conditions where this fabric should be avoided |
| `tags` | string[] | Search/filter tags |
| `color` | string | Hex colour used in UI |

**Fabrics included:** Organic Cotton, Regular Cotton, Bamboo Viscose, Hemp, Tencel (Lyocell), Polyester, Nylon, Acrylic, Spandex/Elastane

### `src/data/brands.js`

Contains 6 clothing brand records, each with:

| Field | Type | Description |
|---|---|---|
| `id` | string | URL-safe slug |
| `name` | string | Brand name |
| `logo` | string | Emoji logo |
| `sustainabilityScore` | number | 0–100 sustainability score |
| `primaryMaterials` | string[] | Main materials used |
| `certifications` | string[] | e.g. `Fair Trade`, `B Corp`, `GOTS`, `bluesign®` |
| `ethicsRating` | string | `excellent`, `good`, `fair`, `poor` |
| `description` | string | Brand summary |
| `website` | string | Brand URL (used for affiliate links) |
| `priceRange` | string | `$`, `$$`, `$$$` |
| `affiliateNote` | string / null | Affiliate disclaimer if applicable |

**Brands included:** Patagonia, Eileen Fisher, prAna, H&M Conscious, Zara, Fast Fashion Co.

### `src/data/reviews.js`

Seed community review data. 5 pre-populated reviews shown on first load. Each review has:

| Field | Type | Description |
|---|---|---|
| `id` | number | Unique review ID |
| `userId` | string | Mock user ID |
| `userName` | string | Display name |
| `avatar` | string | Emoji avatar |
| `fabricId` | string | Links to a fabric record |
| `rating` | number | 1–5 star rating |
| `title` | string | Review headline |
| `body` | string | Full review text |
| `likes` | number | Initial like count |
| `date` | string | ISO date string |
| `verified` | boolean | Whether the review is verified |

User-submitted reviews are added to this array in React state at runtime and are not persisted between sessions.

---

## API Calls & External Integrations

FabricIntel is a **frontend-only app with no backend API calls**. The table below lists all external integrations and browser APIs used:

| Integration | Type | Purpose | Network Call? |
|---|---|---|---|
| **html5-qrcode** | npm library | Accesses device camera to scan barcodes/QR codes | No — uses browser `MediaDevices.getUserMedia` |
| **React Router v6** | npm library | Client-side page routing | No |
| **localStorage** | Browser API | Persists onboarding `fw_onboarding_done` flag | No |
| **Brand website links** | External URL | Outbound affiliate links on Brand Directory page | User-initiated only (link click) |
| **AWS CloudFront CDN** | Hosting | Serves the static built app files globally | N/A (infrastructure) |

### Scanner: How Barcode Matching Works

The Scanner page uses `html5-qrcode` to read a barcode or QR code from the device camera. The scanned code is looked up against a **static mock map** bundled in the app:

```js
const mockBarcodes = {
  '123456789012': 'organic-cotton',
  '987654321098': 'polyester',
  '555000111222': 'tencel',
  '111222333444': 'acrylic',
};
```

If the scanned code matches, the corresponding fabric detail is displayed immediately. If it does not match, the user is shown a "not found" message and can enter a code manually.

> **Roadmap:** Real-world barcode lookup will require integration with an external clothing/product database API (e.g. Open Food Facts for textiles, or a custom product API).

### No Authentication

There is currently no user login or authentication system. All user actions (writing reviews, liking reviews) are local to the session. Cognito/auth is planned for the premium tier.

---

## Fabric Awareness Table

| Fabric | Breathability | Skin Sensitivity | Odor Retention | Moisture Wicking | Health Score |
|---|---|---|---|---|---|
| Organic Cotton | Excellent | Very Low | Low | Low | 95/100 |
| Regular Cotton | Good | Low | Low | Low | 75/100 |
| Bamboo Viscose | Excellent | Very Low | Low | Moderate | 88/100 |
| Hemp | Good | Low | Low | Low | 82/100 |
| Tencel (Lyocell) | Excellent | Very Low | Very Low | Good | 92/100 |
| Polyester | Poor | Moderate | High | Good | 35/100 |
| Nylon | Poor | Moderate | High | Moderate | 38/100 |
| Acrylic | Very Poor | High | Very High | Poor | 15/100 |
| Spandex/Elastane | Very Low | Moderate | High | High | 45/100 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Barcode Scanning | html5-qrcode |
| Styling | Custom CSS (dark theme) |
| Hosting | AWS S3 + CloudFront |
| State | React local state + localStorage |
| Build | Vite (ESM, code-split output) |
| Deployment | AWS CLI + CloudFront invalidation |

---

## Project Structure

```
fabric-wise-app/
├── public/
├── src/
│   ├── App.jsx                    # Root component — routing, onboarding state, navbar wiring
│   ├── App.css
│   ├── components/
│   │   ├── Navbar.jsx             # Navigation bar with "?" help button
│   │   ├── Navbar.css
│   │   ├── FabricCard.jsx         # Reusable fabric card used in library
│   │   ├── OnboardingModal.jsx    # 7-step first-time user tutorial modal
│   │   └── OnboardingModal.css
│   ├── data/
│   │   ├── fabrics.js             # All 9 fabric records (static)
│   │   ├── brands.js              # 6 brand records (static)
│   │   └── reviews.js             # 5 seed community reviews (static)
│   ├── pages/
│   │   ├── Home.jsx               # Landing page
│   │   ├── FabricLibrary.jsx      # Browse & filter fabrics
│   │   ├── FabricDetail.jsx       # Single fabric detail view
│   │   ├── Scanner.jsx            # Barcode / QR scanner
│   │   ├── BrandDirectory.jsx     # Brand sustainability directory
│   │   ├── Community.jsx          # User reviews (session state)
│   │   ├── HealthInsights.jsx     # Health information & guides
│   │   └── Premium.jsx            # Upgrade / premium features page
│   └── styles/
│       └── global.css
├── DEPLOYMENT.md                  # AWS deploy commands reference
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
cd fabric-wise-app
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

---

## Deployment

The app is deployed on **AWS S3 + CloudFront**.

| Resource | Value |
|---|---|
| Live URL | https://d3hgvdkp3pujs3.cloudfront.net |
| S3 Bucket | `fabric-wise-app-857590206967` |
| CloudFront ID | `E203ZX8QJR49Z9` |

### Re-deploy after changes

```bash
npm run build

aws s3 cp dist/index.html s3://fabric-wise-app-857590206967/index.html \
  --cache-control "no-cache, no-store, must-revalidate" --content-type "text/html"

aws s3 sync dist s3://fabric-wise-app-857590206967 \
  --exclude "index.html" --cache-control "public, max-age=31536000, immutable" --delete

aws cloudfront create-invalidation \
  --distribution-id E203ZX8QJR49Z9 \
  --paths "/*"
```

---

## Monetization

| Method | Status | Details |
|---|---|---|
| **Premium Features** | Coming Soon | Scan history, allergen alerts, personalized recommendations |
| **Affiliate Links** | Ready | Brand directory links with affiliate hooks |
| **Sponsored Content** | Planned | After user base established |
| **Data Insights** | Planned | Anonymized health & fabric trend data |

---

## Roadmap

- [ ] Backend API + user accounts (AWS Lambda + DynamoDB)
- [ ] Real barcode database integration (external product API)
- [ ] Persist community reviews (backend storage)
- [ ] Push notifications for allergen alerts
- [ ] Native mobile app (React Native)
- [ ] Premium subscription billing (Stripe)
- [ ] Personalized fabric recommendations (AI)
- [ ] Garment wardrobe tracker
- [ ] User authentication (AWS Cognito)

---

## Health Score Legend

| Score | Rating | Meaning |
|---|---|---|
| 80 – 100 | Excellent | Safe for all skin types, natural or eco-friendly |
| 50 – 79 | Caution | Generally safe, some considerations |
| 0 – 49 | Poor | Synthetic, may cause irritation or health issues |

---

*FabricIntel — helping people make healthier, more informed clothing choices.*
