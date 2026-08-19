import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CasesPage } from "../features/cases/CasesPage";
import { mockConfig } from "../mocks/mockConfig";
import { renderWithProviders } from "./testUtils";
import { renderLoaded, showingCases } from "./casesPageTestUtils";

describe("CasesPage lifecycle and rendering", () => {
    it("TC-001 renders the table and loads cases from MSW", async () => {
      renderWithProviders(<CasesPage />);
  
      expect(screen.getByRole("heading", { name: "OpsGrid" })).toBeInTheDocument();
  
      await waitFor(() => {
        expect(screen.getByText(showingCases)).toBeInTheDocument();
        expect(screen.getAllByRole("row").length).toBeGreaterThan(1);
      });
    });

    it("TC-002 shows an in-table skeleton during a slow initial query", async () => {
      mockConfig.latencyMs = 2_500;
      renderWithProviders(<CasesPage />);
  
      expect(screen.getByLabelText("Loading records")).toBeInTheDocument();
      expect(screen.queryByText("No cases match the current filters.")).not.toBeInTheDocument();
  
      await screen.findByText(showingCases, {}, { timeout: 4_000 });
      await screen.findAllByRole("checkbox", { name: /^Select CASE-/ }, { timeout: 4_000 });
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

});
