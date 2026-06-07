import type {
  BulkReviewRequest,
  BulkReviewResponse,
  CasesQueryParams,
  CasesResponse,
  DemoConfigRequest,
  PatchCaseRequest,
} from "./apiTypes";
import type { OperationalCase } from "../features/cases/types";

function appendParam(searchParams: URLSearchParams, key: string, value: string | number): void {
  searchParams.set(key, String(value));
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return response.json() as Promise<T>;
}

export async function fetchCases(
  params: CasesQueryParams,
  signal?: AbortSignal,
): Promise<CasesResponse> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page);
  appendParam(searchParams, "pageSize", params.pageSize);
  appendParam(searchParams, "search", params.search);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "riskLevel", params.riskLevel);
  appendParam(searchParams, "jurisdiction", params.jurisdiction);
  appendParam(searchParams, "sortBy", params.sortBy);
  appendParam(searchParams, "sortDirection", params.sortDirection);

  const response = await fetch(`/api/cases?${searchParams.toString()}`, { signal });
  return parseJsonResponse<CasesResponse>(response, "Failed to fetch cases");
}

export async function patchCase(
  id: string,
  patch: PatchCaseRequest,
): Promise<OperationalCase> {
  const response = await fetch(`/api/cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  return parseJsonResponse<OperationalCase>(response, "Failed to update case");
}

export async function bulkReviewCases(
  request: BulkReviewRequest,
): Promise<BulkReviewResponse> {
  const response = await fetch("/api/cases/bulk-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  return parseJsonResponse<BulkReviewResponse>(response, "Failed to review selected cases");
}

export async function updateDemoConfig(config: DemoConfigRequest): Promise<void> {
  const response = await fetch("/api/demo/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  await parseJsonResponse<{ ok: boolean }>(response, "Failed to update demo config");
}

export async function resetDemoData(): Promise<void> {
  const response = await fetch("/api/demo/reset", { method: "POST" });
  await parseJsonResponse<{ ok: boolean }>(response, "Failed to reset demo data");
}
