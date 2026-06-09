import { AppIcon } from "../../../app/icons/AppIcon";
import styles from "./EmptyState.module.css";

export function EmptyState() {
  return (
    <div className={styles.state}>
      <span className={styles.icon}>
        <AppIcon name="emptySearch" width={22} />
      </span>
      <h3 className={styles.title}>No cases match the current filters.</h3>
      <p className={styles.copy}>
        Adjust the search terms, status, risk, or jurisdiction filters to broaden the result set.
      </p>
    </div>
  );
}
