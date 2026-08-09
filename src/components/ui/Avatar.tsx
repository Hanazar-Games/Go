import styles from "./Avatar.module.css";

export function Avatar({
  name,
  variant = "person",
  size = "medium",
}: {
  name: string;
  variant?: "person" | "warrior" | "stone";
  size?: "small" | "medium" | "large";
}) {
  const initials = name.slice(0, 1);
  return (
    <span className={`${styles.avatar} ${styles[variant]} ${styles[size]}`} aria-label={`${name}头像`}>
      {variant === "warrior" ? <i className={styles.silhouette} /> : variant === "stone" ? "●" : initials}
    </span>
  );
}
