# Changelog

All notable changes to the ABES Portal web and mobile applications are documented in this file.

## [1.0.9] - 2026-10-31

### Added & Improved
- **Single Source of Truth Configuration**: Centralized all versioning (`version.json`) across native Android Gradle, Web UI, and Mobile UI.
- **Dynamic Release Notes Pipeline**: In-app update checker and GitHub Releases now display real version-specific changelogs extracted directly from CHANGELOG.md.
- **Synchronized Version Badges**: Header buttons, profile badges, and mascot prompts now update automatically with zero manual code edits.

---

## [1.0.8] - 2026-10-31

### Fixed
- **False Session Expired Status**: Fixed issue where the user profile menu showed "ERP Session Life: Expired" despite the session being actively maintained in the background.
- **Inconsistent Version Badges**: Replaced hardcoded legacy version numbers (`v1.0.4`) in the mobile header, modals, and profile drawer with a dynamic central configuration.

### Added & Improved
- **Timeline Activity Feed Overhaul**: Redesigned the Date-Wise Timeline into an activity feed with calendar badges, lecture cards, and quick filter chips.
- **High-Contrast OLED Attendance Card**: Streamlined the Attendance Overview with 75% / 80% / 85% goal selector, instant Bunk Runway calculator, and attendance rate metrics.
- **Centralized Versioning**: Established single source of truth (`version.json`) driving Android Gradle builds, Web UI, and Mobile UI.

---

## [1.0.7] - 2026-10-31

### Added & Improved
- **Mobile UI Overhaul**: Unified hero attendance card, clean 2-row navigation toolbar, circular user avatar, and compact mobile list view.
- **OLED Pitch Black Theme**: Battery-saving dark mode optimized for AMOLED displays.

---

## [1.0.6] - 2026-10-31

### Fixed
- **Mobile Keep-Alive Loop**: Improved Android background service lifecycle management and notification persistence.
- **Notch Safe Areas**: Prevented UI overlap with punch-holes and camera cutouts on modern Android devices.

---

## [1.0.5] - 2026-10-31

### Added
- **Web APK Mascot & Promo Banner**: Interactive mascot on web login informing users about the zero-relogin Android application.

---

## [1.0.4] - 2026-10-30

### Added
- **In-App Auto-Updater**: Native update detection querying GitHub Releases with direct 1-tap APK download and installation prompts.

---

## [1.0.0] - [1.0.3] - 2026-10-30

### Initial Releases
- Native Capacitor Android wrapper for ABES Portal.
- Direct phone-to-ERP cookie synchronization via `CapacitorCookies`.
- Foreground service background heartbeat pinging `KeepSessionAlive.aspx` every 10 minutes.
- Automated release builds via GitHub Actions.
