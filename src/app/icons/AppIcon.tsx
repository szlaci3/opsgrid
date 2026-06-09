import { Icon } from "@iconify/react";
import type { ComponentPropsWithoutRef } from "react";
import { appIcons, type AppIconName } from "./appIcons";

interface AppIconProps extends Omit<ComponentPropsWithoutRef<typeof Icon>, "icon"> {
  name: AppIconName;
}

export function AppIcon({ name, ...props }: AppIconProps) {
  return <Icon aria-hidden="true" icon={appIcons[name]} {...props} />;
}
