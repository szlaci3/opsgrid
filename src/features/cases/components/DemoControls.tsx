import { RotateCcw, Trash2, Zap } from "lucide-react";
import styles from "./DemoControls.module.css";

const latencyOptions = [0, 300, 800, 1500, 2500];

interface DemoControlsProps {
  latencyMs: number;
  isBusy: boolean;
  onLatencyChange: (latencyMs: number) => void;
  onFailNextFetch: () => void;
  onFailNextUpdate: () => void;
  onClearCache: () => void;
  onResetData: () => void;
}

export function DemoControls({
  latencyMs,
  isBusy,
  onLatencyChange,
  onFailNextFetch,
  onFailNextUpdate,
  onClearCache,
  onResetData,
}: DemoControlsProps) {
  return (
    <section className={styles.controls} aria-label="Demo controls">
      <label className={styles.field}>
        <span className={styles.label}>Latency</span>
        <select
          className={styles.select}
          disabled={isBusy}
          value={latencyMs}
          onChange={(event) => onLatencyChange(Number(event.target.value))}
        >
          {latencyOptions.map((value) => (
            <option key={value} value={value}>
              {value}ms
            </option>
          ))}
        </select>
      </label>

      <button className={styles.button} disabled={isBusy} type="button" onClick={onFailNextFetch}>
        <Zap aria-hidden="true" size={16} />
        Fail next fetch
      </button>
      <button className={styles.button} disabled={isBusy} type="button" onClick={onFailNextUpdate}>
        <Zap aria-hidden="true" size={16} />
        Fail next update
      </button>
      <button className={styles.button} disabled={isBusy} type="button" onClick={onClearCache}>
        <Trash2 aria-hidden="true" size={16} />
        Clear cache
      </button>
      <button className={styles.button} disabled={isBusy} type="button" onClick={onResetData}>
        <RotateCcw aria-hidden="true" size={16} />
        Reset data
      </button>
    </section>
  );
}
