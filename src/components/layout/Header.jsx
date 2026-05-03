import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.logo}>Задача Рюкзак</span>
      <div className={styles.meta}>
        <span>Лаб. 3</span>
        <span>Варіант 19</span>
      </div>
    </header>
  );
}
