# 🎓 ABES Modern Student Portal

A blazing-fast, modern, mobile-first Progressive Web App (PWA) client for ABES Engineering College students, engineered with **Vite, React 19, and Tailwind CSS** for edge deployment on **Cloudflare Pages**.

The portal delivers an ultra-smooth, tactile **Claymorphism** interface with live attendance tracking, bunk/attend calculators, chronological date-wise lecture timelines, fee receipts, student profile records, and an interactive 3D animated companion.

Total production bundle is under **90 KB (gzipped)** with a sub-second initial load.

---

## ✨ Features & Capabilities

### 🤖 1. Interactive 3D Animated Login Companion
* **Real-Time Cursor Tracking:** In the idle state, the character's head and eyes smoothly track cursor position across the screen using 3D perspective tilt and pupil positioning.
* **Happy ID Typing Emotion:** When entering your ERP ID / Admission Number, the companion smiles cheerfully with blushing cheeks and playful head bobs.
* **Privacy Guard Mode:** When focusing on the password or OTP verification fields, the companion glides its 3D hands up to cover its eyes.
* **Peeking Easter Egg:** Toggling the password visibility icon makes the mascot slide its hands aside to peek playfully with one eye.
* **College Email Delivery:** OTP requests are verified and dispatched directly to the student's official college email ID.

### 📱 2. Progressive Web App (PWA) & Offline Mode
* **Home Screen Installable:** Installable as a standalone app on Android, iOS, Windows, and macOS with dedicated app icons and no browser URL bar.
* **Service Worker Caching (`sw.js`):** Pre-caches app shell assets for instant launch.
* **Offline Access:** Coupled with smart 30-minute client caching, students can view their attendance logs, subject breakdown, and fee receipts even without an active internet connection.

### 📅 3. Dual Perspective Attendance Views
* **📚 Subject-Wise Attendance:**
  - Executive KPI Ribbon: Overall percentage, target threshold delta, bunk runway, and attended vs total metrics.
  - Interactive Target Slider: Adjust between 75%, 80%, and 85% to recalculate exact safe bunk limits or required attendance.
  - Multi-View Layouts: Switch between responsive Claymorphic Subject Cards and a widescreen density Table View.
  - Status Filtering & Search: Filter courses into **Shortage Danger** and **Safe Zone** with real-time course search.
* **📅 Date-Wise Attendance Timeline:**
  - Aggregated chronological timeline of every lecture conducted across all registered subjects.
  - Daily summary cards displaying total lectures held, classes attended, missed sessions, and daily percentage score.
  - Filter timeline by **All Days**, **Missed Days**, or **100% Full Attendance Days**, with date/course search.

### 🔍 4. Subject Drilldown Modal
* Click any course to view its comprehensive lecture history.
* Strictly sorted in chronological order (default: newest sessions first) with sort direction toggle.
* Displays calendar date, weekday, lecture count, topic covered, and Present/Absent badges.

### 💳 5. Financials & Student Profile
* **Fee Payment Statement:** Review fee transaction history, dates, receipt numbers, payment modes, and clearance status.
* **Verified Profile Card:** View student admission details, university roll number, father's name, branch, and dynamic semester.

### 🧱 6. Tactile Claymorphism & OLED Black Dark Mode
* **Light Mode:** Designed with soft pillowy clay surfaces, multi-layered ambient drop shadows, and inset progress tracks on a calming `#EEF3F8` backdrop.
* **OLED Black Dark Mode:** Deep, true-black (`#000000`) theme with glowing indigo accents and high-contrast dark clay cards, perfect for battery saving and night study sessions.
* **Theme Persistence:** Seamless toggle available on both the login screen and authenticated dashboard header, synced with system preferences and persisted in local storage.
* Optimized for touch devices with safe-area spacing and bottom-sheet drawers on mobile viewports.

---

## 🔒 Security & Privacy Architecture

To protect student privacy and ensure college infrastructure integrity:
* **Zero Backend Tampering:** The college ERP server remains completely read-only. No modifications, scraping bots, or unauthorized endpoints are exposed.
* **Internal Abstracted Proxy:** All internal college endpoints, payloads, parameter names, and viewstate tokens are abstracted inside secure edge functions (`/api/*`). No direct backend URLs or server addresses are exposed in the client or documentation.
* **Secure Session Handling:** Session tokens are stored strictly within the student's local browser storage and edge proxy headers, never logged or persisted on external databases.
* **80%+ Worker Request Reduction:** Intelligent 30-minute local storage caching and in-memory session caches prevent repetitive traffic spikes to edge workers.

---

## 🛠️ Tech Stack

* **Framework:** React 19 + Vite 8
* **Styling:** Tailwind CSS + Custom Claymorphism Plugin
* **Icons:** Lucide React
* **Hosting & Edge Functions:** Cloudflare Pages + Cloudflare Pages Functions
* **PWA:** Web App Manifest + Service Worker API

---

## 🚀 Getting Started Locally

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## ☁️ Deploying to Cloudflare Pages

1. Push your repository to GitHub:
   ```bash
   git add -A
   git commit -m "feat: deploy modern portal"
   git push origin main
   ```

2. In the [Cloudflare Dashboard](https://dash.cloudflare.com):
   - Navigate to **Compute (Workers) > Pages > Connect to Git**.
   - Select your repository.
   - Configure build settings:
     - **Framework preset:** `Vite`
     - **Build command:** `npm run build`
     - **Output directory:** `dist`
   - Click **Save and Deploy**.

Cloudflare Pages automatically discovers the `/functions` directory and deploys both the static frontend and the edge proxy together with zero extra configuration.
