import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockConfig } from "../mocks/mockConfig";
import { CasesPage } from "../features/cases/CasesPage";
import { renderWithProviders } from "./testUtils";
import {
  getDataRows,
  renderLoaded,
  showingCases,
  waitForCasesQuery,
} from "./casesPageTestUtils";

describe("CasesPage mutation and recovery", () => {
    it("TC-040 and TC-041 arms fail-next-fetch without immediately crashing the table, then fails on the next fetch and recovers on retry", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
  
      // Click "Fail next fetch"
      const failFetchBtn = screen.getByRole("button", { name: /fail next fetch/i });
      await user.click(failFetchBtn);
  
      // Verify the arming notice appears
      expect(screen.getByText("Next fetch will fail.")).toBeInTheDocument();
  
      // The table should STILL be present with data (not prematurely crashed)
      expect(screen.getByText(showingCases)).toBeInTheDocument();
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
        expect(screen.getByText(/Page 2 of/)).toBeInTheDocument();
      });
    });

    it("TC-036 arms fail-next-mutation, optimistically updates status, then rolls back on failure", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
  
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

    it("TC-035 successfully updates case status when mutation succeeds", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
  
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

    it("TC-037 allows selecting rows and executing bulk review", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
  
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

    it("TC-038 rolls back a failed bulk review and preserves selection", { tags: ["tier-1"] }, async () => {
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

    it("TC-039 disables bulk controls while a bulk request is pending", { tags: ["tier-3"], timeout: 6_000 }, async () => {
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
    });

    it("TC-042 consumes a fetch failure once and succeeds on the following retry", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.click(screen.getByRole("button", { name: /fail next fetch/i }));
      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText("The service could not retrieve this page.");
  
      await user.click(screen.getByRole("button", { name: "Retry fetch" }));
      await screen.findByText(/Page 2 of/);
      expect(screen.queryByText("The service could not retrieve this page.")).not.toBeInTheDocument();
    });

    it("TC-043 applies the selected latency to a subsequent API response", { tags: ["tier-3"], timeout: 6_000 }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      const latency = screen.getByRole("combobox", { name: "Latency" });
  
      await user.selectOptions(latency, "0");
      expect(latency).toHaveValue("0");
      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText(/Page 2 of/);
  
      await user.selectOptions(latency, "2500");
      expect(latency).toHaveValue("2500");
      await user.click(screen.getByRole("button", { name: "Prev" }));
      expect(screen.getByText("Refreshing cached records...")).toBeInTheDocument();
      await screen.findByText(/Page 1 of/, {}, { timeout: 4_000 });
    });

    it("TC-044 clears the cache and reloads the active page", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.click(screen.getByRole("button", { name: "Clear cache" }));
  
      expect(screen.getByText("Cache cleared.")).toBeInTheDocument();
      await screen.findByText(showingCases);
      expect(await screen.findByText("Cached pages enabled by TanStack Query")).toBeInTheDocument();
    });

    it("TC-045 resets changed data, selection, and the open drawer", { tags: ["tier-2"] }, async () => {
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

    it("TC-056 keeps the drawer consistent during an optimistic failed update", { tags: ["tier-3"], timeout: 7_000 }, async () => {
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
    });

    it("TC-057 keeps cached rows visible and shows an inline retry when a background refresh fails with cached data present", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      const { queryClient } = renderWithProviders(<CasesPage />);
  
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(showingCases)).toBeInTheDocument();
        expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
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
      expect(screen.getByText(showingCases)).toBeInTheDocument();
  
      // Click the inline Retry button
      const inlineRetryBtn = screen.getByRole("button", { name: /^retry$/i });
      await user.click(inlineRetryBtn);
  
      // Assert: recovery succeeds and status returns to normal cached state
      await waitFor(() => {
        expect(screen.queryByText("Refresh failed. Showing cached records.")).not.toBeInTheDocument();
        expect(screen.getByText("Cached pages enabled by TanStack Query")).toBeInTheDocument();
      });
    });
});
