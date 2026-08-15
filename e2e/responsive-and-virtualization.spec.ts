import { expect, test } from "@playwright/test";

test("TC-048 and TC-049 keep mobile table controls and the detail drawer usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");

  await expect(page.getByText("Showing 1-25 of 5,000 cases")).toBeVisible();

  const table = page.getByRole("table");
  const scrollContainer = table.locator("..");
  await expect.poll(() => scrollContainer.evaluate((element) => element.scrollWidth > element.clientWidth))
    .toBe(true);
  await scrollContainer.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    element.dispatchEvent(new Event("scroll"));
  });

  const caseCheckbox = page.getByRole("checkbox", { name: /^Select CASE-/ }).first();
  const caseId = (await caseCheckbox.getAttribute("aria-label"))!.replace("Select ", "");
  const row = caseCheckbox.locator('xpath=ancestor::*[@role="row"]');
  const institution = await row.getByRole("cell").nth(1).innerText();

  await caseCheckbox.check();
  await expect(caseCheckbox).toBeChecked();

  const status = row.getByRole("combobox", { name: "Update case status" });
  const currentStatus = await status.inputValue();
  const nextStatus = currentStatus === "approved" ? "reviewed" : "approved";
  await status.selectOption(nextStatus);
  await expect(status).toHaveValue(nextStatus);

  await row.getByRole("button", { name: `View details for ${caseId}` }).click();
  const drawer = page.getByRole("complementary", { name: "Case details" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { level: 2 })).toHaveText(institution);

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
});

test("TC-051 virtualizes the maximum page size and opens a near-bottom record", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Showing 1-25 of 5,000 cases")).toBeVisible();

  await page.getByRole("combobox", { name: "Page size" }).selectOption("200");
  await expect(page.getByText("Showing 1-200 of 5,000 cases")).toBeVisible();

  const table = page.getByRole("table");
  const scrollContainer = table.locator("..");
  await scrollContainer.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(() => scrollContainer.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  const lastVisibleRow = page.getByRole("row").last();
  await expect(lastVisibleRow.getByRole("button", { name: /view details for/i })).toBeVisible();
  const institution = await lastVisibleRow.getByRole("cell").nth(1).innerText();

  await lastVisibleRow.getByRole("button", { name: /view details for/i }).click();
  const drawer = page.getByRole("complementary", { name: "Case details" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("heading", { level: 2 })).toHaveText(institution);
});
