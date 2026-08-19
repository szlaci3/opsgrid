import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CasesPage } from "../features/cases/CasesPage";
import { renderWithProviders } from "./testUtils";
import {
  getDataRows,
  getSelectionCount,
  getStatusSelects,
  renderLoaded,
  showingCases,
} from "./casesPageTestUtils";

describe("CasesPage table interactions", () => {
    it("TC-031 opens and closes a case detail drawer with the close button", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      renderWithProviders(<CasesPage />);

      await screen.findByText(showingCases);
      await screen.findAllByRole("checkbox", { name: /^Select CASE-/ });
      const detailsButton = screen.getAllByRole("button", { name: /view details for/i })[0];
  
      await user.click(detailsButton);
  
      expect(screen.getByRole("complementary", { name: "Case details" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3, name: "Operational Summary" })).toBeInTheDocument();
  
      await user.click(screen.getByRole("button", { name: "Close details" }));
  
      await waitFor(() => {
        expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
      });
    });

    it("TC-023 selects and clears an individual row", { tags: ["tier-1"] }, async () => {
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

    it("TC-024 selects only the rows on the current page", { tags: ["tier-2"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.click(screen.getByRole("checkbox", { name: "Select all cases on this page" }));
      expect(getSelectionCount(200)).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((checkbox) =>
        (checkbox as HTMLInputElement).checked,
      )).toBe(true);

      await user.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText(/Page 2 of/);
      expect(getSelectionCount(200)).toBeInTheDocument();
      expect(screen.getAllByRole("checkbox", { name: /^Select CASE-/ }).every((checkbox) =>
        !(checkbox as HTMLInputElement).checked,
      )).toBe(true);
    });

    it("TC-025 marks the header checkbox indeterminate for partial selection", { tags: ["tier-2"] }, async () => {
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

    it("TC-026 clears all selected rows with the bulk action", { tags: ["tier-2"] }, async () => {
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

    it("TC-027 opens the drawer from a non-interactive row area", { tags: ["tier-1"] }, async () => {
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

    it("TC-028 opens the matching drawer from View details", { tags: ["tier-2"] }, async () => {
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

    it("TC-029 keeps selection and status controls from opening the drawer", { tags: ["tier-2"] }, async () => {
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

    it("TC-030 renders the drawer's operational and technical metadata", { tags: ["tier-2"] }, async () => {
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

    it("TC-032 closes the detail drawer with Escape", { tags: ["tier-1"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.click(screen.getAllByRole("button", { name: /view details for/i })[0]);
      await user.keyboard("{Escape}");
  
      await waitFor(() => {
        expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
      });
    });

    it("TC-033 closes the detail drawer when the backdrop is clicked", { tags: ["tier-3"] }, async () => {
      const user = userEvent.setup();
      await renderLoaded();
      await user.click(screen.getAllByRole("button", { name: /view details for/i })[0]);
      const dialog = screen.getByRole("dialog");
      await user.click(dialog);
  
      expect(screen.queryByRole("complementary", { name: "Case details" })).not.toBeInTheDocument();
    });

    it("TC-034 opens a focused row with Enter and Space", { tags: ["tier-2"] }, async () => {
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
});
