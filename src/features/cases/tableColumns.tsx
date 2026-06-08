import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { CaseRiskBadge } from "./components/CaseRiskBadge";
import { CaseStatusSelect } from "./components/CaseStatusSelect";
import { formatStatusLabel } from "./filterOptions";
import type { CaseStatus, OperationalCase } from "./types";

interface BuildCaseColumnsOptions {
  selectedIds: Set<string>;
  pendingStatusIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAllVisible: () => void;
  areAllVisibleSelected: boolean;
  areSomeVisibleSelected: boolean;
  onStatusChange: (id: string, status: CaseStatus) => void;
  onViewCase: (selectedCase: OperationalCase) => void;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function isOverdue(value: string): boolean {
  return new Date(value).getTime() < Date.now();
}

export function buildCaseColumns({
  selectedIds,
  pendingStatusIds,
  onToggleRow,
  onToggleAllVisible,
  areAllVisibleSelected,
  areSomeVisibleSelected,
  onStatusChange,
  onViewCase,
}: BuildCaseColumnsOptions): ColumnDef<OperationalCase>[] {
  return [
    {
      id: "selection",
      header: () => (
        <input
          aria-label="Select all cases on this page"
          checked={areAllVisibleSelected}
          ref={(element) => {
            if (element) {
              element.indeterminate = areSomeVisibleSelected && !areAllVisibleSelected;
            }
          }}
          type="checkbox"
          onChange={onToggleAllVisible}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      cell: ({ row }) => (
        <input
          aria-label={`Select ${row.original.id}`}
          checked={selectedIds.has(row.original.id)}
          type="checkbox"
          onChange={() => onToggleRow(row.original.id)}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      size: 48,
      enableSorting: false,
    },
    {
      accessorKey: "institution",
      header: "Institution",
      cell: ({ row }) => row.original.institution,
      size: 180,
    },
    {
      accessorKey: "reportType",
      header: "Report Type",
      cell: ({ row }) => row.original.reportType,
      size: 220,
    },
    {
      accessorKey: "jurisdiction",
      header: "Jurisdiction",
      cell: ({ row }) => row.original.jurisdiction,
      size: 140,
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => (
        <span data-overdue={isOverdue(row.original.deadline)}>
          {formatDate(row.original.deadline)}
        </span>
      ),
      size: 132,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <CaseStatusSelect
          isUpdating={pendingStatusIds.has(row.original.id)}
          status={row.original.status}
          onChange={(status) => onStatusChange(row.original.id, status)}
        />
      ),
      sortingFn: (left, right) =>
        formatStatusLabel(left.original.status).localeCompare(formatStatusLabel(right.original.status)),
      size: 142,
    },
    {
      accessorKey: "riskLevel",
      header: "Risk",
      cell: ({ row }) => <CaseRiskBadge riskLevel={row.original.riskLevel} />,
      size: 112,
    },
    {
      accessorKey: "assignedReviewer",
      header: "Reviewer",
      cell: ({ row }) => row.original.assignedReviewer ?? "Unassigned",
      size: 160,
    },
    {
      accessorKey: "errorCount",
      header: "Errors",
      cell: ({ row }) => (
        <span data-errors={row.original.errorCount > 0}>{row.original.errorCount}</span>
      ),
      size: 90,
    },
    {
      accessorKey: "lastUpdated",
      header: "Last Updated",
      cell: ({ row }) => formatDate(row.original.lastUpdated),
      size: 140,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          aria-label={`View details for ${row.original.id}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onViewCase(row.original);
          }}
        >
          <Eye aria-hidden="true" size={18} />
        </button>
      ),
      size: 86,
      enableSorting: false,
    },
  ];
}
