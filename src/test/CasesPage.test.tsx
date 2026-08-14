import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CasesPage } from "../features/cases/CasesPage";
import { renderWithProviders } from "./testUtils";

describe("CasesPage Integration Tests", () => {
  it("renders the table and loads cases from MSW", async () => {
    renderWithProviders(<CasesPage />);

    expect(screen.getByRole("heading", { name: "OpsGrid" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/showing 1.*25 of/i)).toBeInTheDocument();
    });
  });

  it("arms fail-next-fetch without immediately crashing the table, then fails on the next fetch and recovers on retry", async () => {
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

  it("arms fail-next-mutation, optimistically updates status, then rolls back on failure", async () => {
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

  it("successfully updates case status when mutation succeeds", async () => {
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

  it("allows selecting rows and executing bulk review", async () => {
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
});
