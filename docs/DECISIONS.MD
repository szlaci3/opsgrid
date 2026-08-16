# DECISIONS.md

## In a nutshell

This file records accepted technical decisions for OpsGrid.

This document exists to prevent architectural drift. Coding agents must follow the accepted decisions below. If another document seems less specific, this file wins.

---

# Decision 1 — Prefer partial text matching for dynamic UI test values

## Decision

Prefer partial text matching for dynamic values that are outside the test's purpose, in both Playwright and Vitest RTL tests.

## Example

For `Showing 1-25 of 5,000 cases`, a Playwright test can use `page.getByText("Showing 1-25")`; a Vitest RTL test can use `screen.getByText(/^Showing 1-25\b/)`. Assert `Showing 1-25` unless the total is the behavior under test.

## Rationale

Keep tests focused on the behavior they verify and independent of changeable fixture totals.

## Consequences

Tests remain stable when the dataset size changes, but total-record validation must be added explicitly when required.

---

# Decision 2 — Match the showing-footer shape unless its range is under test

## Decision

When a test only needs to establish that the cases table has rendered, match the footer with `^Showing .* cases$`. This accepts valid empty, partial, and full-page messages such as `Showing 0 cases` and `Showing 1-3 of 3 cases`.

Do not use this matcher alone to wait for a successful non-empty query: the initial render also shows `Showing 0 cases`. Pair it with a row or query-data assertion when loaded records are required.

Assert an exact showing range only when that range is the behavior under test. TC-051 is one such case because it verifies the configured maximum page size.

## Rationale

The footer's numeric range changes with the mocked dataset, active filters, and configured page size. Tests that are not about those values should not depend on them.

## Consequences

Tests remain meaningful when fixture counts change. Pagination and page-size tests must use explicit range or page-indicator assertions when they need to verify a particular navigation result.
