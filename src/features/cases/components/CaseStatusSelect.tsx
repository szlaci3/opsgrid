import { editableStatusOptions } from "../filterOptions";
import type { CaseStatus } from "../types";
import styles from "./CaseStatusSelect.module.css";

interface CaseStatusSelectProps {
  status: CaseStatus;
  isUpdating: boolean;
  onChange: (status: CaseStatus) => void;
}

export function CaseStatusSelect({ status, isUpdating, onChange }: CaseStatusSelectProps) {
  return (
    <select
      aria-label="Update case status"
      className={styles.select}
      disabled={isUpdating}
      value={status}
      onChange={(event) => onChange(event.target.value as CaseStatus)}
      onClick={(event) => event.stopPropagation()}
    >
      {editableStatusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
