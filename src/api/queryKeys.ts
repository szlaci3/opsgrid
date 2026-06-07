import type { CasesQueryParams } from "./apiTypes";

export const queryKeys = {
  cases: {
    all: ["cases"] as const,
    list: (params: CasesQueryParams) => ["cases", "list", params] as const,
  },
};
