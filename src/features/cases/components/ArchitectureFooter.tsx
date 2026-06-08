import { useEffect, useRef, useState } from "react";
import styles from "./ArchitectureFooter.module.css";

export function ArchitectureFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const footerRef = useRef<HTMLElement | null>(null);

  const toggleExpanded = () => setIsExpanded((current) => !current);

  return (
    <>
      <div className={styles.footerPlaceholder} aria-hidden="true" />
      <footer
        aria-expanded={isExpanded}
        className={styles.footer}
        data-expanded={isExpanded}
        ref={footerRef}
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <p>
          Built with React, TypeScript, TanStack Table, TanStack Virtual, TanStack Query,
          and Mock Service Worker. This demo uses a generated local dataset behind an
          API-like mock layer to demonstrate server-style filtering, pagination, sorting,
          request cancellation, cached pages, optimistic updates, and rollback. The
          deployed version uses Mock Service Worker as a fake API layer, so the interface
          behaves like a client-server application without requiring a real backend.
        </p>
      </footer>
    </>
  );
}
