import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resetDemoData, updateDemoConfig } from "../../api/casesApi";
import type { CasesQueryParams } from "../../api/apiTypes";
import { queryClient } from "../../app/queryClient";
import { ArchitectureFooter } from "./components/ArchitectureFooter";
import { CaseDetailDrawer } from "./components/CaseDetailDrawer";
import { CasesTable } from "./components/CasesTable";
import { CasesToolbar } from "./components/CasesToolbar";
import { DemoControls } from "./components/DemoControls";
import { useBulkReviewMutation, usePatchCaseMutation } from "./hooks/useCaseMutations";
import { useCasesQuery } from "./hooks/useCasesQuery";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import type { CaseStatus, OperationalCase } from "./types";
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

const initialParams: CasesQueryParams = {
  page: 1,
  pageSize: 25,
  search: "",
  status: "all",
  riskLevel: "all",
  jurisdiction: "all",
  sortBy: "deadline",
  sortDirection: "asc",
};

export function CasesPage() {
  const [params, setParams] = useState<CasesQueryParams>(initialParams);
  const [searchInput, setSearchInput] = useState(initialParams.search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingStatusIds, setPendingStatusIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const [selectedCase, setSelectedCase] = useState<OperationalCase | null>(null);
  const [latencyMs, setLatencyMs] = useState(500);
  const [isDemoBusy, setIsDemoBusy] = useState(false);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const queryParams = useMemo(
    () => ({ ...params, search: debouncedSearch }),
    [debouncedSearch, params],
  );

  const casesQuery = useCasesQuery(queryParams);
  const refetchCases = casesQuery.refetch;
  const patchCaseMutation = usePatchCaseMutation();
  const bulkReviewMutation = useBulkReviewMutation();

  const sorting = useMemo<SortingState>(
    () => [{ id: params.sortBy, desc: params.sortDirection === "desc" }],
    [params.sortBy, params.sortDirection],
  );
  const drawerCase = useMemo(() => {
    if (!selectedCase) {
      return null;
    }

    return casesQuery.data?.items.find((item) => item.id === selectedCase.id) ?? selectedCase;
  }, [casesQuery.data?.items, selectedCase]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => setNotice(null), 3_000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const handleFilterChange = useCallback(
    (
      patch: Partial<
        Pick<CasesQueryParams, "status" | "riskLevel" | "jurisdiction" | "pageSize">
      >,
    ) => {
      setParams((current) => ({ ...current, ...patch, page: 1 }));
      setSelectedIds(new Set());
    },
    [],
  );

  const handleReset = useCallback(() => {
    setSearchInput(initialParams.search);
    setParams(initialParams);
    setSelectedIds(new Set());
  }, []);

  const handleSortingChange = useCallback<OnChangeFn<SortingState>>((updaterOrValue) => {
    const nextSorting =
      typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    const next = nextSorting[0];

    if (!next) {
      return;
    }

    setParams((current) => ({
      ...current,
      page: 1,
      sortBy: next.id,
      sortDirection: next.desc ? "desc" : "asc",
    }));
    setSelectedIds(new Set());
  }, [sorting]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
    setParams((current) => ({ ...current, page: 1 }));
    setSelectedIds(new Set());
  }, []);

  const handleToggleRow = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  const handleToggleAllVisible = useCallback(() => {
    const visibleIds = casesQuery.data?.items.map((item) => item.id) ?? [];

    setSelectedIds((current) => {
      const next = new Set(current);
      const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));

      visibleIds.forEach((id) => {
        if (allVisibleSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });

      return next;
    });
  }, [casesQuery.data?.items]);

  const handleStatusChange = useCallback(
    (id: string, status: CaseStatus) => {
      setPendingStatusIds((current) => new Set(current).add(id));
      patchCaseMutation.mutate(
        { id, patch: { status } },
        {
          onSuccess: () => setNotice({ message: "Case status updated.", kind: "success" }),
          onError: () =>
            setNotice({ message: "Update failed. Previous status restored.", kind: "error" }),
          onSettled: () => {
            setPendingStatusIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          },
        },
      );
    },
    [patchCaseMutation],
  );

  const handleBulkReview = useCallback(() => {
    const ids = Array.from(selectedIds);

    if (ids.length === 0) {
      return;
    }

    bulkReviewMutation.mutate(
      { ids },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setNotice({ message: "Selected cases marked as reviewed.", kind: "success" });
        },
        onError: () =>
          setNotice({
            message: "The selected cases could not be reviewed. Previous values restored.",
            kind: "error",
          }),
      },
    );
  }, [bulkReviewMutation, selectedIds]);

  const runDemoAction = useCallback(async (action: () => Promise<void>) => {
    setIsDemoBusy(true);

    try {
      await action();
    } finally {
      setIsDemoBusy(false);
    }
  }, []);

  const handleLatencyChange = useCallback(
    (nextLatencyMs: number) => {
      void runDemoAction(async () => {
        await updateDemoConfig({ latencyMs: nextLatencyMs });
        setLatencyMs(nextLatencyMs);
        setNotice({ message: "Latency updated.", kind: "success" });
      });
    },
    [runDemoAction],
  );

  const handleFailNextFetch = useCallback(() => {
    void runDemoAction(async () => {
      await updateDemoConfig({ failNextFetch: true });
      setNotice({ message: "Next fetch will fail.", kind: "error" });
    });
  }, [runDemoAction]);

  const handleFailNextUpdate = useCallback(() => {
    void runDemoAction(async () => {
      await updateDemoConfig({ failNextMutation: true });
      setNotice({ message: "Next update will fail.", kind: "error" });
    });
  }, [runDemoAction]);

  const handleClearCache = useCallback(() => {
    queryClient.clear();
    setNotice({ message: "Cache cleared.", kind: "success" });
    void refetchCases();
  }, [queryClient, refetchCases]);

  const handleResetData = useCallback(() => {
    void runDemoAction(async () => {
      await resetDemoData();
      setSelectedIds(new Set());
      setSelectedCase(null);
      setNotice({ message: "Data reset.", kind: "success" });
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
    });
  }, [runDemoAction]);

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
        isReviewing={bulkReviewMutation.isPending}
        pendingStatusIds={pendingStatusIds}
        selectedIds={selectedIds}
        sorting={sorting}
        onClearSelection={() => setSelectedIds(new Set())}
        onPageChange={(page) => setParams((current) => ({ ...current, page }))}
        onRetry={() => void casesQuery.refetch()}
        onReviewSelected={handleBulkReview}
        onSortingChange={handleSortingChange}
        onStatusChange={handleStatusChange}
        onToggleAllVisible={handleToggleAllVisible}
        onToggleRow={handleToggleRow}
        onViewCase={setSelectedCase}
      />

      <CaseDetailDrawer selectedCase={drawerCase} onClose={() => setSelectedCase(null)} />

      <ArchitectureFooter />
    </main>
  );
}
