import styles from "./TableSkeleton.module.css";

export function TableSkeleton() {
  return (
    <div className={styles.skeleton} aria-label="Loading records">
      {Array.from({ length: 8 }, (_, rowIndex) => (
        <div className={styles.row} key={rowIndex}>
          {Array.from({ length: 11 }, (_, cellIndex) => (
            <div className={styles.cell} key={cellIndex}>
              <span
                className={styles.bar}
                style={{ width: `${cellIndex === 0 ? 45 : 55 + ((rowIndex + cellIndex) % 4) * 10}%` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
