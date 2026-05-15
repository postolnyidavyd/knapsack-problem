import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useKnapsack } from '../context/KnapsackContext';
import { buildTree, computeLayout, generateSteps, getOptimalPath } from '../algorithms/recursion';
import styles from './Recursion.module.css';

const SPEED_MAP = [700, 280, 100, 35, 10];
const NODE_R    = 22;

export default function Recursion() {
  const { n, W, weights, values } = useKnapsack();

  // Будуємо дерево
  const treeRoot = useMemo(() => buildTree(n, W, weights, values), [n, W, weights, values]);
  const { flat, totalW } = useMemo(
    () => computeLayout(treeRoot, 60, 84),
    [treeRoot]
  );

  // Кроки 'open' і 'close' для кожного вузла
  const steps = useMemo(() => generateSteps(treeRoot), [treeRoot]);

  // Оптимальний шлях підсвічуємо після завершення
  const optimalPath = useMemo(() => getOptimalPath(treeRoot), [treeRoot]);

  // id → d3 node щоб знайти координати
  const nodeById = useMemo(() => {
    const map = {};
    flat.forEach(d => { map[d.data.id] = d; });
    return map;
  }, [flat]);

  // openedIds вузли що отримали виклик
  // closedIds вузли що вже повернули результат
  const [openedIds,  setOpenedIds]  = useState(new Set());
  const [closedIds,  setClosedIds]  = useState(new Set());
  const [stepIdx,    setStepIdx]    = useState(-1);
  const [playing,    setPlaying]    = useState(false);
  const [speed,      setSpeed]      = useState(2);
  const intervalRef = useRef(null);

  useEffect(() => {
    setOpenedIds(new Set());
    setClosedIds(new Set());
    setStepIdx(-1);
    setPlaying(false);
  }, [n, W, weights, values]);

  const advance = useCallback(() => {
    setStepIdx(prev => {
      const next = prev + 1;
      if (next >= steps.length) { setPlaying(false); return prev; }

      const step = steps[next];
      if (step.type === 'open') {
        setOpenedIds(s => new Set([...s, step.id]));
      } else {
        setClosedIds(s => new Set([...s, step.id]));
      }
      return next;
    });
  }, [steps]);

  useEffect(() => {
    if (playing) intervalRef.current = setInterval(advance, SPEED_MAP[speed]);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, advance]);

  function reset() {
    setPlaying(false);
    setStepIdx(-1);
    setOpenedIds(new Set());
    setClosedIds(new Set());
  }

  const done    = stepIdx === steps.length - 1;
  const started = stepIdx >= 0;

  // Поточний активний вузол - останній 'open' що ще не 'close'
  const currentId = useMemo(() => {
    if (!started || done) return null;
    const step = steps[stepIdx];
    if (step.type === 'open' && !closedIds.has(step.id)) return step.id;
    return null;
  }, [stepIdx, steps, closedIds, started, done]);

  const currentNode = currentId != null ? nodeById[currentId]?.data : null;


  const [vx,    setVx]    = useState(40);
  const [vy,    setVy]    = useState(30);
  const [scale, setScale] = useState(1);
  const dragRef = useRef(null);

  useEffect(() => {
    const s = Math.min(1, 860 / Math.max(totalW, 1));
    setScale(s);
    setVx(40);
    setVy(30);
  }, [totalW]);

  function onWheel(e) {
    e.preventDefault();
    setScale(s => Math.min(2.5, Math.max(0.15, s - e.deltaY * 0.001)));
  }
  function onMouseDown(e) { dragRef.current = { sx: e.clientX, sy: e.clientY, vx, vy }; }
  function onMouseMove(e) {
    if (!dragRef.current) return;
    setVx(dragRef.current.vx + (e.clientX - dragRef.current.sx));
    setVy(dragRef.current.vy + (e.clientY - dragRef.current.sy));
  }
  function onMouseUp() { dragRef.current = null; }

  return (
    <div className={styles.page}>

      {/* Панель керування */}
      <div className={styles.controls}>
        <button
          className={styles.btnPrimary}
          onClick={() => {
            if (done) { reset(); return; }
            if (!started) advance();
            setPlaying(p => !p);
          }}
        >
          {done ? '↺ Знову' : playing ? '⏸ Пауза' : !started ? '▶ Старт' : '▶ Продовжити'}
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

      {/* Стан поточного виклику */}
      <div className={styles.info}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Поточний виклик</span>
          <span className={styles.statValue}>
            {currentNode ? currentNode.name : done ? treeRoot.name : '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Причина</span>
          <span className={styles.statValue} style={{ color: reasonColor(currentNode?.reason) }}>
            {currentNode ? reasonLabel(currentNode.reason) : '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Повертає</span>
          <span className={styles.statValue} style={{ color: 'var(--col-recurse)', fontFamily: 'var(--mono)' }}>
            {currentNode && closedIds.has(currentNode.id)
              ? currentNode.value
              : done
                ? treeRoot.value
                : '—'}
          </span>
        </div>
        {done && (
          <div className={styles.resultCard}>
            <span className={styles.statLabel}>Результат</span>
            <span className={styles.statValue}>{treeRoot.value}</span>
          </div>
        )}
        {done && (
          <div className={styles.legendWrap}>
            <LegendItem color="var(--col-recurse)" label="оптимальний шлях" />
            <LegendItem color="var(--text-3)"      label="решта" />
          </div>
        )}
      </div>

      {/* дерево (координати з d3-hierarchy) */}
      <div
        className={styles.treeWrap}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <span className={styles.hint}></span>

        <svg width="100%" height="100%" style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}>
          <g transform={`translate(${vx},${vy}) scale(${scale})`}>

            {/* Ребра */}
            {flat.map(d =>
              d.children?.map(child => {
                if (!openedIds.has(child.data.id)) return null;

                const inOptimal = done && optimalPath.has(d.data.id) && optimalPath.has(child.data.id);
                return (
                  <line
                    key={`${d.data.id}-${child.data.id}`}
                    x1={d.x}     y1={d.y}
                    x2={child.x} y2={child.y}
                    stroke={inOptimal ? 'var(--col-recurse)' : 'var(--border)'}
                    strokeWidth={inOptimal ? 1.5 : 1}
                    opacity={inOptimal ? 0.9 : 0.35}
                  />
                );
              })
            )}

            {/* Вузли */}
            {flat.map(d => {
              if (!openedIds.has(d.data.id)) return null;

              const node     = d.data;
              const isActive = node.id === currentId;
              const isClosed = closedIds.has(node.id);
              const inOpt    = done && optimalPath.has(node.id);

              // Вибір стилю
              let stroke = 'var(--border)';
              let fill   = 'var(--surface)';
              let nameColor  = 'var(--text-3)';
              let valueColor = 'var(--text-3)';

              if (isActive) {
                stroke     = '#e8e8e8';
                fill       = '#222';
                nameColor  = '#e8e8e8';
                valueColor = '#e8e8e8';
              } else if (inOpt) {
                stroke     = 'var(--col-recurse)';
                fill       = '#1e1810';
                nameColor  = 'var(--col-recurse)';
                valueColor = 'var(--col-recurse)';
              } else if (isClosed) {
                stroke     = '#333';
                fill       = 'var(--surface)';
                nameColor  = '#444';
                valueColor = '#444';
              }

              // Значення показуємо тільки якщо вузол вже повернув результат
              const displayValue = isClosed || isActive && isClosed ? node.value : '?';

              return (
                <g key={node.id}>
                  <circle
                    cx={d.x} cy={d.y} r={NODE_R}
                    fill={fill} stroke={stroke}
                    strokeWidth={isActive ? 2 : inOpt ? 1.5 : 1}
                  />
                  <text
                    x={d.x} y={d.y - 6}
                    textAnchor="middle"
                    fill={nameColor}
                    fontSize={8}
                    fontFamily="var(--mono)"
                  >
                    {node.name}
                  </text>
                  <text
                    x={d.x} y={d.y + 8}
                    textAnchor="middle"
                    fill={isClosed ? valueColor : '#555'}
                    fontSize={10}
                    fontFamily="var(--mono)"
                    fontWeight="600"
                  >
                    {displayValue}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function reasonLabel(r) {
  if (!r) return '—';
  if (r === 'base')       return 'базовий випадок';
  if (r === 'skip-heavy') return 'не вміщується';
  if (r === 'took')       return 'взяти вигідніше';
  if (r === 'skipped')    return 'пропустити вигідніше';
  return r;
}

function reasonColor(r) {
  if (r === 'took')   return 'var(--col-recurse)';
  if (r === 'base')   return 'var(--text-3)';
  return 'var(--text-2)';
}

function LegendItem({ color, label }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.legendDot} style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
