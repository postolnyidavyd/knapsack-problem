import { useState, useEffect, useRef, useCallback } from 'react';
import { useKnapsack } from '../context/KnapsackContext';
import { generateSteps, getMaskBits } from '../algorithms/bruteForce';
import styles from './BruteForce.module.css';

const SPEED_MAP = [800, 400, 150, 60, 20];

export default function BruteForce() {
  const { n, W, weights, values } = useKnapsack();

  const [steps,   setSteps]   = useState([]);
  const [current, setCurrent] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed,   setSpeed]   = useState(2);

  const intervalRef = useRef(null);


  useEffect(() => {
    const { steps: s } = generateSteps(n, W, weights, values);
    setSteps(s);
    setCurrent(-1);
    setPlaying(false);
  }, [n, W, weights, values]);

  const advance = useCallback(() => {
    setCurrent(prev => {
      if (prev >= steps.length - 1) {
        setPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [steps.length]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(advance, SPEED_MAP[speed]);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, advance]);

  function reset() {
    setPlaying(false);
    setCurrent(-1);
  }

  const done    = current === steps.length - 1;
  const started = current >= 0;
  const step    = started ? steps[current] : null;

  const bits       = step ? getMaskBits(step.m, n) : Array(n).fill(0);
  const bestBits   = step ? getMaskBits(step.bestMask, n) : Array(n).fill(0);

  return (
    <div className={styles.page}>

      {/* Управління */}
      <div className={styles.controls}>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            if (done) { reset(); return; }
            if (current === -1) setCurrent(0);
            setPlaying(p => !p);
          }}
        >
          {done ? '↺ Знову' : playing ? '⏸ Пауза' : (current === -1 ? '▶ Старт' : '▶ Продовжити')}
        </button>

        <button
          className={styles.btnSecondary}
          onClick={advance}
          disabled={playing || done}
        >
          → Крок
        </button>

        <button className={styles.btnSecondary} onClick={reset} disabled={!started && !playing}>
          ↺ Скинути
        </button>

        <div className={styles.speedWrap}>
          <span className={styles.speedLabel}>Швидкість</span>
          <input
            type="range" min={0} max={4} value={speed}
            onChange={e => setSpeed(+e.target.value)}
            className={styles.slider}
          />
        </div>

        {started && (
          <span className={styles.counter}>
            {current + 1} / {steps.length}
          </span>
        )}
      </div>

      <div className={styles.main}>

        <div className={styles.left}>

          {/* Статистика */}
          <div className={styles.statsGrid}>
            <StatCard label="Маска m" value={started ? step.m : '—'} mono />
            <StatCard
              label="totalW / W"
              value={started ? `${step.totalW} / ${W}` : `— / ${W}`}
              mono
              accent={step && !step.valid ? 'red' : step && step.valid ? 'green' : null}
            />
            <StatCard label="totalV" value={started ? step.totalV : '—'} mono />
            <StatCard
              label="Найкраще"
              value={started ? step.bestValue : '—'}
              mono
              accent={step?.better ? 'gold' : null}
            />
          </div>

          {/* Карточка речі(зелений, червоний, золотий колір) */}
          <div className={styles.items}>
            {Array.from({ length: n }, (_, i) => {
              const inCurrent = bits[i] === 1;
              const inBest    = bestBits[i] === 1 && started;
              const state = !started
                ? 'idle'
                : step.better && inCurrent
                  ? 'new-best'
                  : inBest && done
                    ? 'best'
                    : inCurrent && !step.valid
                      ? 'invalid'
                      : inCurrent && step.valid
                        ? 'valid'
                        : 'idle';

              return (
                <div key={i} className={`${styles.itemCard} ${styles[state]}`}>
                  <span className={styles.itemIdx}>{i + 1}</span>
                  <span className={styles.itemStat}>w: {weights[i]}</span>
                  <span className={styles.itemStat}>v: {values[i]}</span>
                </div>
              );
            })}
          </div>

          {/* Нижня панель яка показує числово в 2цифровій системі чисел */}
          {started && (
            <div className={styles.maskRow}>
              <span className={styles.maskLabel}>біти:</span>
              {bits.map((b, i) => (
                <span
                  key={i}
                  className={`${styles.bit} ${b === 1 ? styles.bitOn : ''}`}
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Результат */}
          {done && (
            <div className={styles.result}>
              <p className={styles.resultTitle}>Результат</p>
              <p className={styles.resultLine}>
                Цінність: <strong>{steps[steps.length - 1]?.bestValue}</strong>
              </p>
              <p className={styles.resultLine}>
                Предмети:{' '}
                <strong>
                  {getMaskBits(steps[steps.length - 1]?.bestMask, n)
                    .map((b, i) => (b ? i + 1 : null))
                    .filter(Boolean)
                    .join(', ')}
                </strong>
              </p>
              <p className={styles.resultLine}>
                Вага:{' '}
                <strong>
                  {getMaskBits(steps[steps.length - 1]?.bestMask, n)
                    .reduce((acc, b, i) => acc + b * weights[i], 0)}
                </strong>
                {' / '}{W}
              </p>
            </div>
          )}
        </div>

        {/* Права частина */}
        <div className={styles.right}>
          <p className={styles.gridTitle}>Простір пошуку — усі 2ⁿ = {1 << n} масок</p>
          <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(${Math.min(1 << n, 16)}, 1fr)` }}
          >
            {steps.map((s, idx) => {
              let cellState = 'untried';
              if (idx < current)      cellState = s.valid ? 'tried-valid' : 'tried-invalid';
              if (idx === current)    cellState = 'current';
              if (s.m === steps[current]?.bestMask && idx <= current) cellState = 'best';

              return (
                <div
                  key={idx}
                  className={`${styles.cell} ${styles[cellState]}`}
                  title={`m=${s.m} | totalW=${s.totalW} | totalV=${s.totalV}`}
                />
              );
            })}
          </div>

          <div className={styles.legend}>
            <LegendItem color="var(--text-3)" label="не перевірено" />
            <LegendItem color="var(--col-brute)" label="перевантаження" />
            <LegendItem color="var(--col-dp)" label="допустимо" />
            <LegendItem color="gold" label="найкраще" />
            <LegendItem color="white" label="поточна" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, mono, accent }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span
        className={`${styles.statValue} ${mono ? styles.mono : ''}`}
        style={accent === 'red' ? { color: 'var(--col-brute)' }
             : accent === 'green' ? { color: 'var(--col-dp)' }
             : accent === 'gold' ? { color: 'gold' }
             : {}}
      >
        {value}
      </span>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.legendDot} style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
