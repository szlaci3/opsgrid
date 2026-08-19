import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./app/providers";
import App from "./App";
import "./styles/globals.css";

async function enableMocking() {
  const { installMockWorkerFocusRecovery, worker } = await import("./mocks/browser");

  await worker.start({
    onUnhandledRequest: "bypass",
  });
  installMockWorkerFocusRecovery();
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
