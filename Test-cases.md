# OpsGrid Test Cases

## Execution conventions

- Record the observed result only after executing the case. Leave **Actual outcome** empty until then.
- Create new cases with **Status: Not executed**. Update them to Passed, Failed, or Blocked only after execution.
- Use the headed browser for visual, keyboard, and timing-sensitive cases. Add permanent Vitest and RTL coverage where the behavior can be reliably automated.

## Tiered testing strategy

The tiers are based on execution cost and confidence. They are not coverage targets.

| Tier | Execution | Purpose |
| --- | --- | --- |
| Tier 1 | Every commit and pull request | Fast Vitest and RTL validation of high-risk behavior. |
| Tier 2 | CI builds and merges to the main branch | Broader Playwright and integration workflows. |
| Tier 3 | Scheduled weekly and available for manual execution | Extended regression scenarios with long waits, special setup, or cross-feature risk. |

### Tier allocation

- **Tier 1:** TC-001, TC-004, TC-006, TC-007, TC-013, TC-014, TC-016, TC-023, TC-027, TC-032, TC-035 through TC-038, TC-040 through TC-042.
- **Tier 2:** TC-003, TC-005, TC-008 through TC-012, TC-015, TC-017 through TC-019, TC-024 through TC-026, TC-028 through TC-031, TC-034, TC-044, and TC-045.
- **Tier 3:** TC-002, TC-020 through TC-022, TC-033, TC-039, TC-043, and TC-046 through TC-056.

## Initial page and loading

### TC-001 - Initial case-page load

**Purpose:** Confirm that the main screen loads the initial server page.

**Preconditions:** Generated demo data is in its default state.

**Steps:**
1. Open OpsGrid.
2. Wait for the initial data query to complete.

**Expected outcome:**
- The OpsGrid heading is visible.
- The table displays the first 25 rows.
- The footer indicates that rows 1-25 of 5,000 cases are shown.

**Actual outcome:**

**Status:** Not executed

### TC-002 - Table loading state

**Purpose:** Confirm that a slow query uses an in-table loading state.

**Preconditions:** Simulated API latency is configured to 2500 ms before the initial case query begins.

**Steps:**
1. Open OpsGrid.
2. Observe the table before the initial response finishes.

**Expected outcome:**
- A table-shaped skeleton and the loading text are visible during the initial load of data.
- The application does not show a full-screen spinner or an empty-state message as a loading substitute.

**Actual outcome:**

**Status:** Not executed

### TC-003 - Main-page information architecture

**Purpose:** Confirm that the essential product and architecture information is visible.

**Steps:**
1. Open OpsGrid.
2. Inspect the header, architecture summary strip, demo controls, table area, and footer.

**Expected outcome:**
- The header identifies OpsGrid as a Regulatory Operations Table System.
- The architecture strip names the documented async capabilities.
- Demo controls, filters, the table, pagination, and the architecture footer are visible in the documented page order.

**Actual outcome:**

**Status:** Not executed

## Search and filtering

### TC-004 - Debounced search updates results

**Purpose:** Verify that search waits for the debounce interval before querying.

**Steps:**
1. Enter a distinctive institution name in Search.
2. Observe the table immediately after typing.
3. Wait at least 350 ms.

**Expected outcome:**
- The input value updates immediately.
- The case query updates only after the debounce interval.
- The resulting rows match the search phrase.
- The current page is page 1.

**Actual outcome:**

**Status:** Not executed

### TC-005 - Search is case-insensitive across supported fields

**Purpose:** Verify the search fields exposed by the API.

**Steps:**
1. Search for a known institution using different letter casing.
2. Search for a known report type, jurisdiction, submission code, reviewer, and description phrase in turn.
3. Wait for the debounce interval after each query.

**Expected outcome:**
- Each search returns matching rows regardless of letter casing.
- Searches can match institution, report type, jurisdiction, submission code, assigned reviewer, and description text.

**Actual outcome:**

**Status:** Not executed

### TC-006 - Search with no matches

**Purpose:** Verify the empty state and recovery path.

**Steps:**
1. Enter a phrase that cannot occur in the generated data.
2. Wait for the query to finish.
3. Select Reset filters.

**Expected outcome:**
- The empty state explains that no cases match the current filters.
- The empty state offers a Reset filters action.
- Reset filters restores the default result set and page 1.

**Actual outcome:**

**Status:** Not executed

### TC-007 - Status filter

**Purpose:** Verify server-side status filtering.

**Steps:**
1. Select a specific Status value.
2. Wait for the results to update.
3. Inspect the visible status values.

**Expected outcome:**
- The page resets to page 1.
- Every displayed row has the selected status.
- The footer total reflects the filtered result set.

**Actual outcome:**

**Status:** Not executed

### TC-008 - Risk filter

**Purpose:** Verify server-side risk-level filtering.

**Steps:**
1. Select a specific Risk value.
2. Wait for the results to update.
3. Inspect the visible risk labels.

**Expected outcome:**
- The page resets to page 1.
- Every displayed row has the selected risk level.
- Critical risk remains visually distinct and has a text label.

**Actual outcome:**

**Status:** Not executed

### TC-009 - Jurisdiction filter

**Purpose:** Verify server-side jurisdiction filtering.

**Steps:**
1. Select a jurisdiction.
2. Wait for the results to update.
3. Inspect the visible jurisdiction values.

**Expected outcome:**
- The page resets to page 1.
- Every displayed row belongs to the selected jurisdiction.

**Actual outcome:**

**Status:** Not executed

### TC-010 - Combined filters

**Purpose:** Verify that the API combines all active criteria.

**Steps:**
1. Select a Status, Risk, and Jurisdiction.
2. Enter a search phrase that has matches within that combination.
3. Wait for the results to update.

**Expected outcome:**
- Every displayed row satisfies all selected filters and the search phrase.
- The total is no greater than the total for any individual active filter.
- Sorting remains unchanged.

**Actual outcome:**

**Status:** Not executed

### TC-011 - Reset filters

**Purpose:** Verify the toolbar reset action.

**Steps:**
1. Change Search, Status, Risk, Jurisdiction, and Page size.
2. Navigate away from page 1.
3. Select Reset filters.

**Expected outcome:**
- Search is empty.
- Status, Risk, and Jurisdiction return to All.
- Page size returns to 25 and the current page returns to 1.
- Row selection is cleared.

**Actual outcome:**

**Status:** Not executed

### TC-012 - Page size selection

**Purpose:** Verify that page size is sent to the server and changes the current page.

**Steps:**
1. Select 50 from Page size.
2. Wait for the results to update.
3. Select 100, then 200.

**Expected outcome:**
- The table and footer reflect the selected page size, subject to the remaining result count.
- Each page-size change returns to page 1.
- Existing selection is cleared.

**Actual outcome:**

**Status:** Not executed

## Sorting and pagination

### TC-013 - Default deadline sorting

**Purpose:** Verify the documented default sort.

**Steps:**
1. Open OpsGrid with default filters.
2. Inspect the Deadline column and its sort indicator.

**Expected outcome:**
- Deadline is the active sort column in ascending order.
- Deadlines on the first page are ordered from earliest to latest.

**Actual outcome:**

**Status:** Not executed

### TC-014 - Sort direction toggle

**Purpose:** Verify a sortable header cycles between ascending and descending order.

**Steps:**
1. Select the Institution header.
2. Wait for the results to update.
3. Select Institution again.

**Expected outcome:**
- The first selection sorts Institution ascending.
- The second selection sorts Institution descending.
- The header communicates the current sort direction.

**Actual outcome:**

**Status:** Not executed

### TC-015 - Server-style sorting resets pagination

**Purpose:** Verify that sorting applies to the entire filtered result set.

**Steps:**
1. Navigate to page 2.
2. Select a sortable column header.
3. Wait for the query to finish.

**Expected outcome:**
- The current page returns to 1.
- The results are sorted across the full filtered dataset before the first page is returned.
- Existing row selection is cleared.

**Actual outcome:**

**Status:** Not executed

### TC-016 - Next and previous page navigation

**Purpose:** Verify ordinary server-pagination navigation.

**Steps:**
1. Open the initial page.
2. Select Next.
3. Select Prev.

**Expected outcome:**
- Next shows rows 26-50 and indicates page 2.
- Prev returns to rows 1-25 and indicates page 1.
- Active filters and sorting are preserved.

**Actual outcome:**

**Status:** Not executed

### TC-017 - First and last page navigation

**Purpose:** Verify pagination boundary controls.

**Steps:**
1. Open the initial page.
2. Select Last.
3. Select First.

**Expected outcome:**
- Last opens the final available page and shows the final slice of the result set.
- First returns to page 1.
- The page indicator and showing range remain accurate.

**Actual outcome:**

**Status:** Not executed

### TC-018 - Pagination boundary buttons

**Purpose:** Ensure impossible page navigation is unavailable.

**Steps:**
1. Open page 1.
2. Inspect First and Prev.
3. Navigate to the final page.
4. Inspect Next and Last.

**Expected outcome:**
- First and Prev are disabled on page 1.
- Next and Last are disabled on the final page.

**Actual outcome:**

**Status:** Not executed

### TC-019 - Pagination with a filtered result set

**Purpose:** Verify pagination totals after filtering.

**Steps:**
1. Apply a filter that produces more than one page but fewer than all cases.
2. Navigate through the available pages.

**Expected outcome:**
- The showing range, page count, and disabled boundary controls are based on the filtered total.
- No page is empty unless the filters return zero matches.

**Actual outcome:**

**Status:** Not executed

### TC-020 - Return to a cached page

**Purpose:** Verify cached page behavior without incorrect data.

**Steps:**
1. Load page 1.
2. Navigate to page 2 and wait for it to finish.
3. Navigate back to page 1.

**Expected outcome:**
- Page 1 is displayed correctly when returning.
- The page does not clear or flash to an unrelated state while cached data is used.
- The result remains consistent with the active filters and sorting.

**Actual outcome:**

**Status:** Not executed

### TC-021 - Previous data during a page transition

**Purpose:** Verify the non-flickering transition between pages.

**Steps:**
1. Set demo latency to 1500 ms.
2. Load page 1.
3. Select Next and observe the table before the page-2 response finishes.

**Expected outcome:**
- Previously loaded rows may remain visible while the request is in progress.
- A refreshing indicator communicates that the records are updating.
- The page does not briefly display an empty state or an error state.

**Actual outcome:**

**Status:** Not executed

### TC-022 - Rapid search avoids stale results

**Purpose:** Verify stale-request protection.

**Steps:**
1. Set demo latency to 1500 ms.
2. Enter one valid search phrase and wait slightly longer than 350 ms to start its query.
3. Immediately replace it with a different valid search phrase and wait for all requests to settle.

**Expected outcome:**
- The final table results correspond only to the final search phrase.
- Results for the earlier phrase do not overwrite the later results.

**Actual outcome:**

**Status:** Not executed

## Table interaction and detail drawer

### TC-023 - Individual row selection

**Purpose:** Verify individual selection and the bulk-action trigger.

**Steps:**
1. Select a row checkbox.
2. Inspect the selection count and bulk actions.
3. Clear the same checkbox.

**Expected outcome:**
- The selection count changes from 0 to 1 and back to 0.
- Mark reviewed and Clear selection are available only while one or more rows are selected.

**Actual outcome:**

**Status:** Not executed

### TC-024 - Select all rows on the current page

**Purpose:** Verify header selection scope.

**Steps:**
1. Select the header checkbox.
2. Inspect the selected count.
3. Navigate to a different page.

**Expected outcome:**
- All rows on the current page are selected.
- The selected count equals the current page row count.
- The header control does not select unvisited rows on other server pages.

**Actual outcome:**

**Status:** Not executed

### TC-025 - Partially selected header checkbox

**Purpose:** Verify the indeterminate selection state.

**Steps:**
1. Select one, but not all, row checkboxes on the current page.
2. Inspect the header checkbox.
3. Select the header checkbox.

**Expected outcome:**
- The header checkbox is visibly indeterminate while only some visible rows are selected.
- Selecting it selects every row on the current page.

**Actual outcome:**

**Status:** Not executed

### TC-026 - Clear selection action

**Purpose:** Verify bulk-selection reset.

**Steps:**
1. Select multiple rows.
2. Select Clear selection.

**Expected outcome:**
- Every selected checkbox is cleared.
- The selected count returns to 0.
- Bulk actions are hidden or unavailable.

**Actual outcome:**

**Status:** Not executed

### TC-027 - Row click opens detail drawer

**Purpose:** Verify the primary detail navigation path.

**Steps:**
1. Select a non-interactive area of a case row.
2. Inspect the drawer.

**Expected outcome:**
- A right-side detail drawer opens for the selected case without route navigation.
- The drawer institution and report type match the selected row.

**Actual outcome:**

**Status:** Not executed

### TC-028 - View details action opens matching drawer

**Purpose:** Verify the explicit row action.

**Steps:**
1. Select the View details action for a row.
2. Inspect the drawer.

**Expected outcome:**
- The drawer opens for that exact row.
- The action click does not trigger an unrelated row interaction.

**Actual outcome:**

**Status:** Not executed

### TC-029 - Interactive row controls do not open detail drawer

**Purpose:** Prevent accidental drawer navigation.

**Steps:**
1. Select a row checkbox.
2. Change a row Status value.
3. Observe whether the drawer opens after each interaction.

**Expected outcome:**
- Selection and status controls perform their own action.
- Neither interaction opens the detail drawer.

**Actual outcome:**

**Status:** Not executed

### TC-030 - Detail drawer content

**Purpose:** Verify complete case information.

**Steps:**
1. Open a case detail drawer.
2. Inspect the operational summary, description, and technical metadata sections.

**Expected outcome:**
- The drawer shows institution, report type, jurisdiction, status, risk, deadline, reviewer, error count, submission code, priority score, last updated date, and description.
- The technical metadata explains the MSW API and optimistic rollback behavior.

**Actual outcome:**

**Status:** Not executed

### TC-031 - Close drawer with the close button

**Purpose:** Verify the visible close control.

**Steps:**
1. Open a case detail drawer.
2. Select Close details.

**Expected outcome:**
- The drawer closes and focus remains within the main page experience.

**Actual outcome:**

**Status:** Not executed

### TC-032 - Close drawer with Escape

**Purpose:** Verify keyboard dismissal.

**Steps:**
1. Open a case detail drawer.
2. Press Escape.

**Expected outcome:**
- The drawer closes.

**Actual outcome:**

**Status:** Not executed

### TC-033 - Close drawer by backdrop click

**Purpose:** Verify pointer dismissal outside the drawer.

**Steps:**
1. Open a case detail drawer.
2. Select the shaded backdrop outside the drawer panel.

**Expected outcome:**
- The drawer closes.

**Actual outcome:**

**Status:** Not executed

### TC-034 - Keyboard opens a focused row

**Purpose:** Verify table-row keyboard access.

**Steps:**
1. Move focus to a case row using the keyboard.
2. Press Enter.
3. Close the drawer, focus another row, and press Space.

**Expected outcome:**
- Enter and Space each open the corresponding case detail drawer.

**Actual outcome:**

**Status:** Not executed

## Mutations and recovery

### TC-035 - Successful inline status update

**Purpose:** Verify a successful optimistic status mutation.

**Steps:**
1. Change a row Status to another value.
2. Observe the value before the configured API latency completes.
3. Wait for the mutation to finish.

**Expected outcome:**
- The new status appears immediately.
- The value remains after the server response succeeds.
- A success message confirms that the status was updated.

**Actual outcome:**

**Status:** Not executed

### TC-036 - Failed inline status update rolls back

**Purpose:** Verify optimistic rollback and visible feedback.

**Steps:**
1. Note a row's current Status.
2. Select Fail next update.
3. Change that row Status.
4. Wait for the mutation to fail.

**Expected outcome:**
- The changed status appears optimistically before the response finishes.
- The original status is restored after the failure.
- A visible message states that the update failed and the previous status was restored.

**Actual outcome:**

**Status:** Not executed

### TC-037 - Successful bulk review

**Purpose:** Verify bulk optimistic updates and completion behavior.

**Steps:**
1. Select two or more rows with different current statuses.
2. Select Mark reviewed.
3. Wait for the mutation to finish.

**Expected outcome:**
- Each selected row changes to Reviewed immediately.
- The reviewed values remain after a successful response.
- Selection is cleared and a success message is shown.

**Actual outcome:**

**Status:** Not executed

### TC-038 - Failed bulk review rolls back and preserves selection

**Purpose:** Verify bulk rollback behavior.

**Steps:**
1. Select two or more rows and note their statuses.
2. Select Fail next update.
3. Select Mark reviewed.
4. Wait for the mutation to fail.

**Expected outcome:**
- The selected rows change to Reviewed optimistically.
- Their original statuses are restored after failure.
- The selected rows remain selected.
- A visible error message explains that the previous values were restored.

**Actual outcome:**

**Status:** Not executed

### TC-039 - Mutation controls while a bulk request is pending

**Purpose:** Avoid duplicate bulk updates.

**Steps:**
1. Set demo latency to 2500 ms.
2. Select multiple rows and select Mark reviewed.
3. Try selecting Mark reviewed and Clear selection again before the request completes.

**Expected outcome:**
- Bulk-action controls are disabled while the bulk mutation is pending.
- Only one bulk request can be initiated for the selected set.

**Actual outcome:**

**Status:** Not executed

## Demo controls, query failure, and data reset

### TC-040 - Fail-next-fetch is armed without disrupting current data

**Purpose:** Verify the failure-control setup action.

**Steps:**
1. Load a case page successfully.
2. Select Fail next fetch.
3. Inspect the current table before causing another query.

**Expected outcome:**
- A notice confirms that the next fetch will fail.
- The currently loaded table remains visible and no error state appears yet.

**Actual outcome:**

**Status:** Not executed

### TC-041 - Fetch error state and retry recovery

**Purpose:** Verify failed-query recovery.

**Steps:**
1. Arm Fail next fetch.
2. Trigger a new query, for example by selecting Next.
3. Wait for the request to fail.
4. Select Retry fetch.

**Expected outcome:**
- The table shows the documented service-retrieval error and the explanatory demo-control text.
- Retry fetch successfully reloads the requested page.
- The error state disappears after recovery.

**Actual outcome:**

**Status:** Not executed

### TC-042 - One-shot fetch failure is consumed once

**Purpose:** Verify the failure control only affects one request.

**Steps:**
1. Arm Fail next fetch.
2. Trigger a query and wait for it to fail.
3. Trigger the same query again without rearming the failure control.

**Expected outcome:**
- The first query fails.
- The following query succeeds unless another failure condition has been configured.

**Actual outcome:**

**Status:** Not executed

### TC-043 - Latency selector affects future API responses

**Purpose:** Verify configurable simulated network latency.

**Steps:**
1. Select 0 ms latency and trigger a new query.
2. Select 2500 ms latency and trigger another new query.

**Expected outcome:**
- The first response completes without an artificial delay.
- The second response is visibly delayed by approximately the selected latency.
- The selected latency value remains displayed.

**Actual outcome:**

**Status:** Not executed

### TC-044 - Clear cache reloads the active page

**Purpose:** Verify the cache-clear recovery control.

**Steps:**
1. Load a page of results.
2. Select Clear cache.
3. Wait for the active query to complete.

**Expected outcome:**
- A cache-cleared notice is shown.
- The active page is fetched again and displays data consistent with the current query parameters.

**Actual outcome:**

**Status:** Not executed

### TC-045 - Reset data restores the generated baseline

**Purpose:** Verify that demo data changes are not permanent.

**Steps:**
1. Change one or more case statuses successfully.
2. Select Reset data.
3. Wait for the active page to refresh.

**Expected outcome:**
- A data-reset notice is shown.
- The generated baseline dataset is restored.
- Changed statuses revert to their generated initial values when their records are viewed again.
- Row selection and an open detail drawer are cleared.

**Actual outcome:**

**Status:** Not executed

### TC-046 - Table remains visible after a long inactive-tab interval

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that leaving OpsGrid in an inactive browser tab does not leave the table blank or unusable when the user returns.

**Steps:**
1. Open OpsGrid.
2. Open a second browser tab to a blank page and leave the OpsGrid tab inactive for 10 minutes.
3. Navigate back to the OpsGrid tab.
4. Wait 1000 ms.
5. View the table content.

**Expected outcome:**
- Case data is still visible in the table.

**Actual outcome:**
- Page displayed correctly at step 5.

**Status:** Passed

### TC-047 - Narrow mobile viewport layout

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that the primary page remains usable on a narrow mobile viewport.

**Preconditions:** Set the browser viewport to 320 x 568 CSS pixels.

**Steps:**
1. Open OpsGrid.
2. Wait for the initial query to complete.
3. Inspect the header, demo controls, filters, table, pagination, and footer.

**Expected outcome:**
- No essential control or text is clipped, overlapped, or inaccessible.
- The table remains usable through its intended horizontal and vertical scrolling behavior.
- Filter controls and pagination remain reachable and operable.

**Actual outcome:**

**Status:** Not executed

### TC-048 - Mobile table interaction

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that a narrow viewport does not prevent table actions.

**Preconditions:** Set the browser viewport to 375 x 667 CSS pixels.

**Steps:**
1. Load OpsGrid and wait for data.
2. Horizontally scroll the table as needed.
3. Select a row checkbox, change a status, and open the row's View details action.

**Expected outcome:**
- The selection checkbox, status control, and View details action are reachable and usable.
- Each action affects the intended row.
- Horizontal scrolling does not trigger an unintended row click or open the wrong drawer.

**Actual outcome:**

**Status:** Not executed

### TC-049 - Mobile detail-drawer usability

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that the detail drawer is readable and dismissible on mobile.

**Preconditions:** Set the browser viewport to 375 x 667 CSS pixels.

**Steps:**
1. Open the detail drawer for a case.
2. Scroll through its content.
3. Close it with the close button and reopen it.
4. Press Escape to close it again.

**Expected outcome:**
- Drawer content is readable without horizontal clipping.
- Important content and the close control remain reachable while scrolling.
- Both dismissal methods close the drawer reliably.

**Actual outcome:**

**Status:** Not executed

### TC-050 - Resize after data and virtual rows are rendered

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Detect layout or virtualization corruption during responsive viewport changes.

**Steps:**
1. Open OpsGrid in a desktop-width viewport and load data.
2. Scroll the table body away from its first row.
3. Resize the viewport to a mobile width.
4. Resize it back to desktop width.
5. Inspect the table and pagination.

**Expected outcome:**
- Rows remain visible, correctly aligned, and interactive after each resize.
- The table does not show duplicated rows, blank gaps, or an incorrect total.
- Pagination remains operable.

**Actual outcome:**

**Status:** Not executed

### TC-051 - Virtualized scrolling with the maximum page size

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify virtualization at the largest supported page size.

**Steps:**
1. Set Page size to 200.
2. Wait for the query to finish.
3. Scroll repeatedly from the top of the table body to the bottom and back.
4. Open a detail drawer for a row near the bottom.

**Expected outcome:**
- Scrolling remains responsive.
- Rows do not disappear unexpectedly, duplicate, or overlap.
- The selected near-bottom row opens the matching detail drawer.

**Actual outcome:**

**Status:** Not executed

### TC-052 - Rapid page changes under high latency

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that delayed page responses cannot overwrite the final navigation choice.

**Steps:**
1. Set demo latency to 1500 ms.
2. Select Next, then Next again, then Prev before the prior responses finish.
3. Wait until all requests have settled.

**Expected outcome:**
- The page indicator and table content correspond to the final page choice.
- Data from superseded page requests does not replace the final page's rows.

**Actual outcome:**

**Status:** Not executed

### TC-053 - Rapid filter changes under high latency

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify stale-request protection across filter changes.

**Steps:**
1. Set demo latency to 1500 ms.
2. Change Status, Risk, and Jurisdiction in quick succession.
3. Wait until all requests have settled.

**Expected outcome:**
- The final table contains rows matching the final combination of filters only.
- No earlier filter response overwrites the final result set.
- The current page is 1.

**Actual outcome:**

**Status:** Not executed

### TC-054 - Consecutive updates to the same case

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that multiple in-flight updates to one row resolve to the user's latest successful choice.

**Steps:**
1. Set demo latency to 1500 ms.
2. Change a case Status to one value.
3. Before the first update finishes, change the same case Status to a second value.
4. Wait until both requests have settled.

**Expected outcome:**
- The final row status is the second selected value.
- Earlier mutation responses do not overwrite the latest completed user choice.
- The table and the API-backed record agree after the requests settle.

**Actual outcome:**

**Status:** Not executed

### TC-055 - Reset data while a mutation is in progress

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify that resetting the demo dataset produces a stable baseline despite an outstanding update.

**Steps:**
1. Set demo latency to 2500 ms.
2. Note a row's status and start an inline status update.
3. Before the update finishes, select Reset data.
4. Wait until the reset and the update request have both settled.
5. Find the same case again.

**Expected outcome:**
- The reset action restores the generated baseline status for the case.
- An update initiated before the reset does not reapply after the reset completes.
- The interface remains usable and provides clear feedback for the completed actions.

**Actual outcome:**

**Status:** Not executed

### TC-056 - Open detail drawer during a failed update to the same row

**Tier:** Tier 3 - Extended regression suite

**Purpose:** Verify cross-component consistency during an optimistic update and rollback.

**Steps:**
1. Open a row's detail drawer.
2. Note that row's current Status.
3. Select Fail next update.
4. Change that same row's Status in the table.
5. Observe the drawer before and after the mutation fails.

**Expected outcome:**
- The table and open drawer show the same optimistic status before the failure response completes.
- Both restore the original status after failure.
- The rollback feedback is visible.

**Actual outcome:**

**Status:** Not executed
