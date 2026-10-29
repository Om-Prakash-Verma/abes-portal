# ABES ERP Modern Portal — Project Handoff & Memory File

## 🎯 Project Overview
A lightning-fast, modern, mobile-friendly standalone frontend client for the **ABES Engineering College ERP** (`erp.abes.ac.in`), designed to be hosted on **Cloudflare Pages**. 

The goal is to replace the dated, clunky ASP.NET interface with a clean dashboard offering attendance tracking, bunk/attend calculators, fee logs, and profile info without modifying the college backend.

---

## 📍 Current State & What Was Accomplished

1. **Reverse-Engineering & Traffic Capture Completed:**
   - Captured full authenticated session traffic via Playwright (`captured_traffic.json`, `captured_cookies.json`).
   - Verified that ERP endpoints use **ASP.NET AJAX PageMethods (`application/json`)** returning JSON wrapped in `.d`.
   - Verified live querying with a direct Node.js `fetch()` — returned Status `200 OK` with 17 subjects and 77.78% total attendance.

2. **Security & Privacy Protected:**
   - [`.gitignore`](.gitignore) is created and excludes `node_modules/`, `captured_traffic.json`, `captured_cookies.json`, `captured_summary.json`, `.env`, and build artifacts.

3. **Tech Stack Installed (Optimized for Cloudflare Pages):**
   - **Frontend:** Vite + React 19 + Tailwind CSS + Lucide Icons (lightweight, <150KB bundle).
   - **API Proxy:** Cloudflare Pages Functions (`/functions/api/`) — edge-native, 0ms cold start, free tier, eliminates browser CORS.
   - Dependencies installed (`package.json`, `tailwind.config.js` written).

---

## 🔗 Reverse-Engineered Endpoints Reference

All endpoints accept `Content-Type: application/json; charset=utf-8` and require `Cookie: ASP.NET_SessionId=...; MyAuth=...; cf_clearance=...`.

### 1. Overall & Subject-wise Attendance
* **URL:** `POST https://erp.abes.ac.in/ERP/Dashboard/Student/Attendance/Default.aspx/getStudentAtt`
* **Payload:** `{"StudentDashBAL": {"semid": "CS05", "mode": "MyAttendance"}}`
* **Response:** Array of subjects containing:
  - `SubCollegeCode`, `SubName`, `NoOfLecture`, `Present`, `Absent`, `Percentage`, `Action` (contains subject ID like `SU00247`).
  - Total summary object with overall lecture counts and percentage.

### 2. Day-by-Day Subject Lecture History
* **URL:** `POST https://erp.abes.ac.in/ERP/Dashboard/Student/Attendance/Default.aspx/getSubjectAtt`
* **Payload:** `{"StudentDashBAL": {"semid": "CS05", "subjectid": "SU00247", "mode": "MySubjectAttendance"}}`
* **Response:** Array of lecture entries with `AttDate` (e.g. `14 Aug 2026`), `NoOfLecture`, and `Attendance` (`P` or `A`).

### 3. Student Profile Info & Photo
* **URL:** `POST https://erp.abes.ac.in/ERP/Dashboard/Student/MyProfile/Default.aspx/getStudentProfile`
* **Payload:** `{"StudentDash": {"mode": "StudentProfile"}}`
* **Response:** Full profile details (Name, Roll No, Branch, Semester, Parent info, Address, photo byte array).
* **Direct Photo URL:** `GET https://erp.abes.ac.in/Services/ProfilePic.aspx?ID=<AdmissionNo>`

### 4. Fee Receipts & Payment History
* **URL:** `POST https://erp.abes.ac.in/ERP/Dashboard/Student/Fina_StuDetail/RcptHistory.aspx/get_StuFeeHistory`
* **Payload:** `{"objStudFee": {"fromdate": "", "todate": ""}}`
* **Response:** Array of receipts (`FeeRecieptNo`, `ReceiptDate`, `AmountReceived`, `Mode`).

---

## 🚀 Immediate Next Steps When Resuming

1. **Complete Vite Setup:**
   - Create `postcss.config.js` and `vite.config.js`.
   - Create `index.html`, `src/index.css`, `src/main.jsx`.

2. **Implement Cloudflare Pages Functions Proxy:**
   - Create `functions/api/[[route]].js` to proxy requests to `https://erp.abes.ac.in` and forward cookies/responses.

3. **Build the Modern UI Components:**
   - **Login View:** Clean login card (ERP ID, Password, Captcha, OTP input step, and Demo/Saved Session mode).
   - **Dashboard Overview:**
     - Radial attendance gauge (Green $\ge 75\%$, Yellow $65-74\%$, Red $<65\%$).
     - **"Bunk / Attend" Calculator** (e.g., *"You can bunk 3 more classes"* or *"Attend 4 more to reach 75%"*).
     - Subject cards with progress bars and search/filter.
     - Drilldown modal showing day-by-day attendance log.
   - **Profile & Fees Tabs:** Clean receipt cards and student ID badge.
   - **Dark Mode Toggle.**
