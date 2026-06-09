import { AppIcon } from "../../../app/icons/AppIcon";
import styles from "./ErrorState.module.css";

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={styles.state}>
      <span className={styles.icon}>
        <AppIcon name="error" width={22} />
      </span>
      <h3 className={styles.title}>The service could not retrieve this page.</h3>
      <p className={styles.copy}>
        The mock API returned an error. Retry the fetch or use the demo controls to reset the dataset.
      </p>
      <button className={styles.button} type="button" onClick={onRetry}>
        Retry fetch
      </button>
    </div>
  );
}
