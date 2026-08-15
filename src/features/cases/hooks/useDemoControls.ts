import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { resetDemoData, updateDemoConfig } from "../../../api/casesApi";
import type { CasesPageNotice } from "./useCasesPageController";

type UseDemoControlsOptions = {
  clearSelection: () => void;
  closeDetails: () => void;
  onNotice: (notice: CasesPageNotice) => void;
  refetchCases: () => Promise<unknown>;
};

export function useDemoControls({
  clearSelection,
  closeDetails,
  onNotice,
  refetchCases,
}: UseDemoControlsOptions) {
  const casesQueryClient = useQueryClient();
  const [latencyMs, setLatencyMs] = useState(500);
  const [isDemoBusy, setIsDemoBusy] = useState(false);

  const runDemoAction = useCallback(async (action: () => Promise<void>) => {
    setIsDemoBusy(true);

    try {
      await action();
    } finally {
      setIsDemoBusy(false);
    }
  }, []);

  const handleLatencyChange = useCallback(
    (nextLatencyMs: number) => {
      void runDemoAction(async () => {
        await updateDemoConfig({ latencyMs: nextLatencyMs });
        setLatencyMs(nextLatencyMs);
        onNotice({ message: "Latency updated.", kind: "success" });
      });
    },
    [onNotice, runDemoAction],
  );

  const handleFailNextFetch = useCallback(() => {
    void runDemoAction(async () => {
      await updateDemoConfig({ failNextFetch: true });
      onNotice({ message: "Next fetch will fail.", kind: "error" });
    });
  }, [onNotice, runDemoAction]);

  const handleFailNextUpdate = useCallback(() => {
    void runDemoAction(async () => {
      await updateDemoConfig({ failNextMutation: true });
      onNotice({ message: "Next update will fail.", kind: "error" });
    });
  }, [onNotice, runDemoAction]);

  const handleClearCache = useCallback(() => {
    casesQueryClient.clear();
    onNotice({ message: "Cache cleared.", kind: "success" });
    void refetchCases();
  }, [casesQueryClient, onNotice, refetchCases]);

  const handleResetData = useCallback(() => {
    void runDemoAction(async () => {
      await resetDemoData();
      clearSelection();
      closeDetails();
      onNotice({ message: "Data reset.", kind: "success" });
      await casesQueryClient.invalidateQueries({ queryKey: ["cases"] });
    });
  }, [casesQueryClient, clearSelection, closeDetails, onNotice, runDemoAction]);

  return {
    handleClearCache,
    handleFailNextFetch,
    handleFailNextUpdate,
    handleLatencyChange,
    handleResetData,
    isDemoBusy,
    latencyMs,
  };
}
