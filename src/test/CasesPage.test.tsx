import { screen, waitFor } from "@testing-library/react";
import { focusManager } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CasesPage } from "../features/cases/CasesPage";
import { renderWithProviders } from "./testUtils";

describe("CasesPage Integration Tests", () => {
  it("TC-001 renders the table and loads cases from MSW", async () => {
    renderWithProviders(<CasesPage />);

    expect(screen.getByRole("heading", { name: "OpsGrid" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });
  });

  it("debounces search input and replaces the unfiltered result set", async () => {
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

  it("filters visible rows by risk level", async () => {
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

  it("opens and closes a case detail drawer", async () => {
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
