import styles from "./ArchitectureFooter.module.css";

export function ArchitectureFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        Built with React, TypeScript, TanStack Table, TanStack Virtual, TanStack Query,
        and Mock Service Worker. This demo uses a generated local dataset behind an
        API-like mock layer to demonstrate server-style filtering, pagination, sorting,
        request cancellation, cached pages, optimistic updates, and rollback. The
        deployed version uses Mock Service Worker as a fake API layer, so the interface
        behaves like a client-server application without requiring a real backend.
      </p>
    </footer>
  );
}
