import type { OperationalCase } from "../features/cases/types";
import { generateCases } from "./generateCases";

const initialCases = generateCases();
let cases = initialCases.map((item) => ({ ...item }));

export function getCases(): OperationalCase[] {
  return cases;
}

export function setCases(nextCases: OperationalCase[]): void {
  cases = nextCases.map((item) => ({ ...item }));
}

export function resetCases(): void {
  cases = initialCases.map((item) => ({ ...item }));
}

export function updateCase(
  id: string,
  patch: Partial<OperationalCase>,
): OperationalCase | null {
  const index = cases.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updated = {
    ...cases[index],
    ...patch,
    lastUpdated: new Date().toISOString(),
  };

  cases = [...cases.slice(0, index), updated, ...cases.slice(index + 1)];
  return updated;
}

export function bulkReviewCases(ids: string[]): OperationalCase[] {
  const selected = new Set(ids);
  const updated: OperationalCase[] = [];
  const lastUpdated = new Date().toISOString();

  cases = cases.map((item) => {
    if (!selected.has(item.id)) {
      return item;
    }

    const next = { ...item, status: "reviewed" as const, lastUpdated };
    updated.push(next);
    return next;
  });

  return updated;
}
