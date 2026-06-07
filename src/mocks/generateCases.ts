import type {
  CaseStatus,
  Jurisdiction,
  OperationalCase,
  ReportType,
  RiskLevel,
} from "../features/cases/types";

const institutions = [
  "Northbridge Bank",
  "Helios Insurance Group",
  "Atlas Payment Services",
  "Riverton Credit Union",
  "Union Trust Belgium",
  "Boreal Asset Management",
  "Clearwater Capital",
  "Meridian Securities",
  "Continental Compliance Partners",
  "Horizon Retail Banking",
  "Cedarline Trust",
  "Verdant Mutual",
  "Summit Clearing Services",
  "Harborview Finance",
  "Stonegate Reinsurance",
];

const reviewers = [
  "Mira Janssens",
  "Oren De Vries",
  "Selene Lambert",
  "Garrick Moreau",
  "Talia Peeters",
  "Bram Willems",
  "Iris Novak",
  "Cassian Dubois",
];

const statuses: CaseStatus[] = [
  "draft",
  "submitted",
  "validating",
  "failed",
  "approved",
  "reviewed",
  "archived",
];

const riskLevels: RiskLevel[] = ["low", "medium", "high", "critical"];

const jurisdictions: Jurisdiction[] = [
  "Belgium",
  "Netherlands",
  "Germany",
  "France",
  "Luxembourg",
  "United Kingdom",
  "Ireland",
  "Poland",
];

const reportTypes: ReportType[] = [
  "Capital Adequacy Filing",
  "Liquidity Coverage Report",
  "Transaction Monitoring Review",
  "Sanctions Screening Exception",
  "Operational Risk Incident",
  "Audit Evidence Request",
  "Data Quality Remediation",
  "ESG Disclosure Review",
  "Client Classification Review",
  "Regulatory Change Assessment",
];

const descriptions = [
  "Validation failed because two required liquidity ratio fields are missing.",
  "The filing is awaiting review before submission to the supervisory authority.",
  "A high-priority remediation task was created after automated consistency checks.",
  "The assigned reviewer must confirm whether supporting audit evidence is complete.",
  "A monitoring exception requires reviewer approval before the deadline.",
  "The case is ready for final evidence review and regulatory sign-off.",
  "Automated controls identified stale reference data in the current submission.",
  "The operations team is reconciling reported values against source documentation.",
];

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function isoDateFromOffset(baseTime: number, offsetDays: number): string {
  return new Date(baseTime + offsetDays * 86_400_000).toISOString();
}

function getRisk(index: number, status: CaseStatus): RiskLevel {
  if (status === "failed" && index % 3 === 0) {
    return "critical";
  }

  if (status === "validating" && index % 4 === 0) {
    return "high";
  }

  return pick(riskLevels, index * 7 + Math.floor(index / 11));
}

function getErrorCount(status: CaseStatus, riskLevel: RiskLevel, index: number): number {
  const riskBase: Record<RiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 3,
    critical: 6,
  };
  const statusBase = status === "failed" ? 4 : status === "validating" ? 2 : 0;

  return Math.min(18, riskBase[riskLevel] + statusBase + (index % 5));
}

export function generateCases(count = 5_000): OperationalCase[] {
  const deadlineBase = Date.UTC(2026, 0, 1);
  const updatedBase = Date.UTC(2025, 9, 1);

  return Array.from({ length: count }, (_, zeroIndex) => {
    const index = zeroIndex + 1;
    const status = pick(statuses, index * 5);
    const riskLevel = getRisk(index, status);
    const reportType = pick(reportTypes, index * 3);
    const jurisdiction = pick(jurisdictions, index * 7);
    const institution = pick(institutions, index * 11);
    const assignedReviewer = index % 9 === 0 ? null : pick(reviewers, index * 13);
    const deadline = isoDateFromOffset(deadlineBase, (index % 420) - 120);
    const lastUpdated = isoDateFromOffset(updatedBase, index % 240);
    const errorCount = getErrorCount(status, riskLevel, index);
    const priorityScore = Math.min(100, 20 + errorCount * 5 + (index % 37));

    return {
      id: `CASE-${String(index).padStart(5, "0")}`,
      institution,
      reportType,
      jurisdiction,
      deadline,
      status,
      riskLevel,
      assignedReviewer,
      lastUpdated,
      errorCount,
      submissionCode: `${jurisdiction.slice(0, 2).toUpperCase()}-${String(2026)}-${String(index).padStart(5, "0")}`,
      priorityScore,
      hasWarnings: errorCount > 0 || riskLevel === "critical",
      description: descriptions[(index + errorCount) % descriptions.length],
    };
  });
}

export const filterOptions = {
  statuses,
  riskLevels,
  jurisdictions,
  reportTypes,
  reviewers,
};
