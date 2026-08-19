import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getCases } from "../mocks/db";
import { mockConfig } from "../mocks/mockConfig";
import { CasesPage } from "../features/cases/CasesPage";
import { renderWithProviders } from "./testUtils";
import {
  getDataRows,
  getSelectionCount,
  renderLoaded,
  showingCases,
  waitForCasesQuery,
} from "./casesPageTestUtils";

describe("CasesPage filtering and pagination", () => {
    it("TC-004 debounces search input and replaces the unfiltered result set", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      renderWithProviders(<CasesPage />);

      await screen.findByText(showingCases);
      await screen.findAllByRole("checkbox", { name: /^Select CASE-/ });
      const initialFooter = screen.getByText(showingCases).textContent;
      const search = screen.getByRole("searchbox", { name: "Search" });
  
      await user.type(search, "liquidity");
  
      expect(search).toHaveValue("liquidity");
      expect(screen.getByText(showingCases)).toBeInTheDocument();
  
      await waitFor(() => {
        expect(screen.getByText(showingCases).textContent).not.toBe(
          initialFooter,
        );
      });
  
      expect(screen.getAllByText("Liquidity Coverage Report").length).toBeGreaterThan(0);
    });

    it("TC-005 searches case-insensitively across every supported API field", { tags: ["tier-2"], timeout: 20_000 }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      const sourceCases = getCases();
      const searchableValues = [
        sourceCases[0].institution,
        sourceCases[0].reportType,
        sourceCases[0].jurisdiction,
        sourceCases[0].submissionCode,
        sourceCases.find((item) => item.assignedReviewer)?.assignedReviewer ?? "Mira Janssens",
        sourceCases[0].description,
      ];
      const search = screen.getByRole("searchbox", { name: "Search" });
  
      for (const value of searchableValues) {
        await user.clear(search);
        await user.type(search, value.toUpperCase());
        const data = await waitForCasesQuery(
          queryClient,
          (params) => params.search === value.toUpperCase(),
        );
  
        expect(data.total).toBeGreaterThan(0);
        expect(data.page).toBe(1);
      }
    });

    it("TC-006 shows the empty state and recovers with Reset filters", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      const search = screen.getByRole("searchbox", { name: "Search" });
  
      await user.type(search, "this-value-cannot-match-generated-data");
      await screen.findByText("No cases match the current filters.");
      expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();
  
      await user.click(screen.getByRole("button", { name: "Reset filters" }));
      await screen.findByText(showingCases);
      expect(search).toHaveValue("");
    });

    it("TC-007 filters rows by status and resets to page 1", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "approved");
  
      const data = await waitForCasesQuery(queryClient, (params) => params.status === "approved");
      expect(data.page).toBe(1);
      expect(data.total).toBeLessThan(5_000);
      getDataRows().forEach((row) => expect(row).toHaveTextContent("Approved"));
    });

    it("TC-008 filters visible rows by risk level", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      renderWithProviders(<CasesPage />);

      await screen.findByText(showingCases);
      await screen.findAllByRole("checkbox", { name: /^Select CASE-/ });
      const initialFooter = screen.getByText(showingCases).textContent;
      const riskFilter = screen.getByRole("combobox", { name: "Risk" });
  
      await user.selectOptions(riskFilter, "critical");
  
      await waitFor(() => {
        expect(screen.getByText(showingCases).textContent).not.toBe(
          initialFooter,
        );
      });
  
      const dataRows = screen.getAllByRole("row").slice(1);
      expect(dataRows.length).toBeGreaterThan(0);
      dataRows.forEach((row) => expect(row).toHaveTextContent("Critical"));
    });

    it("TC-009 filters rows by jurisdiction", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      await user.selectOptions(screen.getByRole("combobox", { name: "Jurisdiction" }), "Belgium");
  
      const data = await waitForCasesQuery(queryClient, (params) => params.jurisdiction === "Belgium");
      expect(data.page).toBe(1);
      getDataRows().forEach((row) => expect(row).toHaveTextContent("Belgium"));
    });

    it("TC-010 combines search and all filters", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      const matchingCase = getCases()[0];
      const search = screen.getByRole("searchbox", { name: "Search" });
  
      await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), matchingCase.status);
      await user.selectOptions(screen.getByRole("combobox", { name: "Risk" }), matchingCase.riskLevel);
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Jurisdiction" }),
        matchingCase.jurisdiction,
      );
      await user.type(search, matchingCase.institution);
  
      const data = await waitForCasesQuery(
        queryClient,
        (params) =>
          params.status === matchingCase.status &&
          params.riskLevel === matchingCase.riskLevel &&
          params.jurisdiction === matchingCase.jurisdiction &&
          params.search === matchingCase.institution,
      );
      expect(data.total).toBeGreaterThan(0);
      expect(data.page).toBe(1);
      expect(data.items.every((item) =>
        item.status === matchingCase.status &&
        item.riskLevel === matchingCase.riskLevel &&
        item.jurisdiction === matchingCase.jurisdiction &&
        item.institution.toLowerCase().includes(matchingCase.institution.toLowerCase()),
      )).toBe(true);
    });

    it("TC-011 resets every toolbar control, page, and selection", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.type(screen.getByRole("searchbox", { name: "Search" }), "liquidity");
      await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "approved");
      await user.selectOptions(screen.getByRole("combobox", { name: "Risk" }), "critical");
      await user.selectOptions(screen.getByRole("combobox", { name: "Jurisdiction" }), "Belgium");
      await user.selectOptions(screen.getByRole("combobox", { name: "Page size" }), "50");
      await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
      await user.click(screen.getByRole("button", { name: "Next" }));
  
      await user.click(screen.getByRole("button", { name: "Reset filters" }));
      await screen.findByText(showingCases);
  
      expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
      expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("all");
      expect(screen.getByRole("combobox", { name: "Risk" })).toHaveValue("all");
      expect(screen.getByRole("combobox", { name: "Jurisdiction" })).toHaveValue("all");
      expect(screen.getByRole("combobox", { name: "Page size" })).toHaveValue("200");
      expect(getSelectionCount(0)).toBeInTheDocument();
    });

    it("TC-012 changes page size and clears existing selection", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
      await user.selectOptions(screen.getByRole("combobox", { name: "Page size" }), "50");
  
      const data = await waitForCasesQuery(queryClient, (params) => params.pageSize === 50);
      expect(data.page).toBe(1);
      expect(screen.getByText(showingCases)).toBeInTheDocument();
      expect(getSelectionCount(0)).toBeInTheDocument();
    });

    it("resets search and filters to the initial page", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      renderWithProviders(<CasesPage />);
  
      const search = screen.getByRole("searchbox", { name: "Search" });
      const statusFilter = screen.getByRole("combobox", { name: "Status" });
      const riskFilter = screen.getByRole("combobox", { name: "Risk" });
  
      await user.type(search, "liquidity");
      await user.selectOptions(statusFilter, "approved");
      await user.selectOptions(riskFilter, "critical");
      await user.click(screen.getByRole("button", { name: "Reset filters" }));
  
      await waitFor(() => {
        expect(screen.getByText(showingCases)).toBeInTheDocument();
      });
  
      expect(search).toHaveValue("");
      expect(statusFilter).toHaveValue("all");
      expect(riskFilter).toHaveValue("all");
    });

    it("TC-013 uses ascending deadline sorting by default", { tags: ["tier-1"] }, async () => {
      const { queryClient } = await renderLoaded();
      const deadlineHeader = screen.getByRole("columnheader", { name: /Deadline/ });
      expect(deadlineHeader).toHaveAttribute("aria-sort", "ascending");
  
      const data = await waitForCasesQuery(
        queryClient,
        (params) => params.sortBy === "deadline" && params.sortDirection === "asc",
      );
      expect(data.items.every((item, index, items) =>
        index === 0 || item.deadline >= items[index - 1].deadline,
      )).toBe(true);
    });

    it("TC-014 toggles a sortable header between ascending and descending", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      const institutionHeader = screen.getByRole("columnheader", { name: /Institution/ });
      const institutionButton = within(institutionHeader).getByRole("button");
  
      await user.click(institutionButton);
      await waitForCasesQuery(queryClient, (params) =>
        params.sortBy === "institution" && params.sortDirection === "asc",
      );
      expect(institutionHeader).toHaveAttribute("aria-sort", "ascending");
  
      await user.click(institutionButton);
      await waitForCasesQuery(queryClient, (params) =>
        params.sortBy === "institution" && params.sortDirection === "desc",
      );
      expect(institutionHeader).toHaveAttribute("aria-sort", "descending");
    });

    it("TC-015 resets pagination and selection when sorting changes", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText(/Page 2 of/);
  
      await user.click(within(screen.getByRole("columnheader", { name: /Institution/ })).getByRole("button"));
      const data = await waitForCasesQuery(queryClient, (params) => params.sortBy === "institution");
      expect(data.page).toBe(1);
      expect(screen.getByText(showingCases)).toBeInTheDocument();
      expect(getSelectionCount(0)).toBeInTheDocument();
    });

    it("TC-016 navigates to the next page and back while preserving filters", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.selectOptions(screen.getByRole("combobox", { name: "Risk" }), "critical");
      await screen.findByText(showingCases);
      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText(/Page 2 of/);
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
  
      await user.click(screen.getByRole("button", { name: "Prev" }));
      await screen.findByText(/Page 1 of/);
      expect(screen.getByRole("combobox", { name: "Risk" })).toHaveValue("critical");
    });

    it("TC-017 navigates to the first and last available pages", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      const initialData = await waitForCasesQuery(queryClient, (params) => params.page === 1);
      await user.click(screen.getByRole("button", { name: "Last" }));
      await screen.findByText(
        new RegExp(`Page ${initialData.totalPages} of ${initialData.totalPages}`),
      );

      await user.click(screen.getByRole("button", { name: "First" }));
      await screen.findByText(new RegExp(`Page 1 of ${initialData.totalPages}`));
    });

    it("TC-018 disables pagination controls at both boundaries", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      const initialData = await waitForCasesQuery(queryClient, (params) => params.page === 1);
      expect(screen.getByRole("button", { name: "First" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();
  
      await user.click(screen.getByRole("button", { name: "Last" }));
      await screen.findByText(
        new RegExp(`Page ${initialData.totalPages} of ${initialData.totalPages}`),
      );
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Last" })).toBeDisabled();
    });

    it("TC-019 bases filtered pagination on the filtered total", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "draft");
      const data = await waitForCasesQuery(queryClient, (params) => params.status === "draft");
  
      expect(data.total).toBeGreaterThan(25);
      expect(data.total).toBeLessThan(5_000);
      expect(data.totalPages).toBeGreaterThan(1);
      expect(screen.getByText(new RegExp(`of ${data.total.toLocaleString()} cases`))).toBeInTheDocument();
    });

    it("TC-020 returns to a cached page without showing unrelated data", { tags: ["tier-3"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText(/Page 2 of/);
      const pageTwoFirstRow = getDataRows()[0].textContent;
  
      await user.click(screen.getByRole("button", { name: "Prev" }));
      await screen.findByText(/Page 1 of/);
      expect(getDataRows()[0].textContent).not.toBe(pageTwoFirstRow);
      expect(screen.queryByLabelText("Loading records")).not.toBeInTheDocument();
    });

    it("TC-021 keeps previous rows visible and announces a page refresh", { tags: ["tier-3"], timeout: 5_000 }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.selectOptions(screen.getByRole("combobox", { name: "Latency" }), "1500");
      await user.click(screen.getByRole("button", { name: "Next" }));
  
      expect(screen.getByText(showingCases)).toBeInTheDocument();
      expect(screen.getByText("Refreshing cached records...")).toBeInTheDocument();
      expect(screen.queryByText("No cases match the current filters.")).not.toBeInTheDocument();
      await screen.findByText(/Page 2 of/, {}, { timeout: 3_000 });
    });

    it("TC-022 shows only the final search result after rapid delayed searches", { tags: ["tier-3"], timeout: 8_000 }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      await user.selectOptions(screen.getByRole("combobox", { name: "Latency" }), "1500");
      const search = screen.getByRole("searchbox", { name: "Search" });
  
      await user.type(search, "liquidity");
      await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
      });
      await user.clear(search);
      await user.type(search, "Northbridge");
  
      const data = await waitForCasesQuery(
        queryClient,
        (params) => params.search === "Northbridge",
        6_000,
      );
      expect(data.total).toBeGreaterThan(0);
      expect(data.items.every((item) =>
        [item.institution, item.reportType, item.jurisdiction, item.submissionCode,
          item.assignedReviewer ?? "", item.description]
          .some((value) => value.toLowerCase().includes("northbridge")),
      )).toBe(true);
    });

    it("TC-052 keeps the final page choice after rapid delayed navigation", { tags: ["tier-3"], timeout: 10_000 }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      mockConfig.latencyMs = 1_500;
      const next = screen.getByRole("button", { name: "Next" });
      const prev = screen.getByRole("button", { name: "Prev" });
  
      await Promise.all([user.click(next), user.click(next), user.click(prev)]);
      const data = await waitForCasesQuery(queryClient, (params) => params.page === 2, 8_000);
      expect(data.page).toBe(2);
      expect(screen.getByText(showingCases)).toBeInTheDocument();
    });

    it("TC-053 keeps only the final filter combination after rapid delayed changes", { tags: ["tier-3"], timeout: 10_000 }, async () => {
      const user = userEvent.setup();
      const { queryClient } = await renderLoaded();
      mockConfig.latencyMs = 1_500;
      const target = getCases()[0];
  
      await Promise.all([
        user.selectOptions(screen.getByRole("combobox", { name: "Status" }), target.status),
        user.selectOptions(screen.getByRole("combobox", { name: "Risk" }), target.riskLevel),
        user.selectOptions(
          screen.getByRole("combobox", { name: "Jurisdiction" }),
          target.jurisdiction,
        ),
      ]);
  
      const data = await waitForCasesQuery(
        queryClient,
        (params) =>
          params.status === target.status &&
          params.riskLevel === target.riskLevel &&
          params.jurisdiction === target.jurisdiction,
        8_000,
      );
      expect(data.page).toBe(1);
      expect(data.items.every((item) =>
        item.status === target.status &&
        item.riskLevel === target.riskLevel &&
        item.jurisdiction === target.jurisdiction,
      )).toBe(true);
    });
});
