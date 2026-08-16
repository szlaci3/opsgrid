# DECISIONS.md

## In a nutshell

This file records accepted technical decisions for OpsGrid.

This document exists to prevent architectural drift. Coding agents must follow the accepted decisions below. If another document seems less specific, this file wins.

---

# Decision 1 — Prefer partial text matching for dynamic test values

## Decision

Prefer partial text matching for dynamic values that are outside the test's purpose.

## Example

For `Showing 1-25 of 5,000 cases`, assert `Showing 1-25` unless the total is the behavior under test.

## Rationale

Keep tests focused on the behavior they verify and independent of changeable fixture totals.

## Consequences

Tests remain stable when the dataset size changes, but total-record validation must be added explicitly when required.
