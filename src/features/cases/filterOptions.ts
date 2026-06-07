import type { CaseStatus, Jurisdiction, RiskLevel } from "./types";

export const statusOptions: Array<{ value: CaseStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "validating", label: "Validating" },
  { value: "failed", label: "Failed" },
  { value: "approved", label: "Approved" },
  { value: "reviewed", label: "Reviewed" },
  { value: "archived", label: "Archived" },
];

export const editableStatusOptions = statusOptions.filter(
  (option): option is { value: CaseStatus; label: string } => option.value !== "all",
);

export const riskOptions: Array<{ value: RiskLevel | "all"; label: string }> = [
  { value: "all", label: "All risks" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const jurisdictionOptions: Array<{ value: Jurisdiction | "all"; label: string }> = [
  { value: "all", label: "All jurisdictions" },
  { value: "Belgium", label: "Belgium" },
  { value: "Netherlands", label: "Netherlands" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Luxembourg", label: "Luxembourg" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Ireland", label: "Ireland" },
  { value: "Poland", label: "Poland" },
];

export function formatStatusLabel(status: CaseStatus): string {
  return editableStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function formatRiskLabel(risk: RiskLevel): string {
  return riskOptions.find((option) => option.value === risk)?.label ?? risk;
}
