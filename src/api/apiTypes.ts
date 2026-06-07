import type {
  CaseStatus,
  Jurisdiction,
  OperationalCase,
  RiskLevel,
} from "../features/cases/types";

export interface CasesQueryParams {
  page: number;
  pageSize: number;
  search: string;
  status: CaseStatus | "all";
  riskLevel: RiskLevel | "all";
  jurisdiction: Jurisdiction | "all";
  sortBy: string;
  sortDirection: "asc" | "desc";
}

export interface CasesResponse {
  items: OperationalCase[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PatchCaseRequest {
  status?: OperationalCase["status"];
  assignedReviewer?: OperationalCase["assignedReviewer"];
  riskLevel?: OperationalCase["riskLevel"];
}

export interface BulkReviewRequest {
  ids: string[];
}

export interface BulkReviewResponse {
  updated: OperationalCase[];
}

export interface DemoConfigRequest {
  latencyMs?: number;
  failNextFetch?: boolean;
  failNextMutation?: boolean;
  failureRate?: number;
}
