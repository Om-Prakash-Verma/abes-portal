# 🎓 ABES ERP Modern Portal Client

A blazing-fast, modern, mobile-friendly frontend wrapper for the **ABES Engineering College ERP** (`erp.abes.ac.in`), built with **Vite + React + Tailwind CSS** and designed for zero-latency hosting on **Cloudflare Pages**.

Total bundle size is under **90 KB (gzipped)** and builds in **under 1 second**.

---

## ✨ Key Features

* **🔐 Direct ID + Password + OTP Login:**
  * Students enter their real **ERP User ID** and **Password**.
  * Clicks **"Send OTP"** $\rightarrow$ our backend proxy performs the ASP.NET handshake and triggers the official college OTP.
  * Student types the **6-digit OTP** $\rightarrow$ verifies, captures session cookies, and launches the live dashboard!
* **⚡ Lightning-Fast & Lightweight:** Pure static build powered by Vite & React 19. No bloated SSR, no server costs.
* **🎯 Smart Bunk / Attendance Predictor:**
  * Shows overall attendance with an SVG circular gauge.
  * Calculates exactly how many classes you can miss while staying above your target threshold (75%, 80%, 85%).
  * Calculates how many consecutive classes you must attend if you are in the shortage danger zone.
* **📚 Subject-wise Breakdown:**
  * Clean progress bars with a visible 75% target threshold marker.
  * Search subjects by name or course code.
  * Filter by **Safe ($\ge 75\%$)** and **Danger ($< 75\%$)** zones.
* **📅 Lecture History Drilldown:**
  * Click any subject to open a day-by-day attendance log.
  * Shows dates, lecture counts, topics covered, and status (Present vs Absent) with quick filters.
* **💳 Fee Receipts & Financials:**
  * Complete record of fee receipts and transaction amounts.
* **👤 Student Profile Badge:**
  * Displays student name, roll number, admission number, branch, semester, and parents' details.
* **🌓 Dark & Light Mode:**
  * Beautiful glassmorphic UI with full dark mode support, saved to local storage.

---

## 🛠️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Vite + React UI                      │
│   (Under 90 KB gzipped, static HTML/CSS/JS)            │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│        Cloudflare Pages Functions (/functions/api)     │
│   - /api/auth?action=send-otp (ASP.NET Handshake)      │
│   - /api/auth?action=verify-otp (Captures Set-Cookie)  │
│   - /api/abes/* (Edge proxy forwarding requests)       │
└──────────────────────────┬─────────────────────────────┘
                           │ (ASP.NET AJAX / JSON)
                           ▼
┌────────────────────────────────────────────────────────┐
│            Official ABES ERP (erp.abes.ac.in)          │
│   (100% untouched, read-only client queries)           │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

> In local dev, Vite's proxy automatically routes `/api/abes/*` to `https://erp.abes.ac.in` and handles `/api/auth` identically to Cloudflare Functions.

---

## ☁️ Deploying to Cloudflare Pages

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete modern portal with native ID + Password + OTP login"
   git push
   ```
2. In your [Cloudflare Dashboard](https://dash.cloudflare.com):
   * Go to **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Connect to Git**.
   * Select this repository.
   * Set:
     * **Framework preset:** `Vite`
     * **Build command:** `npm run build`
     * **Output directory:** `dist`
   * Click **Save and Deploy**.

Cloudflare Pages will automatically detect the `functions/` directory and deploy both the static frontend and the edge proxy together in ~20 seconds!
