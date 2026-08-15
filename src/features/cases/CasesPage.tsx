import { ArchitectureFooter } from "./components/ArchitectureFooter";
import { CaseDetailDrawer } from "./components/CaseDetailDrawer";
import { CasesTable } from "./components/CasesTable";
import { CasesToolbar } from "./components/CasesToolbar";
import { DemoControls } from "./components/DemoControls";
import { useCasesPageController } from "./hooks/useCasesPageController";
import { useDemoControls } from "./hooks/useDemoControls";
import styles from "./CasesPage.module.css";

const summaryItems = [
  "Debounced Search",
  "Abortable Requests",
  "Server-Style Filters",
  "Cached Pages",
  "Virtualized Rows",
  "Optimistic Mutations",
  "Rollback on Failure",
  "MSW Fake API",
];

export function CasesPage() {
  const controller = useCasesPageController();
  const demoControls = useDemoControls({
    clearSelection: controller.clearSelection,
    closeDetails: controller.closeDetails,
    onNotice: controller.setNotice,
    refetchCases: () => controller.casesQuery.refetch(),
  });
  const {
    bulkReviewMutation,
    casesQuery,
    clearSelection,
    closeDetails,
    drawerCase,
    handleBulkReview,
    handleFilterChange,
    handlePageChange,
    handleReset,
    handleSearchInputChange,
    handleSortingChange,
    handleStatusChange,
    handleToggleAllVisible,
    handleToggleRow,
    notice,
    params,
    pendingStatusIds,
    searchInput,
    selectedIds,
    setNotice,
    setSelectedCase,
    sorting,
  } = controller;
  const {
    handleClearCache,
    handleFailNextFetch,
    handleFailNextUpdate,
    handleLatencyChange,
    handleResetData,
    isDemoBusy,
    latencyMs,
  } = demoControls;

  return (
    <main className={styles.page}>
      <section className={styles.topGrid}>
        <header className={styles.header}>
          <div className={styles.brandBlock}>
            <span className={styles.markFrame} aria-hidden="true">
            </span>
            <div className={styles.brandCopy}>
              <p className={styles.eyebrow}>Regulatory Operations Table System</p>
              <h1 className={styles.title}>OpsGrid</h1>
              <p className={styles.subtitle}>
                An async data table demo for operational compliance records, showing debounced
                search, server-style filtering, pagination, virtualization, caching, optimistic
                edits, rollback, and error recovery.
              </p>
            </div>
          </div>
        </header>

        <DemoControls
          isBusy={isDemoBusy}
          latencyMs={latencyMs}
          onClearCache={handleClearCache}
          onFailNextFetch={handleFailNextFetch}
          onFailNextUpdate={handleFailNextUpdate}
          onLatencyChange={handleLatencyChange}
          onResetData={handleResetData}
        />
      </section>

      <section className={styles.strip} aria-label="Architecture capabilities">
        {summaryItems.map((item) => (
          <span className={styles.badge} key={item}>
            {item}
          </span>
        ))}
      </section>

      <CasesToolbar
        params={params}
        searchInput={searchInput}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        onSearchInputChange={handleSearchInputChange}
      />

      <button
        aria-hidden={!notice}
        className={styles.notice}
        data-kind={notice?.kind ?? "success"}
        data-visible={Boolean(notice)}
        tabIndex={notice ? 0 : -1}
        type="button"
        onClick={() => setNotice(null)}
      >
        {notice?.message}
      </button>

      <CasesTable
        data={casesQuery.data}
        isError={casesQuery.isError}
        isFetching={casesQuery.isFetching}
        isLoading={casesQuery.isLoading}
        isRefetchError={casesQuery.isRefetchError}
        isReviewing={bulkReviewMutation.isPending}
        pendingStatusIds={pendingStatusIds}
        selectedIds={selectedIds}
        sorting={sorting}
        onClearSelection={clearSelection}
        onPageChange={handlePageChange}
        onRetry={() => void casesQuery.refetch()}
        onReviewSelected={handleBulkReview}
        onSortingChange={handleSortingChange}
        onStatusChange={handleStatusChange}
        onToggleAllVisible={handleToggleAllVisible}
        onToggleRow={handleToggleRow}
        onViewCase={setSelectedCase}
      />

      <CaseDetailDrawer selectedCase={drawerCase} onClose={closeDetails} />

      <ArchitectureFooter />
    </main>
  );
}
