import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CasesQueryParams } from "../../api/apiTypes";
import { CasesTable } from "./components/CasesTable";
import { CasesToolbar } from "./components/CasesToolbar";
import { usePatchCaseMutation } from "./hooks/useCaseMutations";
import { useCasesQuery } from "./hooks/useCasesQuery";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import type { CaseStatus } from "./types";
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
  const [notice, setNotice] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const queryParams = useMemo(
    () => ({ ...params, search: debouncedSearch }),
    [debouncedSearch, params],
  );

  const casesQuery = useCasesQuery(queryParams);
  const patchCaseMutation = usePatchCaseMutation();

  const sorting = useMemo<SortingState>(
    () => [{ id: params.sortBy, desc: params.sortDirection === "desc" }],
    [params.sortBy, params.sortDirection],
  );

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
          onSuccess: () => setNotice("Case status updated."),
          onError: () => setNotice("Update failed. Previous status restored."),
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Regulatory Operations Table System</p>
        <h1 className={styles.title}>OpsGrid</h1>
        <p className={styles.subtitle}>
          An async data table demo for operational compliance records, showing debounced
          search, server-style filtering, pagination, virtualization, caching, optimistic
          edits, rollback, and error recovery.
        </p>
      </header>

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

      {notice ? (
        <button className={styles.notice} type="button" onClick={() => setNotice(null)}>
          {notice}
        </button>
      ) : null}

      <CasesTable
        data={casesQuery.data}
        isError={casesQuery.isError}
        isFetching={casesQuery.isFetching}
        isLoading={casesQuery.isLoading}
        pendingStatusIds={pendingStatusIds}
        selectedIds={selectedIds}
        sorting={sorting}
        onPageChange={(page) => setParams((current) => ({ ...current, page }))}
        onSortingChange={handleSortingChange}
        onStatusChange={handleStatusChange}
        onToggleAllVisible={handleToggleAllVisible}
        onToggleRow={handleToggleRow}
      />
    </main>
  );
}
