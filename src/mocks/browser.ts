import { focusManager } from "@tanstack/react-query";
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

const MOCK_ACTIVATE = "MOCK_ACTIVATE";
const MOCKING_ENABLED = "MOCKING_ENABLED";
const ACTIVATION_TIMEOUT_MS = 1_000;

export const worker = setupWorker(...handlers);

let activationInFlight: Promise<void> | null = null;

function isMockingEnabledMessage(event: MessageEvent<unknown>): boolean {
  const data = event.data;
  return typeof data === "object" && data !== null && "type" in data && data.type === MOCKING_ENABLED;
}

function requestMockActivation(controller: ServiceWorker): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      window.clearTimeout(timeoutId);
      resolve();
    };
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (isMockingEnabledMessage(event)) {
        finish();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    const timeoutId = window.setTimeout(finish, ACTIVATION_TIMEOUT_MS);

    try {
      controller.postMessage(MOCK_ACTIVATE);
    } catch {
      finish();
    }
  });
}

function activateCurrentMockClient(): Promise<void> {
  const controller = navigator.serviceWorker.controller;

  if (!controller) {
    return Promise.resolve();
  }

  if (!activationInFlight) {
    activationInFlight = requestMockActivation(controller).finally(() => {
      activationInFlight = null;
    });
  }

  return activationInFlight;
}

export function installMockWorkerFocusRecovery(): void {
  focusManager.setEventListener((setFocused) => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setFocused(false);
        return;
      }

      // Chrome can restart an idle Service Worker while retaining this page and
      // its controller. Re-activate the current MSW client and wait for the
      // acknowledgement before TanStack Query performs its focus refetch.
      void activateCurrentMockClient().then(() => setFocused(true));
    };

    window.addEventListener("visibilitychange", handleVisibilityChange, false);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  });
}
