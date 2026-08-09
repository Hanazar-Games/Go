import type { ReactNode } from "react";
import styles from "./Panel.module.css";

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.panel} ${className}`}>
      <header>
        <h2>{title}</h2>
        {action}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
