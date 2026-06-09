export const appIcons = {
  cache: "lucide:database",
  close: "lucide:x",
  details: "lucide:eye",
  emptySearch: "lucide:search-x",
  error: "lucide:triangle-alert",
  fail: "lucide:zap",
  reset: "lucide:rotate-ccw",
} as const;

export type AppIconName = keyof typeof appIcons;
