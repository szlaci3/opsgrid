import clsx from "clsx";
import { formatRiskLabel } from "../filterOptions";
import type { RiskLevel } from "../types";
import styles from "./CaseRiskBadge.module.css";

export function CaseRiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  return (
    <span className={clsx(styles.badge, styles[riskLevel])}>
      <span className={styles.icon} aria-hidden="true" />
      {formatRiskLabel(riskLevel)}
    </span>
  );
}
