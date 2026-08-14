import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../mocks/handlers";
import { resetCases } from "../mocks/db";
import { mockConfig } from "../mocks/mockConfig";

export const server = setupServer(...handlers);

// Mock element measurements for TanStack Virtual in JSDOM
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  value: 800,
});
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  value: 800,
});
Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  value: 3000,
});
Element.prototype.getBoundingClientRect = () => ({
  width: 1200,
  height: 800,
  top: 0,
  left: 0,
  bottom: 800,
  right: 1200,
  x: 0,
  y: 0,
  toJSON: () => {},
});

// Mock ResizeObserver for TanStack Virtual
globalThis.ResizeObserver = class ResizeObserver {
  callback: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.callback = cb;
  }
  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 1200,
            height: 800,
            top: 0,
            left: 0,
            bottom: 800,
            right: 1200,
            x: 0,
            y: 0,
            toJSON: () => {},
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
};

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  resetCases();
  mockConfig.latencyMs = 0;
  mockConfig.failNextFetch = false;
  mockConfig.failNextMutation = false;
  mockConfig.failureRate = 0;
});

afterAll(() => {
  server.close();
});
