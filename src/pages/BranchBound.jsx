import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useKnapsack } from '../context/KnapsackContext';
import { generateBnBSteps, computeBnBLayout } from '../algorithms/bnb';
import styles from './BranchBound.module.css';

const SPEED_MAP = [900, 400, 150, 60, 15];
const NODE_R    = 20;

// Кольори статусів вузлів
const STATUS_STYLE = {
  pending:  { stroke: 'var(--border)',    fill: 'var(--surface)',  text: 'var(--text-3)' },
  active:   { stroke: '#e8e8e8',          fill: '#222',            text: '#e8e8e8'        },
  expanded: { stroke: 'var(--border)',    fill: 'var(--surface)',  text: 'var(--text-3)' },
  pruned:   { stroke: 'var(--col-brute)', fill: '#1a0f0f',         text: 'var(--col-brute)' },
  leaf:     { stroke: '#555',             fill: 'var(--surface)',  text: '#666'           },
  best:     { stroke: 'var(--col-bnb)',   fill: '#16101e',         text: 'var(--col-bnb)' },
};

export default function BranchBound() {
  const { n, W, weights, values } = useKnapsack();

  const { steps, sorted, result } = useMemo(
    () => generateBnBSteps(n, W, weights, values),
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

  // Layout дерева з поточного snapshot
  const { nodes, links } = useMemo(() => {
    if (!step?.snapshot) return { nodes: [], links: [] };
    return computeBnBLayout(step.snapshot);
  }, [step]);

  // Zoom / Pan
  const [vx, setVx] = useState(40);
  const [vy, setVy] = useState(30);
  const [scale, setScale] = useState(1);
  const dragRef = useRef(null);

  useEffect(() => {
    const totalW = nodes.length ? Math.max(...nodes.map(n => n.x)) + 60 : 400;
    setScale(Math.min(1, 860 / totalW));
    setVx(40); setVy(30);
  }, [nodes.length]);

  function onWheel(e) { e.preventDefault(); setScale(s => Math.min(2.5, Math.max(0.15, s - e.deltaY * 0.001))); }
  function onMouseDown(e) { dragRef.current = { sx: e.clientX, sy: e.clientY, vx, vy }; }
  function onMouseMove(e) {
    if (!dragRef.current) return;
    setVx(dragRef.current.vx + (e.clientX - dragRef.current.sx));
    setVy(dragRef.current.vy + (e.clientY - dragRef.current.sy));
  }
  function onMouseUp() { dragRef.current = null; }

  // Підрахунок статистики
  const pruneCount = useMemo(() => {
    if (!step?.snapshot) return 0;
    return Object.values(step.snapshot).filter(n => n.status === 'pruned').length;
  }, [step]);

  const currentNode = step?.snapshot?.[step.nodeId];

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
          <span className={styles.statLabel}>Поточний вузол</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem' }}>
            {currentNode ? `i=${currentNode.i} w=${currentNode.w} v=${currentNode.v}` : '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Верхня оцінка UB</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--mono)', color: 'var(--col-bnb)' }}>
            {step?.ub ?? '—'}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Найкраще (bestValue)</span>
          <span className={styles.statValue} style={{ fontFamily: 'var(--mono)' }}>
            {started ? step.bestValue : 0}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Відсічено гілок</span>
          <span className={styles.statValue} style={{ color: 'var(--col-brute)', fontFamily: 'var(--mono)' }}>
            {pruneCount}
          </span>
        </div>
        {step?.type === 'prune' && (
          <div className={styles.alertCard}>
            <span className={styles.statLabel}>✂ Відсікаємо</span>
            <span className={styles.statValue} style={{ color: 'var(--col-brute)', fontSize: '0.78rem' }}>
              UB ({step.ub}) ≤ best ({step.bestValue})
            </span>
          </div>
        )}
        {step?.type === 'new-best' && (
          <div className={styles.bestCard}>
            <span className={styles.statLabel}>★ Новий рекорд</span>
            <span className={styles.statValue} style={{ color: 'var(--col-bnb)' }}>
              {step.bestValue}
            </span>
          </div>
        )}
        {done && (
          <div className={styles.resultCard}>
            <span className={styles.statLabel}>Результат</span>
            <span className={styles.statValue}>{result.bestValue}</span>
          </div>
        )}
      </div>

      <div className={styles.main}>
        {/* SVG дерево */}
        <div
          className={styles.treeWrap}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <span className={styles.hint}></span>

          {/* Легенда */}
          <div className={styles.legend}>
            <LegendItem color="#e8e8e8"          label="активний" />
            <LegendItem color="var(--col-bnb)"   label="найкраще" />
            <LegendItem color="var(--col-brute)" label="відсічено" />
            <LegendItem color="var(--border)"    label="розширений" />
          </div>

          <svg width="100%" height="100%" style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}>
            <g transform={`translate(${vx},${vy}) scale(${scale})`}>
              {/* Ребра */}
              {links.map((l, i) => {
                const targetNode = step?.snapshot?.[l.target.id];
                const isPruned   = targetNode?.status === 'pruned';
                const isBest     = targetNode?.status === 'best';
                return (
                  <line key={i}
                    x1={l.source.x} y1={l.source.y}
                    x2={l.target.x} y2={l.target.y}
                    stroke={isPruned ? 'var(--col-brute)' : isBest ? 'var(--col-bnb)' : 'var(--border)'}
                    strokeWidth={isBest ? 1.5 : 1}
                    opacity={isPruned ? 0.4 : isBest ? 0.9 : 0.35}
                    strokeDasharray={isPruned ? '3 3' : 'none'}
                  />
                );
              })}

              {/* Мітки гілок (take/skip) */}
              {links.map((l, i) => {
                const targetNode = step?.snapshot?.[l.target.id];
                if (!targetNode || targetNode.decision === 'root') return null;
                const mx = (l.source.x + l.target.x) / 2;
                const my = (l.source.y + l.target.y) / 2;
                return (
                  <text key={`lbl-${i}`} x={mx} y={my - 4}
                    textAnchor="middle" fontSize={7} fontFamily="var(--mono)"
                    fill={targetNode.decision === 'take' ? '#5a5' : '#666'}
                  >
                    {targetNode.decision === 'take' ? '+' : '—'}
                  </text>
                );
              })}

              {/* Вузли */}
              {nodes.map(node => {
                const st = STATUS_STYLE[node.status] || STATUS_STYLE.pending;
                const isActive = node.id === step?.nodeId;
                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x} cy={node.y} r={NODE_R}
                      fill={st.fill} stroke={st.stroke}
                      strokeWidth={isActive ? 2 : 1}
                    />
                    {/* i=..  верхній рядок */}
                    <text x={node.x} y={node.y - 8}
                      textAnchor="middle" fontSize={7} fontFamily="var(--mono)"
                      fill={st.text} opacity={0.7}
                    >
                      i={node.i}
                    </text>
                    {/* v=..  значення */}
                    <text x={node.x} y={node.y + 4}
                      textAnchor="middle" fontSize={9} fontFamily="var(--mono)"
                      fill={st.text} fontWeight="600"
                    >
                      {node.v}
                    </text>
                    {/* UB якщо є */}
                    {node.ub > 0 && node.status !== 'pending' && (
                      <text x={node.x} y={node.y + 14}
                        textAnchor="middle" fontSize={6} fontFamily="var(--mono)"
                        fill={node.status === 'pruned' ? 'var(--col-brute)' : '#444'}
                      >
                        ub:{node.ub}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Права панель */}
        <div className={styles.side}>
          <p className={styles.sideTitle}>Порядок (v/w ↓)</p>
          {sorted.map((item, j) => (
            <div key={j} className={styles.sortedItem}>
              <span className={styles.sortedJ}>{j}</span>
              <span className={styles.sortedIdx}>#{item.origIdx + 1}</span>
              <span className={styles.sortedStat}>w:{item.w} v:{item.v}</span>
              <span className={styles.sortedR}>{item.r.toFixed(2)}</span>
            </div>
          ))}

          {done && (
            <div className={styles.result}>
              <p className={styles.resultTitle}>Результат</p>
              <p className={styles.resultLine}>
                Цінність: <strong>{result.bestValue}</strong>
              </p>
              <p className={styles.resultLine}>
                Предмети: <strong>
                  {result.bestItems.map(i => i + 1).sort((a,b)=>a-b).join(', ')}
                </strong>
              </p>
              <p className={styles.resultLine}>
                Вага: <strong>
                  {result.bestItems.reduce((a, i) => a + weights[i], 0)}
                </strong> / {W}
              </p>
              <p className={styles.resultLine} style={{ color: 'var(--col-brute)' }}>
                Відсічено: <strong>{pruneCount}</strong> гілок
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.legendDot} style={{ borderColor: color }} />
      <span>{label}</span>
    </div>
  );
}
