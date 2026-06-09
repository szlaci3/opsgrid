import type { ReactNode } from "react";
import { useEffect } from "react";
import { AppIcon } from "../../../app/icons/AppIcon";
import { CaseRiskBadge } from "./CaseRiskBadge";
import { formatStatusLabel } from "../filterOptions";
import type { OperationalCase } from "../types";
import styles from "./CaseDetailDrawer.module.css";

interface CaseDetailDrawerProps {
  selectedCase: OperationalCase | null;
  onClose: () => void;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.item}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{children}</span>
    </div>
  );
}

export function CaseDetailDrawer({ selectedCase, onClose }: CaseDetailDrawerProps) {
  useEffect(() => {
    if (!selectedCase) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, selectedCase]);

  if (!selectedCase) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className={styles.backdrop}
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <aside className={styles.drawer} aria-label="Case details">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Case Details</p>
            <h2 className={styles.title}>{selectedCase.institution}</h2>
            <p className={styles.subtitle}>{selectedCase.reportType}</p>
          </div>
          <button className={styles.close} type="button" aria-label="Close details" onClick={onClose}>
            <AppIcon name="close" width={20} />
          </button>
        </header>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Operational Summary</h3>
          <div className={styles.grid}>
            <DetailItem label="Institution">{selectedCase.institution}</DetailItem>
            <DetailItem label="Report type">{selectedCase.reportType}</DetailItem>
            <DetailItem label="Jurisdiction">{selectedCase.jurisdiction}</DetailItem>
            <DetailItem label="Status">
              <span className={styles.status}>{formatStatusLabel(selectedCase.status)}</span>
            </DetailItem>
            <DetailItem label="Risk level">
              <CaseRiskBadge riskLevel={selectedCase.riskLevel} />
            </DetailItem>
            <DetailItem label="Deadline">{formatDateTime(selectedCase.deadline)}</DetailItem>
            <DetailItem label="Assigned reviewer">
              {selectedCase.assignedReviewer ?? <span className={styles.muted}>Unassigned</span>}
            </DetailItem>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Case Description</h3>
          <p className={styles.description}>{selectedCase.description}</p>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Technical Metadata</h3>
          <div className={styles.grid}>
            <DetailItem label="Record ID">{selectedCase.id}</DetailItem>
            <DetailItem label="Submission code">{selectedCase.submissionCode}</DetailItem>
            <DetailItem label="Error count">{selectedCase.errorCount}</DetailItem>
            <DetailItem label="Warnings">{selectedCase.hasWarnings ? "Yes" : "No"}</DetailItem>
            <DetailItem label="Priority score">{selectedCase.priorityScore}</DetailItem>
            <DetailItem label="Last updated">{formatDateTime(selectedCase.lastUpdated)}</DetailItem>
          </div>
          <p className={styles.note}>
            This record is served by the Mock Service Worker API layer. Updates are
            optimistic and roll back when a simulated update fails.
          </p>
        </section>
      </aside>
    </div>
  );
}
