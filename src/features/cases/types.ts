export type CaseStatus =
  | "draft"
  | "submitted"
  | "validating"
  | "failed"
  | "approved"
  | "reviewed"
  | "archived";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Jurisdiction =
  | "Belgium"
  | "Netherlands"
  | "Germany"
  | "France"
  | "Luxembourg"
  | "United Kingdom"
  | "Ireland"
  | "Poland";

export type ReportType =
  | "Capital Adequacy Filing"
  | "Liquidity Coverage Report"
  | "Transaction Monitoring Review"
  | "Sanctions Screening Exception"
  | "Operational Risk Incident"
  | "Audit Evidence Request"
  | "Data Quality Remediation"
  | "ESG Disclosure Review"
  | "Client Classification Review"
  | "Regulatory Change Assessment";

export interface OperationalCase {
  id: string;
  institution: string;
  reportType: ReportType;
  jurisdiction: Jurisdiction;
  deadline: string;
  status: CaseStatus;
  riskLevel: RiskLevel;
  assignedReviewer: string | null;
  lastUpdated: string;
  errorCount: number;
  submissionCode: string;
  priorityScore: number;
  hasWarnings: boolean;
  description: string;
}
