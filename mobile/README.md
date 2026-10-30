# ABES Portal — Native Android App Module 📱

This folder contains the complete, modular native Android APK codebase for **ABES Portal**.

---

## 🌟 Key Highlights

- **Direct ERP Connection**: Bypasses browser CORS and Cloudflare Worker proxy via `@capacitor/core` native HTTP. Consumes **0 Cloudflare Worker requests**!
- **Matching Claymorphism UI**: 100% feature-parity with the web application (Pitch-Black OLED mode, 3D Mascot, Bunk Runway, Date-wise Timeline, Fast Login).
- **In-App Auto-Update Checker**: Checks GitHub Releases (`Om-Prakash-Verma/abes-portal`) on launch and prompts students whenever a new `.apk` is published.
- **Unified Analytics**: Configured with Google Analytics 4 (`platform: 'android_apk'`).

---

## 🛠️ How to Build the APK

### Option A: Automatic via GitHub Actions (Recommended)
1. Push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions (`.github/workflows/build-apk.yml`) will automatically:
   - Compile the Android APK in the cloud.
   - Attach `abes-portal.apk` directly to your GitHub Releases page!

### Option B: Local Build with Android Studio
1. Open this directory in terminal:
   ```bash
   cd mobile
   npm run build
   npx cap sync android
   ```
2. Open in Android Studio:
   ```bash
   npx cap open android
   ```
   *(Or open `mobile/android` directly in Android Studio)*
3. In Android Studio, go to **Build $\rightarrow$ Build Bundle(s) / APK(s) $\rightarrow$ Build APK(s)**.
4. Output file will be located at:
   `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📁 Architecture Overview

- `mobile/android/`: Native Android project (Gradle, Java/Kotlin, AndroidManifest).
- `mobile/src/services/api.js`: Direct HTTP API calling `https://erp.abes.ac.in` natively.
- `mobile/src/components/AppUpdateChecker.jsx`: In-app GitHub Release update notifier.
- `mobile/capacitor.config.json`: Capacitor Android configuration.
