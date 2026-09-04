# EduLedger 3D

Offline-first, multi-school fee management desktop app. Dark glassmorphic /
neumorphic UI with 3D mouse-tilt cards, a reactive parallax background, and
neon status indicators (emerald = paid, amber = pending, crimson = overdue).
Built with **Electron + Vite + React + Tailwind CSS**, backed by
**SQLite (better-sqlite3)** — every school's data lives in its own isolated
`.db` file on the user's machine, with **zero network access required**.

---

## 1. Features

- **Multi-school architecture** — up to 5 schools per organization, each with
  its own isolated SQLite database (`school_<id>.db`), profile, logo, stamp,
  receipt prefix, and academic year.
- **Student & academic management** — classes from Pre-Primary (Nursery/LKG/UKG)
  through 10th, plus Senior Secondary 11th & 12th with Stream selection
  (Science-Medical, Science-Non-Medical, Commerce, Arts/Humanities) and
  dynamic subject tagging.
- **Live fee ledger** — total fee, concession/scholarship, total paid, balance
  pending, due date, and an auto-computed status: `Fully Paid`, `Partially
  Paid`, `Overdue`, `Pending`.
- **Fee entry & automated receipts** — record a payment (Cash / Cheque / UPI /
  Bank Transfer / DD), auto-numbered receipts (`SCH1-2026-0042`), amount
  converted to words, print-optimized A4 receipt with **Print** and **Save as
  PDF** built in.
- **3D / parallax UI** — mouse-tracking tilt on cards & modals (VanillaTilt.js),
  a multi-layer parallax backdrop (Framer Motion + custom canvas-free layers),
  glowing status chips, and a particle burst on successful payment.
- **Backup & restore** — one-click JSON export/import per school, plus raw
  `.db` file export, all fully offline.
- **Fully offline** — no server, no internet connection, no telemetry. All
  data is stored locally under the OS user-data folder.

---

## 2. Project Structure

```
eduledger3d/
  electron/                 Electron main process (Node.js side)
    main.js                 BrowserWindow bootstrap
    preload.js               contextBridge-exposed IPC API (window.api)
    db.js                     better-sqlite3 connection manager (org + per-school)
    ipcHandlers.js           All IPC business logic (CRUD, payments, backup)
    schema_org.sql            org.db schema (organization + school registry)
    schema_school.sql        school_<id>.db schema (students/fees/payments)
    utils/numberToWords.js   Indian-numbering amount-to-words converter
    utils/receiptTemplate.js Print-ready receipt HTML template
  src/                       React renderer (Vite)
    components/              Reusable UI: ParallaxBackground, TiltCard, StatusChip,
                              ParticleBurst, Sidebar, TopBar, Modal, etc.
    features/                 AddEditStudentModal, FeeEntryModal
    pages/                    Dashboard, Students, StudentDetail, FeeStructures,
                              Receipts, Settings, Onboarding
    store/appStore.js         Zustand global state (active school, toasts, etc.)
    api/client.js             Thin wrapper over window.api
  build/                     App icons (icon.ico / icon.png) for electron-builder
  package.json                Scripts + electron-builder config
```

**Data isolation:** all data is written to
`<OS user-data dir>/eduledger-data/` — `org.db` for the organization/school
registry, and one `school_<id>.db` per school. Deleting or backing up one
school never touches another's file.

---

## 3. Prerequisites

- [Node.js](https://nodejs.org/) 18 or 20 LTS (includes npm)
- Windows, macOS, or Linux build machine (to produce a Windows `.exe`, you can
  build **on Windows directly**, or on macOS/Linux with `electron-builder`'s
  cross-build support — native Windows is the most reliable option because of
  the native `better-sqlite3` module)

---

## 4. Install & Run in Development

```bash
cd eduledger3d
npm install
npm run dev
```

This starts the Vite dev server and launches the Electron window pointed at
it, with hot reload for the renderer.

> `npm install` triggers `postinstall` → `electron-builder install-app-deps`,
> which rebuilds `better-sqlite3`'s native binding against your installed
> Electron version. If you ever see a `NODE_MODULE_VERSION` mismatch error,
> re-run:
> ```bash
> npx electron-builder install-app-deps
> ```

---

## 5. Building the Production Installer (.exe)

To produce a single-file Windows installer:

```bash
npm run build:win
```

This will:
1. Build the React/Vite renderer into `dist/`.
2. Package the Electron app + `dist/` + `electron/` with `electron-builder`.
3. Produce an NSIS installer at `release/EduLedger 3D Setup <version>.exe`.

The generated installer is fully self-contained — double-click to install,
then run **EduLedger 3D** completely offline (no internet connection is ever
required, including on first run).

Other targets:

```bash
npm run build:mac     # macOS .dmg
npm run build:linux   # Linux AppImage
```

### Building a Windows .exe from macOS/Linux

electron-builder can cross-compile the NSIS target from macOS/Linux, but
`better-sqlite3` is a **native** module compiled per-platform. The safest,
most reliable path is:

- Build on a Windows machine (or Windows VM/CI runner), **or**
- Use a CI service (GitHub Actions `windows-latest` runner) with:
  ```yaml
  - run: npm install
  - run: npm run build:win
  ```

---

## 6. Data, Backup & Restore

- Data directory is shown in **Settings & Backup** inside the app (typically
  `%APPDATA%/EduLedger 3D/eduledger-data` on Windows).
- **Export Backup (JSON)** — full snapshot of one school's academic years,
  fee structures, students, and payments — human-readable and portable.
- **Export Raw Database (.db)** — a byte-for-byte copy of that school's
  SQLite file, useful for full-fidelity backups.
- **Import Backup (JSON)** — restores a school's data from a previously
  exported JSON file (overwrites current data for that school only).

Back up regularly — e.g. copy the `eduledger-data` folder to a USB drive or
network share periodically, since this app has no cloud sync by design.

---

## 7. Receipts

Receipts are generated on the fly as a print-ready HTML document (A4,
`@media print` styling) and can be:
- **Printed** directly via the OS print dialog (works with standard A4 or
  thermal receipt printers), or
- **Saved as PDF** via a native save dialog, using Electron's built-in
  `printToPDF`.

Receipt numbers follow `<RECEIPT_PREFIX>-<YEAR>-<0001>` and increment per
academic year, per school (tracked in `receipt_counters`). Amounts are
automatically converted to words using the Indian numbering system
(Thousand/Lakh/Crore).

---

## 8. Notes for Further Customization

- **Theme accents** — Tailwind config (`tailwind.config.js`) defines the
  `neon.emerald / amber / crimson / violet / cyan` palette used throughout.
- **Class list / streams** — edit `src/utils/classList.js` and
  `src/utils/streams.js` to adjust the grade levels, streams, or subject
  lists for your board/curriculum.
- **App icon** — replace `build/icon.png` / `build/icon.ico` with your own
  branding before shipping (a starter icon is included).
- **Code signing** — for public distribution, configure `win.certificateFile`
  / notarization settings in `package.json`'s `build` block per
  electron-builder's docs; unsigned installers will show an "unknown
  publisher" warning on first run, which is expected for internal/offline
  deployments.
