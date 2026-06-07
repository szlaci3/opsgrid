import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkReviewCases, patchCase } from "../../../api/casesApi";
import { queryKeys } from "../../../api/queryKeys";
import type { PatchCaseRequest } from "../../../api/apiTypes";
import type { OperationalCase } from "../types";

function replaceCase(items: OperationalCase[], updated: OperationalCase): OperationalCase[] {
  return items.map((item) => (item.id === updated.id ? updated : item));
}

export function usePatchCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PatchCaseRequest }) => patchCase(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cases.all });

      const snapshot = queryClient.getQueriesData<{ items: OperationalCase[] }>({
        queryKey: queryKeys.cases.all,
      });

      queryClient.setQueriesData<{ items: OperationalCase[] }>(
        { queryKey: queryKeys.cases.all },
        (current) => {
          if (!current) {
            return current;
          }

          const optimisticItem = current.items.find((item) => item.id === id);

          if (!optimisticItem) {
            return current;
          }

          return {
            ...current,
            items: replaceCase(current.items, {
              ...optimisticItem,
              ...patch,
              lastUpdated: new Date().toISOString(),
            }),
          };
        },
      );

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueriesData<{ items: OperationalCase[] }>(
        { queryKey: queryKeys.cases.all },
        (current) => {
          if (!current) {
            return current;
          }

          return { ...current, items: replaceCase(current.items, updated) };
        },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}

export function useBulkReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => bulkReviewCases({ ids }),
    onMutate: async ({ ids }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cases.all });

      const selectedIds = new Set(ids);
      const lastUpdated = new Date().toISOString();
      const snapshot = queryClient.getQueriesData<{ items: OperationalCase[] }>({
        queryKey: queryKeys.cases.all,
      });

      queryClient.setQueriesData<{ items: OperationalCase[] }>(
        { queryKey: queryKeys.cases.all },
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            items: current.items.map((item) =>
              selectedIds.has(item.id) ? { ...item, status: "reviewed", lastUpdated } : item,
            ),
          };
        },
      );

      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSuccess: ({ updated }) => {
      const updatedById = new Map(updated.map((item) => [item.id, item]));

      queryClient.setQueriesData<{ items: OperationalCase[] }>(
        { queryKey: queryKeys.cases.all },
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            items: current.items.map((item) => updatedById.get(item.id) ?? item),
          };
        },
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cases.all });
    },
  });
}
