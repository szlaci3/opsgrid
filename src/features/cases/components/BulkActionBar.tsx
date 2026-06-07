import styles from "./BulkActionBar.module.css";

interface BulkActionBarProps {
  selectedCount: number;
  isReviewing: boolean;
  onClearSelection: () => void;
  onReviewSelected: () => void;
}

export function BulkActionBar({
  selectedCount,
  isReviewing,
  onClearSelection,
  onReviewSelected,
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <section className={styles.bar} aria-label="Bulk actions">
      <span>
        <span className={styles.count}>{selectedCount}</span> selected
      </span>
      <div className={styles.actions}>
        <button
          className={styles.button}
          disabled={isReviewing}
          type="button"
          onClick={onReviewSelected}
        >
          Mark reviewed
        </button>
        <button
          className={`${styles.button} ${styles.secondary}`}
          disabled={isReviewing}
          type="button"
          onClick={onClearSelection}
        >
          Clear selection
        </button>
      </div>
    </section>
  );
}
