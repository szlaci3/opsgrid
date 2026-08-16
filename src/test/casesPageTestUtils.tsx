import { screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import type { CasesResponse, CasesQueryParams } from "../api/apiTypes";
import { CasesPage } from "../features/cases/CasesPage";
import { renderWithProviders } from "./testUtils";

export const showingCases = /^Showing .* cases$/;

export async function renderLoaded() {
  const result = renderWithProviders(<CasesPage />);
  await screen.findByText(showingCases);
  await screen.findAllByRole("checkbox", { name: /^Select CASE-/ });
  return result;
}

export function getCasesQueryData(
  queryClient: ReturnType<typeof renderWithProviders>["queryClient"],
  predicate: (params: CasesQueryParams) => boolean = () => true,
): CasesResponse | undefined {
  const query = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["cases"] })
    .find((candidate) => {
      const params = candidate.queryKey[2] as CasesQueryParams | undefined;
      return params ? predicate(params) : false;
    });

  return query?.state.data as CasesResponse | undefined;
}

export async function waitForCasesQuery(
  queryClient: ReturnType<typeof renderWithProviders>["queryClient"],
  predicate: (params: CasesQueryParams) => boolean = () => true,
  timeout = 1_000,
) {
  await waitFor(() => {
    expect(getCasesQueryData(queryClient, predicate)).toBeDefined();
  }, { timeout });

  return getCasesQueryData(queryClient, predicate)!;
}

export function getDataRows() {
  return screen.getAllByRole("row").slice(1);
}

export function getStatusSelects() {
  return screen.getAllByRole("combobox", { name: /update case status/i });
}

export function getSelectionCount(count: number) {
  return screen.getByText((_, element) => element?.textContent === `${count} selected`);
}
