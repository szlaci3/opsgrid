export interface MockConfig {
  latencyMs: number;
  failNextFetch: boolean;
  failNextMutation: boolean;
  failureRate: number;
}

export const mockConfig: MockConfig = {
  latencyMs: 500,
  failNextFetch: false,
  failNextMutation: false,
  failureRate: 0,
};
