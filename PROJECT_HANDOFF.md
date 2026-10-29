# ABES Modern Portal — Project Handoff & Architecture Guide

## 🎯 Project Overview
A high-performance, mobile-first Progressive Web App (PWA) client for ABES Engineering College students, engineered for seamless hosting on **Cloudflare Pages**.

The portal replaces the outdated web interface with a tactile **Claymorphism** dashboard featuring live attendance calculations, bunk/attend runways, chronological date-wise lecture timelines, fee receipts, student profile records, and an interactive 3D animated companion.

---

## 📍 System Architecture & Components

The project uses a clean decoupled architecture where the frontend communicates exclusively through an abstracted edge proxy:

```
┌────────────────────────────────────────────────────────┐
│                   Vite + React UI                      │
│   - Claymorphic Design System (#EEF3F8)                │
│   - Progressive Web App (PWA) + Service Worker         │
│   - 3D Interactive Mascot (Cursor tracking & emotions) │
│   - Subject-Wise & Date-Wise Attendance Views          │
└──────────────────────────┬─────────────────────────────┘
                           │ (Internal App Endpoints)
                           ▼
┌────────────────────────────────────────────────────────┐
│        Cloudflare Pages Functions (/functions/api)     │
│   - /api/auth?action=send-otp (College Email Dispatch) │
│   - /api/auth?action=verify-otp (Multi-Cookie Ticket)  │
│   - /api/abes/* (Abstracted Edge Proxy with CORS)      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               College Academic Backend                 │
│   (100% read-only queries, no backend alterations)     │
└────────────────────────────────────────────────────────┘
```

---

## 🔒 Security & Privacy Implementation

To prevent unauthorized scraping and protect college infrastructure:
1. **Endpoint Redaction:** All direct URLs, server endpoints, and internal ASP.NET parameters have been completely removed from public documentation and client-side code.
2. **Abstracted Edge Proxy:** Communication is routed strictly through `/api/auth` and `/api/abes/*`. The edge proxy injects necessary headers and forwards authenticated requests securely.
3. **Client-Side Session Storage:** Authentication tickets are stored strictly in the user's browser `localStorage` and sent via sanitized proxy headers. No user data is logged or stored in external databases.
4. **Smart Caching Layer:**
   - 30-minute local storage cache for profile, fee history, and semester attendance.
   - In-memory session cache for subject drilldown lecture logs.
   - Slashes edge worker usage by over 80%.

---

## 📁 Key File Structure

* **`src/`**:
  * **`components/`**:
    * `LoginMascot.jsx`: 3D animated companion with cursor tracking, happy ID typing, and hands covering eyes during password/OTP input.
    * `LoginPage.jsx`: 2-step login with ERP ID, password check, and college email OTP verification.
    * `OverallAttendanceCard.jsx`: Executive KPI ribbon (percentage, target delta, bunk runway, attended ratio).
    * `DateWiseAttendanceView.jsx`: Daily chronological attendance timeline across all registered subjects.
    * `SubjectCard.jsx`: Tactile clay cards with recessed progress tracks and bunk indicators.
    * `SubjectTableView.jsx`: High-density widescreen table view.
    * `SubjectDetailModal.jsx`: Chronological lecture log modal with weekday tags and sort toggle.
    * `ProfileModal.jsx`: Student admission details and university roll info.
    * `FeeReceiptsModal.jsx`: Fee transaction logs and receipt records.
    * `InstallPrompt.jsx`: PWA install banner with iOS home-screen guide and offline status indicator.
    * `Header.jsx`: Full-width claymorphic header with avatar, fee shortcut, and live refresh.
  * **`services/api.js`**: Core client service managing authentication state, 30-min cache, dynamic semester derivation (`deriveSemId`), and proxy queries.
* **`functions/api/`**:
  * `auth.js`: Edge function handling OTP dispatch to college email and session verification.
  * `[[route]].js`: Edge catch-all proxy forwarding requests and handling CORS.
* **`public/`**:
  * `manifest.webmanifest`: W3C Web App Manifest for mobile and desktop standalone app installation.
  * `sw.js`: Service worker providing shell caching and offline resilience.
  * `icon.svg`, `pwa-192.png`, `pwa-512.png`: High-resolution vector and PNG app icons.
* **`vite.config.js`**: Vite configuration with integrated development proxy mirroring Cloudflare Functions.

---

## 🚀 Development & Build Commands

* **Local Development Server:**
  ```bash
  npm run dev
  ```
* **Production Build:**
  ```bash
  npm run build
  ```
  *(Generates `dist/` bundle in under 1 second)*
