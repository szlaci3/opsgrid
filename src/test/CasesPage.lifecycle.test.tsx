import { screen, waitFor } from "@testing-library/react";
import { focusManager } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { CasesPage } from "../features/cases/CasesPage";
import { mockConfig } from "../mocks/mockConfig";
import { renderWithProviders } from "./testUtils";
import { renderLoaded } from "./casesPageTestUtils";

describe("CasesPage lifecycle and rendering", () => {
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
