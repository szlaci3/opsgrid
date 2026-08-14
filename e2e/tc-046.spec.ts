import { expect, test } from "@playwright/test";

const INACTIVE_INTERVAL_MS = 3 * 60 * 1_000;

test("TC-046 keeps table rows visible after a three-minute inactive-tab interval", async ({ page }) => {
  test.setTimeout(INACTIVE_INTERVAL_MS + 30_000);

  await page.goto("/");

  const footer = page.getByText(/showing 1.*25 of/i);
  const rows = page.getByRole("row");

  await expect(footer).toBeVisible();
  await expect.poll(() => rows.count()).toBeGreaterThan(1);

  const loadedFooter = await footer.textContent();
  const firstLoadedRow = await rows.nth(1).textContent();

  const devtools = await page.context().newCDPSession(page);

  const inactiveTabPromise = page.waitForEvent("popup");
  await page.evaluate(() => {
    window.open("about:blank", "_blank");
  });
  const inactiveTab = await inactiveTabPromise;
  await inactiveTab.waitForLoadState();
  await inactiveTab.bringToFront();

  // Playwright focus-emulates every page, so explicitly deliver the browser
  // visibility transition that TanStack Query receives during a manual tab switch.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });

  // Chromium's native frozen lifecycle adds deterministic timer/renderer
  // suspension and is stricter than leaving an ordinary tab in the background.
  await devtools.send("Page.setWebLifecycleState", { state: "frozen" });

  await new Promise<void>((resolve) => {
    setTimeout(resolve, INACTIVE_INTERVAL_MS);
  });

  await devtools.send("Page.setWebLifecycleState", { state: "active" });
  await devtools.detach();
  await page.bringToFront();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect
    .poll(() => page.evaluate(() => document.visibilityState))
    .toBe("visible");

  await page.waitForTimeout(1_000);

  await expect(footer).toHaveText(loadedFooter ?? "");
  await expect(rows.nth(1)).toHaveText(firstLoadedRow ?? "");
  await expect.poll(() => rows.count()).toBeGreaterThan(1);
  await expect(page.getByText("The service could not retrieve this page.")).toHaveCount(0);

  await inactiveTab.close();
});
