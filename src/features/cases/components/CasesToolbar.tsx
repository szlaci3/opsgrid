import type { CasesQueryParams } from "../../../api/apiTypes";
import { jurisdictionOptions, riskOptions, statusOptions } from "../filterOptions";
import type { Jurisdiction, RiskLevel, CaseStatus } from "../types";
import styles from "./CasesToolbar.module.css";

interface CasesToolbarProps {
  params: CasesQueryParams;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onFilterChange: (
    patch: Partial<Pick<CasesQueryParams, "status" | "riskLevel" | "jurisdiction" | "pageSize">>,
  ) => void;
  onReset: () => void;
}

export function CasesToolbar({
  params,
  searchInput,
  onSearchInputChange,
  onFilterChange,
  onReset,
}: CasesToolbarProps) {
  return (
    <section className={styles.toolbar} aria-label="Case filters">
      <label className={styles.field}>
        <span className={styles.label}>Search</span>
        <input
          className={styles.input}
          placeholder="Search cases by institution, report type, code, reviewer..."
          type="search"
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Status</span>
        <select
          className={styles.select}
          value={params.status}
          onChange={(event) => onFilterChange({ status: event.target.value as CaseStatus | "all" })}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Risk</span>
        <select
          className={styles.select}
          value={params.riskLevel}
          onChange={(event) => onFilterChange({ riskLevel: event.target.value as RiskLevel | "all" })}
        >
          {riskOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Jurisdiction</span>
        <select
          className={styles.select}
          value={params.jurisdiction}
          onChange={(event) =>
            onFilterChange({ jurisdiction: event.target.value as Jurisdiction | "all" })
          }
        >
          {jurisdictionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Page size</span>
        <select
          className={styles.select}
          value={params.pageSize}
          onChange={(event) => onFilterChange({ pageSize: Number(event.target.value) })}
        >
          {[25, 50, 100, 200].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </label>

      <button className={styles.button} type="button" onClick={onReset}>
        Reset filters
      </button>
    </section>
  );
}
