import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCases } from "../../../api/casesApi";
import type { CasesQueryParams } from "../../../api/apiTypes";
import { queryKeys } from "../../../api/queryKeys";

export function useCasesQuery(params: CasesQueryParams) {
  return useQuery({
    queryKey: queryKeys.cases.list(params),
    queryFn: ({ signal }) => fetchCases(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
