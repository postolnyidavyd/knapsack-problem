import { useKnapsack } from '../../context/KnapsackContext';
import styles from './InputPanel.module.css';

export default function InputPanel() {
  const { n, W, weights, values, updateN, setW, updateWeight, updateValue } = useKnapsack();

  return (
    <aside className={styles.panel}>
      <p className={styles.title}>Вхідні дані</p>

      <div className={styles.row}>
        <label>n (предметів)</label>
        <input
          type="number"
          min={1} max={8}
          value={n}
          onChange={e => updateN(Math.max(1, Math.min(8, +e.target.value)))}
        />
      </div>

      <div className={styles.row}>
        <label>W (місткість)</label>
        <input
          type="number"
          min={1}
          value={W}
          onChange={e => setW(Math.max(1, +e.target.value))}
        />
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>w</th>
            <th>v</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: n }, (_, i) => (
            <tr key={i}>
              <td className={styles.idx}>{i + 1}</td>
              <td>
                <input
                  type="number" min={1}
                  value={weights[i] ?? 1}
                  onChange={e => updateWeight(i, Math.max(1, +e.target.value))}
                />
              </td>
              <td>
                <input
                  type="number" min={1}
                  value={values[i] ?? 1}
                  onChange={e => updateValue(i, Math.max(1, +e.target.value))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
