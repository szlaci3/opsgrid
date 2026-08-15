import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CasesQueryParams } from "../../../api/apiTypes";
import { useBulkReviewMutation, usePatchCaseMutation } from "./useCaseMutations";
import { useCasesQuery } from "./useCasesQuery";
import { useDebouncedValue } from "./useDebouncedValue";
import type { CaseStatus, OperationalCase } from "../types";

export const initialCasesQueryParams: CasesQueryParams = {
  page: 1,
  pageSize: 25,
  search: "",
  status: "all",
  riskLevel: "all",
  jurisdiction: "all",
  sortBy: "deadline",
  sortDirection: "asc",
};

export type CasesPageNotice = { message: string; kind: "success" | "error" };

export function useCasesPageController() {
  const [params, setParams] = useState<CasesQueryParams>(initialCasesQueryParams);
  const [searchInput, setSearchInput] = useState(initialCasesQueryParams.search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingStatusIds, setPendingStatusIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<CasesPageNotice | null>(null);
  const [selectedCase, setSelectedCase] = useState<OperationalCase | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput, 350);
  const queryParams = useMemo(
    () => ({ ...params, search: debouncedSearch }),
    [debouncedSearch, params],
  );

  const casesQuery = useCasesQuery(queryParams);
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
    setSearchInput(initialCasesQueryParams.search);
    setParams(initialCasesQueryParams);
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

  const handlePageChange = useCallback((page: number) => {
    setParams((current) => ({ ...current, page }));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const closeDetails = useCallback(() => setSelectedCase(null), []);

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

  return {
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
    selectedCase,
    selectedIds,
    setNotice,
    setSelectedCase,
    sorting,
  };
}
