import {
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";
import type { CasesResponse } from "../../../api/apiTypes";
import { buildCaseColumns } from "../tableColumns";
import type { CaseStatus, OperationalCase } from "../types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { TableSkeleton } from "./TableSkeleton";
import styles from "./CasesTable.module.css";

interface CasesTableProps {
  data: CasesResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  isReviewing: boolean;
  selectedIds: Set<string>;
  pendingStatusIds: Set<string>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  onToggleRow: (id: string) => void;
  onToggleAllVisible: () => void;
  onStatusChange: (id: string, status: CaseStatus) => void;
  onPageChange: (page: number) => void;
  onViewCase: (selectedCase: OperationalCase) => void;
  onRetry: () => void;
  onClearSelection: () => void;
  onReviewSelected: () => void;
}

function getShowingText(data: CasesResponse | undefined): string {
  if (!data || data.total === 0) {
    return "Showing 0 cases";
  }

  const start = (data.page - 1) * data.pageSize + 1;
  const end = Math.min(data.page * data.pageSize, data.total);

  return `Showing ${start.toLocaleString()}-${end.toLocaleString()} of ${data.total.toLocaleString()} cases`;
}

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) return null;

  return (
    <span
      className={styles.sortIndicator}
      aria-hidden="true"
    >
      {direction === "asc" ? " ↑" : " ↓"}
    </span>
  );
}

export function CasesTable({
  data,
  isLoading,
  isError,
  isFetching,
  isReviewing,
  selectedIds,
  pendingStatusIds,
  sorting,
  onSortingChange,
  onToggleRow,
  onToggleAllVisible,
  onStatusChange,
  onPageChange,
  onViewCase,
  onRetry,
  onClearSelection,
  onReviewSelected,
}: CasesTableProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const visibleIds = useMemo(() => items.map((item) => item.id), [items]);
  const selectedVisibleCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const areAllVisibleSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
  const areSomeVisibleSelected = selectedVisibleCount > 0;

  const columns = useMemo(
    () =>
      buildCaseColumns({
        selectedIds,
        pendingStatusIds,
        areAllVisibleSelected,
        areSomeVisibleSelected,
        onToggleRow,
        onToggleAllVisible,
        onStatusChange,
        onViewCase,
      }),
    [
      areAllVisibleSelected,
      areSomeVisibleSelected,
      onStatusChange,
      onViewCase,
      onToggleAllVisible,
      onToggleRow,
      pendingStatusIds,
      selectedIds,
    ],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<OperationalCase>({
    data: items,
    columns,
    state: { sorting },
    manualSorting: true,
    enableSortingRemoval: false,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const hasRows = rows.length > 0;
  const shouldShowBlockingError = isError && !hasRows;
  const shouldShowCachedRefreshError = isError && hasRows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  });

  return (
    <section className={styles.panel} aria-label="Operational compliance cases">
      <div className={styles.statusBar}>
        <div className={styles.statusCluster}>
          <span>
            <span className={styles.selected}>{selectedIds.size}</span> selected
          </span>
          <div className={styles.bulkActions} data-visible={selectedIds.size > 0}>
            <button
              className={styles.bulkButton}
              disabled={isReviewing}
              type="button"
              onClick={onReviewSelected}
            >
              Mark reviewed
            </button>
            <button
              className={styles.bulkButton}
              disabled={isReviewing}
              type="button"
              onClick={onClearSelection}
            >
              Clear selection
            </button>
          </div>
        </div>
        <span className={styles.queryStatus} aria-live="polite">
          {isFetching ? (
            <span className={styles.fetching}>Refreshing cached records...</span>
          ) : shouldShowCachedRefreshError ? (
            <>
              <span className={styles.refreshError}>Refresh failed. Showing cached records.</span>
              <button className={styles.inlineRetry} type="button" onClick={onRetry}>
                Retry
              </button>
            </>
          ) : (
            "Cached pages enabled by TanStack Query"
          )}
        </span>
      </div>

      <div className={styles.scroll} ref={parentRef}>
        <div className={styles.table} role="table">
          <div className={styles.thead} role="rowgroup">
            {table.getHeaderGroups().map((headerGroup) => (
              <div className={styles.tr} key={headerGroup.id} role="row">
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted();

                  return (
                    <div
                      className={styles.th}
                      key={header.id}
                      role="columnheader"
                      style={{ width: header.getSize() }}
                      aria-sort={
                        sortDirection === "asc"
                          ? "ascending"
                          : sortDirection === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      {header.column.getCanSort() ? (
                        <button
                          className={styles.sortButton}
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIndicator direction={sortDirection} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {isLoading ? <TableSkeleton /> : null}
          {shouldShowBlockingError ? <ErrorState onRetry={onRetry} /> : null}
          {!isLoading && !isError && !hasRows ? <EmptyState /> : null}

          {!isLoading && hasRows ? (
            <div
              className={styles.tbody}
              role="rowgroup"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];

                return (
                  <div
                    className={styles.row}
                    key={row.id}
                    role="row"
                    tabIndex={0}
                    onClick={() => onViewCase(row.original)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onViewCase(row.original);
                      }
                    }}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <div
                        className={styles.td}
                        key={cell.id}
                        role="cell"
                        style={{ width: cell.column.getSize() }}
                      >
                        <span className={styles.cellText}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <footer className={styles.footer}>
        <span>{getShowingText(data)}</span>
        <div className={styles.pagination} aria-label="Pagination">
          <button
            className={styles.pageButton}
            disabled={!data || data.page <= 1}
            type="button"
            onClick={() => onPageChange(1)}
          >
            First
          </button>
          <button
            className={styles.pageButton}
            disabled={!data || data.page <= 1}
            type="button"
            onClick={() => onPageChange((data?.page ?? 1) - 1)}
          >
            Prev
          </button>
          <span>
            Page {data?.page ?? 1} of {data?.totalPages ?? 1}
          </span>
          <button
            className={styles.pageButton}
            disabled={!data || data.page >= data.totalPages}
            type="button"
            onClick={() => onPageChange((data?.page ?? 1) + 1)}
          >
            Next
          </button>
          <button
            className={styles.pageButton}
            disabled={!data || data.page >= data.totalPages}
            type="button"
            onClick={() => onPageChange(data?.totalPages ?? 1)}
          >
            Last
          </button>
        </div>
      </footer>
    </section>
  );
}
