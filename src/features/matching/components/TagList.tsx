import styles from './TagList.module.css';

interface TagListProps {
  tags: string[] | null;
}

export function TagList({ tags }: TagListProps) {
  if (!tags || tags.length === 0) {
    return <p className={styles.empty}>No skill tags available for this role.</p>;
  }

  return (
    <ul className={styles.list} aria-label="Matched skill tags">
      {tags.map((tag) => (
        <li key={tag} className={styles.tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
