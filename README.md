# OpsGrid — Regulatory Operations Table System

**OpsGrid** is a portfolio frontend project that demonstrates advanced async data-table engineering in a focused single-screen React application.

The app presents an operational compliance table for regulatory records. It shows how a data-heavy frontend interface can handle debounced search, server-style filtering, pagination, virtualization, caching, optimistic edits, rollback, and error recovery.

The visual design uses a stylized dark fantasy-inspired interface, but the content itself remains realistic and professional. The project is not a fantasy product. It is a regulatory operations table system with a distinctive visual identity.

---

## Project Purpose

OpsGrid was built as a focused frontend systems demo.

It is designed to show practical experience with:

* Data-heavy user interfaces
* Async state management
* Server-style table behavior
* Mock API architecture
* Optimistic mutations
* Error recovery
* UI state coordination
* Portfolio-quality visual polish

The project intentionally avoids authentication, routing, dashboards, charts, and large CRUD flows. It stays concentrated on one difficult frontend problem: building a reliable async operational data table.

---

## Core Features

### Async Table Behavior

* Debounced search
* Server-style filtering
* Server-style sorting
* Server-style pagination
* Cached page results
* Request cancellation with `AbortSignal`
* Stale request protection
* Loading, empty, and error states

### Table Engineering

* TanStack Table for headless table logic
* TanStack Virtual for virtualized row rendering
* Controlled sorting state
* Controlled row selection state
* Server-style sorting over the full dataset
* Scrollable table body
* Detail drawer for selected records

### Mutation Behavior

* Optimistic inline status updates
* Rollback on failed updates
* Bulk row selection
* Bulk “mark reviewed” action
* Rollback on failed bulk mutation
* Visible success and error feedback

### Demo Controls

The app includes visible demo controls so the async behavior can be tested directly:

* Change simulated API latency
* Force the next fetch request to fail
* Force the next update request to fail
* Clear query cache
* Reset generated demo data

---

## Tech Stack

* React
* TypeScript
* Vite
* TanStack Table
* TanStack Virtual
* TanStack Query
* Mock Service Worker
* CSS Modules
* CSS custom properties
* Vitest
* React Testing Library
* Playwright

---

## Data Domain

The application manages fictional operational compliance records.

Each record includes fields such as:

* Institution
* Report type
* Jurisdiction
* Deadline
* Validation status
* Risk level
* Assigned reviewer
* Last updated date
* Error count
* Submission status
* Priority score
* Description

The dataset is generated locally and contains approximately 5,000 records. The UI does not import this dataset directly. Instead, data flows through an API-like Mock Service Worker layer.

---

## Mock API

OpsGrid uses Mock Service Worker to simulate backend behavior.

The main fake API endpoints are:

```txt
GET /api/cases
PATCH /api/cases/:id
POST /api/cases/bulk-review
POST /api/demo/config
```

The `GET /api/cases` endpoint supports:

* Page
* Page size
* Search
* Status filter
* Risk filter
* Jurisdiction filter
* Sort field
* Sort direction

The mock API applies search, filtering, sorting, and pagination in the same order a backend service would normally apply them.

---

## Frontend Architecture

The application is structured around one main page:

```txt
App shell
  Header
  Architecture summary strip
  Demo controls
  Toolbar
  Bulk action bar
  Data table
  Pagination footer
  Detail drawer
```

State is split intentionally.

### Local React State

Used for UI state such as:

* Search input
* Filters
* Sorting
* Pagination
* Selected rows
* Selected record drawer
* Demo controls
* Notification messages

### TanStack Query

Used for async server state such as:

* Record page data
* Cached pages
* Status update mutations
* Bulk review mutations

---

## Styling Direction

OpsGrid uses a dark, stylized operational-dashboard visual style.

The design has a fantasy-inspired atmosphere, but only at the presentation layer. The table content, terminology, and workflows remain grounded in regulatory operations and compliance records.

The interface uses:

* Dark panels
* Gold borders
* Subtle glow accents
* Status badges
* Risk badges
* Compact toolbar controls
* Decorative but restrained visual details

The table remains readable and functional. The styling supports the portfolio identity without making the project feel like a game UI.

---

## Accessibility Goals

The project aims to include:

* Semantic buttons
* Proper input labels
* Keyboard-focusable controls
* Visible focus states
* Accessible checkbox labels
* Sort direction indicators
* Drawer close button
* Escape key support for closing the drawer
* Text labels in addition to color-based status styling

---

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the project:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## Portfolio Notes

This project is intended to demonstrate frontend engineering depth rather than product breadth.

The most important behaviors to inspect are:

* Search requests do not show stale results.
* Pagination behaves like server pagination.
* Previously loaded pages are cached.
* Status changes update optimistically.
* Failed mutations rollback visibly.
* Demo failure controls make error recovery testable.
* The UI remains stable, readable, and polished under async state changes.

---

## Project Status

OpsGrid is a portfolio demo project.

It is not connected to a real backend and does not use real regulatory, financial, or institutional data. All records are fictional and generated locally for demonstration purposes.
