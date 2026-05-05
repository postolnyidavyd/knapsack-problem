import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useKnapsack } from '../context/KnapsackContext';
import { generateGreedySteps } from '../algorithms/greedy';
import styles from './Greedy.module.css';

const SPEED_MAP = [900, 450, 180, 70, 20];

export default function Greedy() {
  const { n, W, weights, values } = useKnapsack();

  const { sorted, steps, result } = useMemo(
    () => generateGreedySteps(n, W, weights, values),
    [n, W, weights, values]
  );

  const [stepIdx, setStepIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState(2);
  const intervalRef = useRef(null);

  useEffect(() => { setStepIdx(-1); setPlaying(false); }, [n, W, weights, values]);

  const advance = useCallback(() => {
    setStepIdx(prev => {
      if (prev >= steps.length - 1) { setPlaying(false); return prev; }
      return prev + 1;
    });
  }, [steps.length]);

  useEffect(() => {
    if (playing) intervalRef.current = setInterval(advance, SPEED_MAP[speed]);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, advance]);

  function reset() { setPlaying(false); setStepIdx(-1); }

  const done    = stepIdx === steps.length - 1;
  const started = stepIdx >= 0;
  const step    = started ? steps[stepIdx] : null;

  // Для кожного предмету в sorted[] — визначаємо його стан
  function getItemState(sortedItem) {
    if (!started) return 'idle';
    const origIdx = sortedItem.originalIdx;

    // Чи вже пройшли цей предмет?
    const processed = steps.slice(0, stepIdx + 1).find(s => s.idx === origIdx);
    if (!processed) return 'idle';

    if (processed.canTake) return 'taken';
    return 'skipped';
  }


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
        {started && <span className={styles.counter}>{stepIdx + 1} / {steps.length}</span>}
      </div>

      {/* Статкарти */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Залишок місткості</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--mono)' }}>
            {started ? step.remainingW : W} / {W}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Поточна цінність</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--mono)', color: 'var(--col-greedy)' }}>
            {started ? step.totalV : 0}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Предмет (крок j={started ? step.j : '—'})</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--mono)' }}>
            {step ? `#${step.idx + 1}  w=${weights[step.idx]} v=${values[step.idx]}` : '—'}
          </span>
        </div>
        {started && (
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Рішення</span>
            <span className={styles.statValue}
              style={{ color: step.canTake ? 'var(--col-greedy)' : 'var(--col-brute)' }}>
              {step.canTake ? '✓ Взяти' : '✗ Пропустити'}
            </span>
          </div>
        )}
        {done && (
          <div className={styles.resultCard}>
            <span className={styles.statLabel}>Результат</span>
            <span className={styles.statValue}>{result.totalV}</span>
          </div>
        )}
      </div>

      <div className={styles.main}>
        {/* Відсортований список предметів */}
        <div className={styles.listWrap}>
          <div className={styles.listHeader}>
            <span className={styles.sectionTitle}>Предмети за v/w ↓</span>
            <span className={styles.sectionHint}>відсортовано жадібно</span>
          </div>

          <div className={styles.tableHead}>
            <span>позиція j</span>
            <span>#</span>
            <span>вага w</span>
            <span>цінність v</span>
            <span>v/w</span>
            <span>рішення</span>
          </div>

          {sorted.map((item, j) => {
            const isCurrent = started && step.j === j;
            const state     = getItemState(item);

            return (
              <div
                key={item.originalIdx}
                className={`
                  ${styles.row}
                  ${isCurrent ? styles.rowCurrent : ''}
                  ${state === 'taken'   ? styles.rowTaken   : ''}
                  ${state === 'skipped' ? styles.rowSkipped : ''}
                `}
              >
                <span className={styles.colJ}>{j}</span>
                <span className={styles.colIdx}>#{item.originalIdx + 1}</span>
                <span className={styles.colVal}>{item.w}</span>
                <span className={styles.colVal}>{item.v}</span>
                <span className={styles.colRatio}>{item.r.toFixed(3)}</span>
                <span className={styles.colDecision}>
                  {state === 'taken'   && <span className={styles.taken}>✓ взяли</span>}
                  {state === 'skipped' && <span className={styles.skipped}>✗ не влізло</span>}
                  {state === 'idle' && isCurrent && <span className={styles.checking}>…</span>}
                </span>
              </div>
            );
          })}
        </div>

        {/* Права панель — вміст рюкзака */}
        <div className={styles.bagWrap}>
          <span className={styles.sectionTitle}>Вміст рюкзака</span>

          <div className={styles.bagItems}>
            {started && step.selected.length === 0 && (
              <span className={styles.bagEmpty}>порожньо</span>
            )}
            {(started ? step.selected : []).map(idx => (
              <div key={idx} className={styles.bagItem}>
                <span className={styles.bagItemNum}>#{idx + 1}</span>
                <span className={styles.bagItemStat}>w: <strong>{weights[idx]}</strong></span>
                <span className={styles.bagItemStat}>v: <strong>{values[idx]}</strong></span>
                <span className={styles.bagItemRatio}>{(values[idx] / weights[idx]).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Прогрес бар місткості */}
          <div className={styles.capacityWrap}>
            <div className={styles.capacityLabel}>
              <span>Місткість</span>
              <span style={{ fontFamily: 'var(--mono)' }}>
                {W - (started ? step.remainingW : W)} / {W}
              </span>
            </div>
            <div className={styles.capacityBar}>
              <div
                className={styles.capacityFill}
                style={{ width: `${((W - (started ? step.remainingW : W)) / W) * 100}%` }}
              />
            </div>
          </div>

          {done && (
            <div className={styles.result}>
              <p className={styles.resultTitle}>Результат</p>
              <p className={styles.resultLine}>
                Цінність: <strong>{result.totalV}</strong>
              </p>
              <p className={styles.resultLine}>
                Предмети: <strong>{result.selected.map(i => i + 1).join(', ')}</strong>
              </p>
              <p className={styles.resultLine}>
                Вага: <strong>{result.selected.reduce((a, i) => a + weights[i], 0)}</strong> / {W}
              </p>
              <p className={styles.resultNote}>
                * жадібний може давати не оптимальний результат
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
