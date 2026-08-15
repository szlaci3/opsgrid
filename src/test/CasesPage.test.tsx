import { act, screen, waitFor, within } from "@testing-library/react";
import { focusManager } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { CasesResponse, CasesQueryParams } from "../api/apiTypes";
import { CasesPage } from "../features/cases/CasesPage";
import { getCases } from "../mocks/db";
import { mockConfig } from "../mocks/mockConfig";
import { renderWithProviders } from "./testUtils";

async function renderLoaded() {
  const result = renderWithProviders(<CasesPage />);
  await screen.findByText("Showing 1-25 of 5,000 cases");
  return result;
}

function getCasesQueryData(
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

async function waitForCasesQuery(
  queryClient: ReturnType<typeof renderWithProviders>["queryClient"],
  predicate: (params: CasesQueryParams) => boolean = () => true,
  timeout = 1_000,
) {
  await waitFor(() => {
    expect(getCasesQueryData(queryClient, predicate)).toBeDefined();
  }, { timeout });

  return getCasesQueryData(queryClient, predicate)!;
}

function getDataRows() {
  return screen.getAllByRole("row").slice(1);
}

function getStatusSelects() {
  return screen.getAllByRole("combobox", { name: /update case status/i });
}

function getSelectionCount(count: number) {
  return screen.getByText((_, element) => element?.textContent === `${count} selected`);
}

describe("CasesPage Integration Tests", () => {
  it("TC-001 renders the table and loads cases from MSW", async () => {
    renderWithProviders(<CasesPage />);

    expect(screen.getByRole("heading", { name: "OpsGrid" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });
  });

  it("TC-002 shows an in-table skeleton during a slow initial query", async () => {
    mockConfig.latencyMs = 2_500;
    renderWithProviders(<CasesPage />);

    expect(screen.getByLabelText("Loading records")).toBeInTheDocument();
    expect(screen.queryByText("No cases match the current filters.")).not.toBeInTheDocument();

    await screen.findByText("Showing 1-25 of 5,000 cases", {}, { timeout: 4_000 });
  }, 5_000);

  it("TC-003 renders the documented page information architecture", async () => {
    await renderLoaded();

    expect(screen.getByText("Regulatory Operations Table System")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Architecture capabilities" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Demo controls" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Case filters" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Operational compliance cases" })).toBeInTheDocument();
    expect(screen.getByText("Cached pages enabled by TanStack Query")).toBeInTheDocument();
    expect(screen.getByText("Debounced Search")).toBeInTheDocument();
    expect(screen.getByText("Optimistic Mutations")).toBeInTheDocument();
  });

  it("TC-004 debounces search input and replaces the unfiltered result set", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    const initialFooter = (await screen.findByText("Showing 1-25 of 5,000 cases")).textContent;
    const search = screen.getByRole("searchbox", { name: "Search" });

    await user.type(search, "liquidity");

    expect(search).toHaveValue("liquidity");
    expect(screen.getByText("Showing 1-25 of 5,000 cases")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/showing 1-25 of/i).textContent).not.toBe(
        initialFooter,
      );
    });

    expect(screen.getAllByText("Liquidity Coverage Report").length).toBeGreaterThan(0);
  });

  it("TC-005 searches case-insensitively across every supported API field", async () => {
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
  }, 10_000);

  it("TC-006 shows the empty state and recovers with Reset filters", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const search = screen.getByRole("searchbox", { name: "Search" });

    await user.type(search, "this-value-cannot-match-generated-data");
    await screen.findByText("No cases match the current filters.");
    expect(screen.getByRole("button", { name: "Reset filters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    await screen.findByText("Showing 1-25 of 5,000 cases");
    expect(search).toHaveValue("");
  });

  it("TC-007 filters rows by status and resets to page 1", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "approved");

    const data = await waitForCasesQuery(queryClient, (params) => params.status === "approved");
    expect(data.page).toBe(1);
    expect(data.total).toBeLessThan(5_000);
    getDataRows().forEach((row) => expect(row).toHaveTextContent("Approved"));
  });

  it("TC-008 filters visible rows by risk level", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    const initialFooter = (await screen.findByText("Showing 1-25 of 5,000 cases")).textContent;
    const riskFilter = screen.getByRole("combobox", { name: "Risk" });

    await user.selectOptions(riskFilter, "critical");

    await waitFor(() => {
      expect(screen.getByText(/showing 1-25 of/i).textContent).not.toBe(
        initialFooter,
      );
    });

    const dataRows = screen.getAllByRole("row").slice(1);
    expect(dataRows.length).toBeGreaterThan(0);
    dataRows.forEach((row) => expect(row).toHaveTextContent("Critical"));
  });

  it("TC-009 filters rows by jurisdiction", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    await user.selectOptions(screen.getByRole("combobox", { name: "Jurisdiction" }), "Belgium");

    const data = await waitForCasesQuery(queryClient, (params) => params.jurisdiction === "Belgium");
    expect(data.page).toBe(1);
    getDataRows().forEach((row) => expect(row).toHaveTextContent("Belgium"));
  });

  it("TC-010 combines search and all filters", async () => {
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

  it("TC-011 resets every toolbar control, page, and selection", async () => {
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
    await screen.findByText("Showing 1-25 of 5,000 cases");

    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("all");
    expect(screen.getByRole("combobox", { name: "Risk" })).toHaveValue("all");
    expect(screen.getByRole("combobox", { name: "Jurisdiction" })).toHaveValue("all");
    expect(screen.getByRole("combobox", { name: "Page size" })).toHaveValue("25");
    expect(getSelectionCount(0)).toBeInTheDocument();
  });

  it("TC-012 changes page size and clears existing selection", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
    await user.selectOptions(screen.getByRole("combobox", { name: "Page size" }), "50");

    const data = await waitForCasesQuery(queryClient, (params) => params.pageSize === 50);
    expect(data.page).toBe(1);
    expect(screen.getByText("Showing 1-50 of 5,000 cases")).toBeInTheDocument();
    expect(getSelectionCount(0)).toBeInTheDocument();
  });

  it("TC-031 opens and closes a case detail drawer with the close button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    await screen.findByText("Showing 1-25 of 5,000 cases");
    const detailsButton = screen.getAllByRole("button", { name: /view details for/i })[0];

    await user.click(detailsButton);

    expect(screen.getByRole("complementary", { name: "Case details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Operational Summary" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close details" }));

    await waitFor(() => {
      expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
    });
  });

  it("TC-023 selects and clears an individual row", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const checkbox = screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0];

    expect(getSelectionCount(0)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark reviewed" }).parentElement)
      .toHaveAttribute("data-visible", "false");
    await user.click(checkbox);
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).filter((item) =>
      (item as HTMLInputElement).checked,
    )).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Mark reviewed" }).parentElement)
      .toHaveAttribute("data-visible", "true");

    await user.click(screen.getByRole("checkbox", { name: checkbox.getAttribute("aria-label")! }));
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((item) =>
      !(item as HTMLInputElement).checked,
    )).toBe(true);
  });

  it("TC-024 selects only the rows on the current page", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByRole("checkbox", { name: "Select all cases on this page" }));
    expect(getSelectionCount(25)).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((checkbox) =>
      (checkbox as HTMLInputElement).checked,
    )).toBe(true);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Showing 26-50 of 5,000 cases");
    expect(getSelectionCount(25)).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((checkbox) =>
      !(checkbox as HTMLInputElement).checked,
    )).toBe(true);
  });

  it("TC-025 marks the header checkbox indeterminate for partial selection", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
    const headerCheckbox = screen.getByRole("checkbox", { name: "Select all cases on this page" }) as HTMLInputElement;
    expect(headerCheckbox.indeterminate).toBe(true);

    await user.click(headerCheckbox);
    expect(headerCheckbox.indeterminate).toBe(false);
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((item) =>
      (item as HTMLInputElement).checked,
    )).toBe(true);
  });

  it("TC-026 clears all selected rows with the bulk action", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const rowCheckboxes = screen.getAllByRole("checkbox", { name: /^Select CASE-/ });
    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);
    await user.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(getSelectionCount(0)).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((checkbox) =>
      !(checkbox as HTMLInputElement).checked,
    )).toBe(true);
  });

  it("TC-027 opens the drawer from a non-interactive row area", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const row = getDataRows()[0];
    const institution = within(row).getAllByRole("cell")[1];
    const institutionText = institution.textContent ?? "";
    await user.click(institution);

    expect(screen.getByRole("complementary", { name: "Case details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      institutionText,
    );
  });

  it("TC-028 opens the matching drawer from View details", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const row = getDataRows()[0];
    const rowText = row.textContent ?? "";
    await user.click(within(row).getByRole("button", { name: /view details for/i }));

    expect(screen.getByRole("complementary", { name: "Case details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
      within(row).getAllByRole("cell")[1].textContent,
    );
    expect(rowText).toContain(screen.getByRole("heading", { level: 2 }).textContent ?? "");
  });

  it("TC-029 keeps selection and status controls from opening the drawer", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const rowCheckbox = screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0];
    await user.click(rowCheckbox);
    expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();

    const statusSelect = getStatusSelects()[0];
    const nextStatus = (statusSelect as HTMLSelectElement).value === "approved" ? "reviewed" : "approved";
    await user.selectOptions(statusSelect, nextStatus);
    expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
  });

  it("TC-030 renders the drawer's operational and technical metadata", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getAllByRole("button", { name: /view details for/i })[0]);

    const drawer = screen.getByRole("complementary", { name: "Case details" });
    expect(within(drawer).getByRole("heading", { name: "Operational Summary" })).toBeInTheDocument();
    expect(within(drawer).getByRole("heading", { name: "Case Description" })).toBeInTheDocument();
    expect(within(drawer).getByRole("heading", { name: "Technical Metadata" })).toBeInTheDocument();
    expect(within(drawer).getByText("Submission code")).toBeInTheDocument();
    expect(within(drawer).getByText("Priority score")).toBeInTheDocument();
    expect(within(drawer).getByText(/Mock Service Worker API layer/)).toBeInTheDocument();
    expect(within(drawer).getByText(/optimistic and roll back/)).toBeInTheDocument();
  });

  it("TC-032 closes the detail drawer with Escape", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getAllByRole("button", { name: /view details for/i })[0]);
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
    });
  });

  it("TC-033 closes the detail drawer when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getAllByRole("button", { name: /view details for/i })[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(dialog);

    expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
  });

  it("TC-034 opens a focused row with Enter and Space", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const rows = getDataRows();
    rows[0].focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("complementary", { name: "Case details" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close details" }));
    rows[1].focus();
    await user.keyboard(" ");
    expect(screen.getByRole("complementary", { name: "Case details" })).toBeInTheDocument();
  });

  it("resets search and filters to the initial page", async () => {
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
      expect(screen.getByText("Showing 1-25 of 5,000 cases")).toBeInTheDocument();
    });

    expect(search).toHaveValue("");
    expect(statusFilter).toHaveValue("all");
    expect(riskFilter).toHaveValue("all");
  });

  it("TC-013 uses ascending deadline sorting by default", async () => {
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

  it("TC-014 toggles a sortable header between ascending and descending", async () => {
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

  it("TC-015 resets pagination and selection when sorting changes", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Showing 26-50 of 5,000 cases");

    await user.click(within(screen.getByRole("columnheader", { name: /Institution/ })).getByRole("button"));
    const data = await waitForCasesQuery(queryClient, (params) => params.sortBy === "institution");
    expect(data.page).toBe(1);
    expect(screen.getByText("Showing 1-25 of 5,000 cases")).toBeInTheDocument();
    expect(getSelectionCount(0)).toBeInTheDocument();
  });

  it("TC-016 navigates to the next page and back while preserving filters", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.selectOptions(screen.getByRole("combobox", { name: "Risk" }), "critical");
    await screen.findByText(/Showing 1-25 of .* cases/);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText(/Showing 26-50 of .* cases/);
    expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByText(/Showing 1-25 of .* cases/);
    expect(screen.getByRole("combobox", { name: "Risk" })).toHaveValue("critical");
  });

  it("TC-017 navigates to the first and last available pages", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByRole("button", { name: "Last" }));
    await screen.findByText("Showing 4,976-5,000 of 5,000 cases");
    expect(screen.getByText("Page 200 of 200")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "First" }));
    await screen.findByText("Showing 1-25 of 5,000 cases");
    expect(screen.getByText("Page 1 of 200")).toBeInTheDocument();
  });

  it("TC-018 disables pagination controls at both boundaries", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    expect(screen.getByRole("button", { name: "First" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Prev" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Last" }));
    await screen.findByText("Page 200 of 200");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Last" })).toBeDisabled();
  });

  it("TC-019 bases filtered pagination on the filtered total", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "draft");
    const data = await waitForCasesQuery(queryClient, (params) => params.status === "draft");

    expect(data.total).toBeGreaterThan(25);
    expect(data.total).toBeLessThan(5_000);
    expect(data.totalPages).toBeGreaterThan(1);
    expect(screen.getByText(new RegExp(`of ${data.total.toLocaleString()} cases`))).toBeInTheDocument();
  });

  it("TC-020 returns to a cached page without showing unrelated data", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Showing 26-50 of 5,000 cases");
    const pageTwoFirstRow = getDataRows()[0].textContent;

    await user.click(screen.getByRole("button", { name: "Prev" }));
    await screen.findByText("Showing 1-25 of 5,000 cases");
    expect(getDataRows()[0].textContent).not.toBe(pageTwoFirstRow);
    expect(screen.queryByLabelText("Loading records")).not.toBeInTheDocument();
  });

  it("TC-021 keeps previous rows visible and announces a page refresh", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.selectOptions(screen.getByRole("combobox", { name: "Latency" }), "1500");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Showing 1-25 of 5,000 cases")).toBeInTheDocument();
    expect(screen.getByText("Refreshing cached records...")).toBeInTheDocument();
    expect(screen.queryByText("No cases match the current filters.")).not.toBeInTheDocument();
    await screen.findByText("Showing 26-50 of 5,000 cases", {}, { timeout: 3_000 });
  }, 5_000);

  it("TC-022 shows only the final search result after rapid delayed searches", async () => {
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
  }, 8_000);

  it("TC-040 and TC-041 arms fail-next-fetch without immediately crashing the table, then fails on the next fetch and recovers on retry", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });

    // Click "Fail next fetch"
    const failFetchBtn = screen.getByRole("button", { name: /fail next fetch/i });
    await user.click(failFetchBtn);

    // Verify the arming notice appears
    expect(screen.getByText("Next fetch will fail.")).toBeInTheDocument();

    // The table should STILL be present with data (not prematurely crashed)
    expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    expect(screen.queryByText("The service could not retrieve this page.")).not.toBeInTheDocument();

    // Now perform a user-initiated action that triggers a new fetch (Next page)
    const nextBtn = screen.getByRole("button", { name: /^next$/i });
    await user.click(nextBtn);

    // Now the error state SHOULD appear
    await waitFor(() => {
      expect(screen.getByText("The service could not retrieve this page.")).toBeInTheDocument();
    });

    // Click "Retry fetch" to recover
    const retryBtn = screen.getByRole("button", { name: /retry fetch/i });
    await user.click(retryBtn);

    // Verify recovery
    await waitFor(() => {
      expect(screen.queryByText("The service could not retrieve this page.")).not.toBeInTheDocument();
      expect(screen.getByText(/showing 26.*50 of/i)).toBeInTheDocument();
    });
  });

  it("TC-036 arms fail-next-mutation, optimistically updates status, then rolls back on failure", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });

    // Arm mutation failure
    const failUpdateBtn = screen.getByRole("button", { name: /fail next update/i });
    await user.click(failUpdateBtn);

    expect(screen.getByText("Next update will fail.")).toBeInTheDocument();

    // Find the first status select
    const statusSelects = await screen.findAllByRole("combobox", { name: /update case status/i });
    const firstSelect = statusSelects[0] as HTMLSelectElement;
    const originalValue = firstSelect.value;
    const targetValue = originalValue === "approved" ? "failed" : "approved";

    // Change status to trigger optimistic update and subsequent rollback
    await user.selectOptions(firstSelect, targetValue);

    // Check error feedback and rollback
    await waitFor(() => {
      expect(screen.getByText("Update failed. Previous status restored.")).toBeInTheDocument();
      const updatedSelects = screen.getAllByRole("combobox", { name: /update case status/i });
      expect((updatedSelects[0] as HTMLSelectElement).value).toBe(originalValue);
    });
  });

  it("TC-035 successfully updates case status when mutation succeeds", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });

    const statusSelects = await screen.findAllByRole("combobox", { name: /update case status/i });
    const firstSelect = statusSelects[0] as HTMLSelectElement;
    const originalValue = firstSelect.value;
    const targetValue = originalValue === "reviewed" ? "approved" : "reviewed";

    await user.selectOptions(firstSelect, targetValue);

    await waitFor(() => {
      expect(screen.getByText("Case status updated.")).toBeInTheDocument();
      const updatedSelects = screen.getAllByRole("combobox", { name: /update case status/i });
      expect((updatedSelects[0] as HTMLSelectElement).value).toBe(targetValue);
    });
  });

  it("TC-037 allows selecting rows and executing bulk review", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });

    // Click select all cases on this page
    const selectAllCheckbox = screen.getByRole("checkbox", { name: /select all cases on this page/i });
    await user.click(selectAllCheckbox);

    // Bulk review button should be visible and clickable
    const markReviewedBtn = screen.getByRole("button", { name: /mark reviewed/i });
    expect(markReviewedBtn).toBeInTheDocument();

    await user.click(markReviewedBtn);

    await waitFor(() => {
      expect(screen.getByText("Selected cases marked as reviewed.")).toBeInTheDocument();
    });
  });

  it("TC-038 rolls back a failed bulk review and preserves selection", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const selectedRows = [getDataRows()[0], getDataRows()[1]];
    const originalStatuses = selectedRows.map((row) =>
      (within(row).getByRole("combobox", { name: /update case status/i }) as HTMLSelectElement).value,
    );
    await user.click(screen.getByRole("checkbox", { name: "Select all cases on this page" }));
    await user.click(screen.getByRole("button", { name: /fail next update/i }));
    await user.click(screen.getByRole("button", { name: "Mark reviewed" }));

    await waitFor(() => {
      expect(screen.getByText("The selected cases could not be reviewed. Previous values restored.")).toBeInTheDocument();
      selectedRows.forEach((row, index) => {
        expect((within(row).getByRole("combobox", { name: /update case status/i }) as HTMLSelectElement).value)
          .toBe(originalStatuses[index]);
      });
    });
    expect(screen.getByRole("checkbox", { name: "Select all cases on this page" }))
      .toBeChecked();
    expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((item) =>
      (item as HTMLInputElement).checked,
    )).toBe(true);
  });

  it("TC-039 disables bulk controls while a bulk request is pending", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.selectOptions(screen.getByRole("combobox", { name: "Latency" }), "2500");
    const rowCheckboxes = screen.getAllByRole("checkbox", { name: /^Select CASE-/ });
    await user.click(rowCheckboxes[0]);
    await user.click(rowCheckboxes[1]);
    await user.click(screen.getByRole("button", { name: "Mark reviewed" }));

    expect(screen.getByRole("button", { name: "Mark reviewed" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear selection" })).toBeDisabled();
    await screen.findByText("Selected cases marked as reviewed.", {}, { timeout: 4_000 });
  }, 6_000);

  it("TC-042 consumes a fetch failure once and succeeds on the following retry", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByRole("button", { name: /fail next fetch/i }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("The service could not retrieve this page.");

    await user.click(screen.getByRole("button", { name: "Retry fetch" }));
    await screen.findByText("Showing 26-50 of 5,000 cases");
    expect(screen.queryByText("The service could not retrieve this page.")).not.toBeInTheDocument();
  });

  it("TC-043 applies the selected latency to a subsequent API response", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    const latency = screen.getByRole("combobox", { name: "Latency" });

    await user.selectOptions(latency, "0");
    expect(latency).toHaveValue("0");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Showing 26-50 of 5,000 cases");

    await user.selectOptions(latency, "2500");
    expect(latency).toHaveValue("2500");
    await user.click(screen.getByRole("button", { name: "Prev" }));
    expect(screen.getByText("Refreshing cached records...")).toBeInTheDocument();
    await screen.findByText("Showing 1-25 of 5,000 cases", {}, { timeout: 4_000 });
  }, 6_000);

  it("TC-044 clears the cache and reloads the active page", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    await user.click(screen.getByRole("button", { name: "Clear cache" }));

    expect(screen.getByText("Cache cleared.")).toBeInTheDocument();
    await screen.findByText("Showing 1-25 of 5,000 cases");
    expect(screen.getByText("Cached pages enabled by TanStack Query")).toBeInTheDocument();
  });

  it("TC-045 resets changed data, selection, and the open drawer", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    mockConfig.latencyMs = 0;
    const initialData = await waitForCasesQuery(queryClient, (params) => params.page === 1);
    const firstCase = initialData.items[0];
    const initialRow = getDataRows().find((row) =>
      within(row).queryByRole("checkbox", { name: `Select ${firstCase.id}` }),
    )!;
    const statusSelect = within(initialRow).getByRole("combobox", {
      name: /update case status/i,
    }) as HTMLSelectElement;
    const nextStatus = statusSelect.value === "approved" ? "reviewed" : "approved";

    await user.selectOptions(statusSelect, nextStatus);
    await waitFor(() => expect(screen.getByText("Case status updated.")).toBeInTheDocument());
    await user.click(screen.getAllByRole("checkbox", { name: /^Select CASE-/ })[0]);
    await user.click(screen.getAllByRole("button", { name: /view details for/i })[0]);
    await user.click(screen.getByRole("button", { name: "Reset data" }));

    await screen.findByText("Data reset.");
    await waitFor(() => {
      const resetRow = getDataRows().find((row) =>
        within(row).queryByRole("checkbox", { name: `Select ${firstCase.id}` }),
      )!;
      expect((within(resetRow).getByRole("combobox", { name: /update case status/i }) as HTMLSelectElement).value)
        .toBe(firstCase.status);
      expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((checkbox) =>
        !(checkbox as HTMLInputElement).checked,
      )).toBe(true);
      expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
    });
  });

  it("TC-052 keeps the final page choice after rapid delayed navigation", async () => {
    const user = userEvent.setup();
    const { queryClient } = await renderLoaded();
    mockConfig.latencyMs = 1_500;
    const next = screen.getByRole("button", { name: "Next" });
    const prev = screen.getByRole("button", { name: "Prev" });

    await Promise.all([user.click(next), user.click(next), user.click(prev)]);
    const data = await waitForCasesQuery(queryClient, (params) => params.page === 2, 8_000);
    expect(data.page).toBe(2);
    expect(screen.getByText("Showing 26-50 of 5,000 cases")).toBeInTheDocument();
  }, 10_000);

  it("TC-053 keeps only the final filter combination after rapid delayed changes", async () => {
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
  }, 10_000);

  it("TC-056 keeps the drawer consistent during an optimistic failed update", async () => {
    const user = userEvent.setup();
    await renderLoaded();
    mockConfig.latencyMs = 1_500;
    const row = getDataRows()[0];
    const rowStatus = within(row).getByRole("combobox", { name: /update case status/i }) as HTMLSelectElement;
    const originalStatus = rowStatus.value;
    const nextStatus = originalStatus === "approved" ? "reviewed" : "approved";

    await user.click(within(row).getByRole("button", { name: /view details for/i }));
    await user.click(screen.getByRole("button", { name: /fail next update/i }));
    const activeRowStatus = within(getDataRows()[0]).getByRole("combobox", {
      name: /update case status/i,
    }) as HTMLSelectElement;
    await user.selectOptions(activeRowStatus, nextStatus);

    await waitFor(() => {
      expect(screen.getByRole("complementary", { name: "Case details" })).toHaveTextContent(
        nextStatus === "approved" ? "Approved" : "Reviewed",
      );
    });
    await screen.findByText("Update failed. Previous status restored.", {}, { timeout: 4_000 });
    expect(screen.getByRole("complementary", { name: "Case details" })).toHaveTextContent(
      originalStatus === "approved" ? "Approved" : originalStatus.charAt(0).toUpperCase() + originalStatus.slice(1),
    );
  }, 7_000);

  it("TC-057 keeps cached rows visible and shows an inline retry when a background refresh fails with cached data present", async () => {
    const user = userEvent.setup();
    const { queryClient } = renderWithProviders(<CasesPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });

    // Arm fetch failure
    const failFetchBtn = screen.getByRole("button", { name: /fail next fetch/i });
    await user.click(failFetchBtn);

    // Trigger a background refetch for the current query while cached rows are visible
    void queryClient.invalidateQueries({ queryKey: ["cases"] });

    // Assert: Table rows are STILL rendered, blocking ErrorState is NOT displayed
    await waitFor(() => {
      expect(screen.getByText("Refresh failed. Showing cached records.")).toBeInTheDocument();
    });

    expect(screen.queryByText("The service could not retrieve this page.")).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();

    // Click the inline Retry button
    const inlineRetryBtn = screen.getByRole("button", { name: /^retry$/i });
    await user.click(inlineRetryBtn);

    // Assert: recovery succeeds and status returns to normal cached state
    await waitFor(() => {
      expect(screen.queryByText("Refresh failed. Showing cached records.")).not.toBeInTheDocument();
      expect(screen.getByText("Cached pages enabled by TanStack Query")).toBeInTheDocument();
    });
  });

  it("TC-046 keeps table rows visible after returning from a three-minute inactive-tab interval", async () => {
    const { queryClient } = renderWithProviders(<CasesPage />);

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });

    const activeCasesQuery = queryClient
      .getQueryCache()
      .getAll()
      .find((query) => query.queryKey[0] === "cases");
    expect(activeCasesQuery).toBeDefined();

    // Keep the tab inactive for the full manual-regression interval.
    focusManager.setFocused(false);
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 3 * 60 * 1_000);
    });
    focusManager.setFocused(true);

    await waitFor(() => {
      expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
      expect(activeCasesQuery!.state.dataUpdatedAt).toBeGreaterThan(Date.now() - 10_000);
    });

    expect(screen.queryByText("The service could not retrieve this page.")).not.toBeInTheDocument();
  }, 190_000);
});
