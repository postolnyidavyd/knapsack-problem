import { NavLink } from 'react-router-dom';
import { TABS } from '../../consts/knapsack.js';
import styles from './TabNav.module.css';

export default function TabNav() {
  return (
    <nav className={styles.nav}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.path}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
          style={({ isActive }) => isActive ? { '--color': tab.color } : {}}
        >
          <span className={styles.label}>{tab.label}</span>
          <span className={styles.complexity}>{tab.complexity}</span>
        </NavLink>
      ))}
    </nav>
  );
}
