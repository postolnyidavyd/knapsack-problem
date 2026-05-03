import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useKnapsack } from '../context/KnapsackContext';
import { generateDPSteps } from '../algorithms/dp';
import styles from './DynamicProgramming.module.css';

const SPEED_MAP = [600, 250, 80, 30, 8];
const CELL_SIZE = 42;

export default function DynamicProgramming() {
  const { n, W, weights, values } = useKnapsack();

  const { dp, fillSteps, recoverySteps, result } = useMemo(
    () => generateDPSteps(n, W, weights, values),
    [n, W, weights, values]
  );

  const allSteps = useMemo(() => [
    ...fillSteps.map(s  => ({ phase: 'fill',     ...s })),
    ...recoverySteps.map(s => ({ phase: 'recovery', ...s })),
  ], [fillSteps, recoverySteps]);

  const [stepIdx, setStepIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState(2);
  const intervalRef = useRef(null);

  useEffect(() => { setStepIdx(-1); setPlaying(false); }, [n, W, weights, values]);

  const advance = useCallback(() => {
    setStepIdx(prev => {
      if (prev >= allSteps.length - 1) { setPlaying(false); return prev; }
      return prev + 1;
    });
  }, [allSteps.length]);

  useEffect(() => {
    if (playing) intervalRef.current = setInterval(advance, SPEED_MAP[speed]);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, advance]);

  function reset() { setPlaying(false); setStepIdx(-1); }

  const done    = stepIdx === allSteps.length - 1;
  const started = stepIdx >= 0;
  const step    = started ? allSteps[stepIdx] : null;

  // Поточна таблиця
  const currentDP = step?.phase === 'fill' ? step.snapshot : dp;

  // Зібрані предмети під час recovery
  const recoveredItems = useMemo(() => {
    if (!started) return new Set();
    const set = new Set();
    allSteps.slice(fillSteps.length, stepIdx + 1).forEach(s => {
      if (s.phase === 'recovery' && s.took) set.add(s.i);
    });
    return set;
  }, [stepIdx, allSteps, fillSteps.length, started]);

  // Формула поточного кроку
  const formula = useMemo(() => {
    if (!step || step.phase !== 'fill') return null;
    const { i, w, canTake, val } = step;
    if (!canTake) {
      return {
        text: `dp[${i}][${w}] = dp[${i-1}][${w}] = ${val}`,
        source1: { i: i-1, w },
        source2: null,
      };
    }
    const skip = (currentDP?.[i-1]?.[w]) ?? 0;
    const take = (currentDP?.[i-1]?.[w - weights[i-1]]) ?? 0;
    return {
      text: `dp[${i}][${w}] = max(dp[${i-1}][${w}], dp[${i-1}][${w-weights[i-1]}] + ${values[i-1]}) = max(${skip}, ${take + values[i-1]}) = ${val}`,
      source1: { i: i-1, w },
      source2: w - weights[i-1] >= 0 ? { i: i-1, w: w - weights[i-1] } : null,
    };
  }, [step, currentDP, weights, values]);

  return (
    <div className={styles.page}>

      {/* Кнопки */}
      <div className={styles.controls}>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            if (done) { reset(); return; }
            if (stepIdx === -1) setStepIdx(0);
            setPlaying(p => !p);
          }}
        >
          {done ? '↺ Знову' : playing ? '⏸ Пауза' : stepIdx === -1 ? '▶ Старт' : '▶ Продовжити'}
        </button>
        <button className={styles.btnSecondary} onClick={advance} disabled={playing || done}>→ Крок</button>
        <button className={styles.btnSecondary} onClick={reset} disabled={!started && !playing}>↺ Скинути</button>

        <div className={styles.speedWrap}>
          <span className={styles.speedLabel}>Швидкість</span>
          <input type="range" min={0} max={4} value={speed}
            onChange={e => setSpeed(+e.target.value)} className={styles.slider} />
        </div>
        {started && <span className={styles.counter}>{stepIdx + 1} / {allSteps.length}</span>}
        {started && (
          <span className={styles.phase} style={{ color: step.phase === 'fill' ? 'var(--col-dp)' : 'var(--col-recurse)' }}>
            {step.phase === 'fill' ? 'Заповнення' : 'Відновлення шляху'}
          </span>
        )}
      </div>

      {/* Формула */}
      <div className={styles.formulaRow}>
        {formula ? (
          <span className={styles.formula}>{formula.text}</span>
        ) : (
          <span className={styles.formulaPlaceholder}>
            {step?.phase === 'recovery'
              ? `dp[${step.i}][${step.w}] ${step.took ? '≠' : '='} dp[${step.i - 1}][${step.w}] → ${step.took ? `взяли предмет ${step.i}` : 'пропустили'}`
              : 'Натисніть Старт'}
          </span>
        )}
      </div>

      <div className={styles.main}>
        {/* Таблиця */}
        <div className={styles.tableScroll}>
          <table className={styles.table} style={{ '--cs': `${CELL_SIZE}px` }}>
            <thead>
              <tr>
                <th className={styles.corner}>i \ w</th>
                {Array.from({ length: W + 1 }, (_, w) => (
                  <th key={w}
                    className={step?.phase === 'fill' && step.w === w ? styles.colHL : ''}
                    style={{ width: CELL_SIZE, minWidth: CELL_SIZE }}
                  >{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: n + 1 }, (_, i) => (
                <tr key={i}>
                  <td className={styles.rowHeader}>
                    {i === 0 ? '0' : `${i}`}
                    {i > 0 && <span className={styles.rowSub}> w={weights[i-1]} v={values[i-1]}</span>}
                  </td>
                  {Array.from({ length: W + 1 }, (_, w) => {
                    const isCurrent  = step?.phase === 'fill'     && step.i === i && step.w === w;
                    const isRecovery = step?.phase === 'recovery'  && step.i === i && step.w === w;
                    const isSrc1     = formula?.source1?.i === i  && formula?.source1?.w === w;
                    const isSrc2     = formula?.source2?.i === i  && formula?.source2?.w === w;

                    let cls = styles.cell;
                    if      (isCurrent)  cls += ` ${styles.cellCurrent}`;
                    else if (isRecovery) cls += ` ${styles.cellRecovery}`;
                    else if (isSrc1)     cls += ` ${styles.cellSrc1}`;
                    else if (isSrc2)     cls += ` ${styles.cellSrc2}`;

                    const val = currentDP ? currentDP[i][w] : 0;

                    return (
                      <td key={w} className={cls}
                        style={{ width: CELL_SIZE, minWidth: CELL_SIZE, height: CELL_SIZE }}>
                        {currentDP ? val : 0}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Права панель */}
        <div className={styles.side}>
          <p className={styles.sideTitle}>Предмети</p>
          <div className={styles.items}>
            {Array.from({ length: n }, (_, i) => {
              const idx    = i + 1;
              const inPath = recoveredItems.has(idx);
              const isCurr = step?.i === idx && step?.phase === 'fill';
              return (
                <div key={i}
                  className={`${styles.itemCard} ${inPath ? styles.itemPath : ''} ${isCurr && !inPath ? styles.itemActive : ''}`}
                >
                  <span className={styles.itemNum}>{idx}</span>
                  <span className={styles.itemStat}>w: <strong>{weights[i]}</strong></span>
                  <span className={styles.itemStat}>v: <strong>{values[i]}</strong></span>
                </div>
              );
            })}
          </div>

          {done && (
            <div className={styles.result}>
              <p className={styles.resultTitle}>Результат</p>
              <p className={styles.resultLine}>Цінність: <strong>{result.value}</strong></p>
              <p className={styles.resultLine}>Предмети: <strong>{result.items.join(', ')}</strong></p>
              <p className={styles.resultLine}>
                Вага: <strong>{result.items.reduce((a, idx) => a + weights[idx - 1], 0)}</strong> / {W}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
