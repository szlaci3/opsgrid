import { expect, test } from "@playwright/test";

const QUERY_STALE_INTERVAL_MS = 30_000;

test("TC-058 recovers after Chromium restarts the mock service worker", async ({
  browserName,
  page,
}) => {
  test.skip(browserName !== "chromium", "The service-worker lifecycle probe uses Chromium CDP.");

  await page.goto("/");

  const footer = page.getByText(/^Showing .* cases$/);
  const rows = page.getByRole("row");
  const refreshError = page.getByText("Refresh failed. Showing cached records.");
  const blockingError = page.getByText("The service could not retrieve this page.");

  await expect(footer).toBeVisible();
  await expect.poll(() => rows.count()).toBeGreaterThan(1);

  const loadedFooter = await footer.textContent();
  const firstLoadedRow = await rows.nth(1).textContent();
  const serviceWorkerDevtools = await page.context().newCDPSession(page);
  await serviceWorkerDevtools.send("ServiceWorker.enable");
  await serviceWorkerDevtools.send("ServiceWorker.stopAllWorkers");
  await serviceWorkerDevtools.detach();

  // Make the loaded query stale without waiting 30 seconds. Dispatching the
  // visibility event then exercises the same TanStack Query refetch path as
  // returning to OpsGrid after an inactive-tab interval.
  await page.clock.setFixedTime(Date.now() + QUERY_STALE_INTERVAL_MS + 1_000);
  const refreshResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" && new URL(response.url()).pathname === "/api/cases",
  );

  await page.evaluate(() => {
    window.dispatchEvent(new Event("visibilitychange"));
  });

  const refreshResponse = await refreshResponsePromise;
  await refreshResponse.finished();
  await page.waitForTimeout(1_000);

  await expect(footer).toHaveText(loadedFooter ?? "");
  await expect(rows.nth(1)).toHaveText(firstLoadedRow ?? "");
  await expect.poll(() => rows.count()).toBeGreaterThan(1);
  await expect(refreshError).toHaveCount(0);
  await expect(blockingError).toHaveCount(0);
  expect(refreshResponse.headers()["content-type"]).toContain("application/json");

  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByText(/^Page 2 of /)).toBeVisible();
  await expect.poll(() => rows.count()).toBeGreaterThan(1);
  await expect(refreshError).toHaveCount(0);
  await expect(blockingError).toHaveCount(0);
});
