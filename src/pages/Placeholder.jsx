import styles from './Placeholder.module.css';

export default function Placeholder({ label, color }) {
  return (
    <div className={styles.wrap}>
      <p className={styles.name} style={{ color }}>{label}</p>
      <p className={styles.hint}>Реалізація — в наступному коміті</p>
    </div>
  );
}
