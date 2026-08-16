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
