import { delay, http, HttpResponse } from "msw";
import type { CasesQueryParams, DemoConfigRequest, PatchCaseRequest } from "../api/apiTypes";
import type { OperationalCase } from "../features/cases/types";
import { bulkReviewCases, getCases, resetCases, updateCase } from "./db";
import { mockConfig } from "./mockConfig";

const sortableFields = new Set([
  "institution",
  "reportType",
  "jurisdiction",
  "deadline",
  "status",
  "riskLevel",
  "assignedReviewer",
  "lastUpdated",
  "errorCount",
  "priorityScore",
]);

function shouldFail(kind: "fetch" | "mutation"): boolean {
  if (kind === "fetch" && mockConfig.failNextFetch) {
    mockConfig.failNextFetch = false;
    return true;
  }

  if (kind === "mutation" && mockConfig.failNextMutation) {
    mockConfig.failNextMutation = false;
    return true;
  }

  return Math.random() < mockConfig.failureRate;
}

function getQueryParams(url: URL): CasesQueryParams {
  return {
    page: Number(url.searchParams.get("page") ?? 1),
    pageSize: Number(url.searchParams.get("pageSize") ?? 50),
    search: url.searchParams.get("search") ?? "",
    status: (url.searchParams.get("status") ?? "all") as CasesQueryParams["status"],
    riskLevel: (url.searchParams.get("riskLevel") ?? "all") as CasesQueryParams["riskLevel"],
    jurisdiction: (url.searchParams.get("jurisdiction") ?? "all") as CasesQueryParams["jurisdiction"],
    sortBy: url.searchParams.get("sortBy") ?? "deadline",
    sortDirection: (url.searchParams.get("sortDirection") ?? "asc") as CasesQueryParams["sortDirection"],
  };
}

function matchesSearch(item: OperationalCase, search: string): boolean {
  if (!search.trim()) {
    return true;
  }

  const needle = search.toLowerCase();
  return [
    item.institution,
    item.reportType,
    item.jurisdiction,
    item.submissionCode,
    item.assignedReviewer ?? "",
    item.description,
  ].some((value) => value.toLowerCase().includes(needle));
}

function sortCases(
  items: OperationalCase[],
  sortBy: string,
  sortDirection: "asc" | "desc",
): OperationalCase[] {
  if (!sortableFields.has(sortBy)) {
    return items;
  }

  return [...items].sort((left, right) => {
    const leftValue = left[sortBy as keyof OperationalCase];
    const rightValue = right[sortBy as keyof OperationalCase];
    const direction = sortDirection === "asc" ? 1 : -1;

    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * direction;
    }

    return String(leftValue ?? "").localeCompare(String(rightValue ?? "")) * direction;
  });
}

export const handlers = [
  http.get("/api/cases", async ({ request }) => {
    await delay(mockConfig.latencyMs);

    if (shouldFail("fetch")) {
      return HttpResponse.json({ message: "The service could not retrieve this page." }, { status: 500 });
    }

    const params = getQueryParams(new URL(request.url));
    const filtered = getCases()
      .filter((item) => matchesSearch(item, params.search))
      .filter((item) => params.status === "all" || item.status === params.status)
      .filter((item) => params.riskLevel === "all" || item.riskLevel === params.riskLevel)
      .filter((item) => params.jurisdiction === "all" || item.jurisdiction === params.jurisdiction);

    const sorted = sortCases(filtered, params.sortBy, params.sortDirection);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
    const page = Math.min(Math.max(1, params.page), totalPages);
    const start = (page - 1) * params.pageSize;

    return HttpResponse.json({
      items: sorted.slice(start, start + params.pageSize),
      total,
      page,
      pageSize: params.pageSize,
      totalPages,
    });
  }),

  http.patch("/api/cases/:id", async ({ params, request }) => {
    await delay(mockConfig.latencyMs);

    if (shouldFail("mutation")) {
      return HttpResponse.json({ message: "Update failed. Previous status restored." }, { status: 500 });
    }

    const patch = (await request.json()) as PatchCaseRequest;
    const updated = updateCase(String(params.id), patch);

    if (!updated) {
      return HttpResponse.json({ message: "Case not found." }, { status: 404 });
    }

    return HttpResponse.json(updated);
  }),

  http.post("/api/cases/bulk-review", async ({ request }) => {
    await delay(mockConfig.latencyMs);

    if (shouldFail("mutation")) {
      return HttpResponse.json({ message: "The selected cases could not be reviewed." }, { status: 500 });
    }

    const body = (await request.json()) as { ids?: string[] };
    return HttpResponse.json({ updated: bulkReviewCases(body.ids ?? []) });
  }),

  http.post("/api/demo/config", async ({ request }) => {
    const body = (await request.json()) as DemoConfigRequest;
    Object.assign(mockConfig, {
      ...body,
      failureRate: body.failureRate === undefined ? mockConfig.failureRate : body.failureRate,
    });

    return HttpResponse.json({ ok: true, config: mockConfig });
  }),

  http.post("/api/demo/reset", () => {
    resetCases();
    mockConfig.failNextFetch = false;
    mockConfig.failNextMutation = false;
    return HttpResponse.json({ ok: true });
  }),
];
