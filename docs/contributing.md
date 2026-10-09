# Contributing Guidelines — Kasir Terbuka

Thank you for contributing to Kasir Terbuka! Kasir Terbuka is a free, open-source, local-first point-of-sale app designed for small Indonesian shops.

Please read this document and [AGENTS.md](../AGENTS.md) carefully before submitting pull requests or making modifications.

---

## 1. Principles & Non-Goals

### Core Principles

- **Local-first:** No backend, no accounts on a cloud server. All data lives on the user's device in IndexedDB via Dexie.js.
- **Free forever:** No subscription fees, no telemetry by default, no paid cloud lock-in.
- **Fast at the counter:** The cashier sale workflow must take under 30 seconds.
- **Zero runtime network requests:** Must work 100% offline. All assets (fonts, icons) are bundled locally.
- **Calm, low-noise UI:** High contrast, legible, no gradients, no arbitrary shadows, no colorful badges (see [DESIGN.md](../DESIGN.md)).

### Non-Goals (Do Not Implement)

- Remote cloud syncing or server-side databases
- Online payment gateway webhooks (payments are recorded manually as Cash/QRIS/Transfer)
- Multi-branch synchronization or e-commerce integrations
- Anything requiring a recurring paid external service

---

## 2. Tech Stack

- **Framework:** React 19+ with Vite and TypeScript (strict mode)
- **Styling:** Tailwind CSS with semantic design tokens from `DESIGN.md`
- **Database:** Dexie.js (IndexedDB) with schema versioning and transactional atomicity
- **State Management:** Zustand (cart and UI state), Dexie repositories for persistence
- **Validation:** Zod schemas
- **Icons:** Lucide React
- **Typography:** Plus Jakarta Sans (`@fontsource/plus-jakarta-sans`, offline)
- **Testing:** Vitest, React Testing Library, fake-indexeddb
- **License:** GNU Affero General Public License v3.0 (AGPL-3.0)

---

## 3. Development Workflow

### Prerequisites

- Node.js 20+
- pnpm 10+ or 12+

### Commands

```bash
pnpm install     # Install dependencies
pnpm dev         # Start local Vite development server
pnpm build       # Compile TypeScript and build production bundle
pnpm preview     # Preview production build locally
pnpm test        # Run unit and integration tests with Vitest
pnpm lint        # Run ESLint rules
pnpm typecheck   # Check TypeScript types (tsc -b)
pnpm format      # Format codebase with Prettier
```

**Definition of Done:** Before opening a PR or declaring a task complete, run:

```bash
pnpm typecheck && pnpm lint && pnpm test
```

All checks must pass cleanly.

---

## 4. Code & Architecture Rules

1. **Repository Access Layer:**
   - UI components must **never** call Dexie directly. Always use the repositories in `src/db/repositories/`.
2. **Business Logic:**
   - Totals, change calculation, stock adjustments, and report sums must live in pure, exported TypeScript functions in `src/lib/` or `src/features/*/` that can be tested in isolation without React.
3. **Money Handling:**
   - Money is strictly stored as **integer Rupiah** (no floats).
   - Format money with the centralized helper in `src/lib/money.ts` (`formatRupiah(amount)`).
4. **Internationalization (i18n):**
   - Code, identifiers, and comments are in **English**.
   - User-facing UI text is in **Indonesian** and must live in `src/i18n/id.json`. Never hardcode raw user strings inside JSX.
5. **Atomic Transactions:**
   - Sales, stock decrements, and invoice counter increments must happen inside a single Dexie transaction. If an item lacks stock, abort the entire transaction.
6. **Destructive Action Confirmations:**
   - Always name the entity being acted on (e.g., "Batalkan transaksi INV-20261009-0001?") and state the direct consequence ("Stok akan dikembalikan.").

---

## 5. Commit Guidelines

We follow the Conventional Commits specification:

- `feat:` New user-facing feature or enhancement
- `fix:` Bug fix
- `docs:` Documentation additions or updates
- `refactor:` Code restructuring without functional changes
- `test:` Unit or integration test additions
- `chore:` Maintenance, configuration, or dependency updates

---

## 6. Testing Standards

- Maintain at least 70% test coverage for database repositories, calculation utilities, and business workflows.
- Always use `fake-indexeddb` for Dexie and IndexedDB tests.
- Reset database state in `beforeEach()` blocks in all repository and page test suites.
- Do not make external HTTP requests in tests.
