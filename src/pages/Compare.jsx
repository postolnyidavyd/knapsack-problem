import { useMemo } from 'react';
import { useKnapsack } from '../context/KnapsackContext';
import { generateSteps as bruteSteps, getMaskBits } from '../algorithms/bruteForce';
import { buildTree } from '../algorithms/recursion';
import { generateDPSteps } from '../algorithms/dp';
import { generateGreedySteps } from '../algorithms/greedy';
import { generateBnBSteps } from '../algorithms/bnb';
import styles from './Compare.module.css';

export default function Compare() {
    const { n, W, weights, values } = useKnapsack();

    const results = useMemo(() => {
        // Груба сила
        const {  result: bRes } = (() => {
            const { steps } = bruteSteps(n, W, weights, values);
            const last = steps[steps.length - 1];
            const items = getMaskBits(last.bestMask, n)
                .map((b, i) => b ? i + 1 : null).filter(Boolean);
            return { steps, result: { value: last.bestValue, items, calls: steps.length } };
        })();

        // Рекурсія
        const recTree = buildTree(n, W, weights, values);
        let recCalls = 0;
        function countNodes(node) { recCalls++; node.children.forEach(countNodes); }
        countNodes(recTree);

        // DP
        const { result: dpRes } = generateDPSteps(n, W, weights, values);

        // Жадібний
        const { result: greedyRes } = generateGreedySteps(n, W, weights, values);

        // Гілки і межі
        const { result: bnbRes, steps: bnbSteps } = generateBnBSteps(n, W, weights, values);
        const prunedCount = bnbSteps.filter(s => s.type === 'prune').length;

        return [
            {
                id: 'brute',
                label: 'Груба сила',
                color: 'var(--col-brute)',
                complexity: 'O(2ⁿ)',
                optimal: true,
                value: bRes.value,
                items: bRes.items,
                weight: bRes.items.reduce((a, i) => a + weights[i - 1], 0),
                metric: { label: 'перевірено масок', value: bRes.calls },
                note: `2ⁿ = ${1 << n} комбінацій`,
            },
            {
                id: 'recursion',
                label: 'Рекурсія',
                color: 'var(--col-recurse)',
                complexity: 'O(2ⁿ)',
                optimal: true,
                value: recTree.value,
                items: (() => {
                    const items = [];
                    function walk(node) {
                        if (!node.children.length) return;
                        if (node.children.length === 1) { walk(node.children[0]); return; }
                        if (node.reason === 'took') {
                            const idx = node.i;
                            items.push(idx);
                            walk(node.children[1]);
                        } else {
                            walk(node.children[0]);
                        }
                    }
                    walk(recTree);
                    return items.sort((a, b) => a - b);
                })(),
                weight: 0, // порахуємо нижче
                metric: { label: 'викликів функції', value: recCalls },
                note: 'дерево рекурсії',
            },
            {
                id: 'dp',
                label: 'Динамічне програмування',
                color: 'var(--col-dp)',
                complexity: 'O(n·W)',
                optimal: true,
                value: dpRes.value,
                items: dpRes.items,
                weight: dpRes.items.reduce((a, i) => a + weights[i - 1], 0),
                metric: { label: 'заповнено комірок', value: (n + 1) * (W + 1) },
                note: `таблиця ${n+1}×${W+1}`,
            },
            {
                id: 'greedy',
                label: 'Жадібний',
                color: 'var(--col-greedy)',
                complexity: 'O(n log n)',
                optimal: false,
                value: greedyRes.totalV,
                items: greedyRes.selected.map(i => i + 1),
                weight: greedyRes.selected.reduce((a, i) => a + weights[i], 0),
                metric: { label: 'кроків вибору', value: n },
                note: 'може бути не оптимальним',
            },
            {
                id: 'bnb',
                label: 'Гілки і межі',
                color: 'var(--col-bnb)',
                complexity: 'O(2ⁿ)*',
                optimal: true,
                value: bnbRes.bestValue,
                items: bnbRes.bestItems.map(i => i + 1).sort((a, b) => a - b),
                weight: bnbRes.bestItems.reduce((a, i) => a + weights[i], 0),
                metric: { label: 'відсічено гілок', value: prunedCount },
                note: `розглянуто ${bnbSteps.length - 1} вузлів`,
            },
        ].map(r => ({
            ...r,
            weight: r.weight || (r.items.reduce((a, i) => a + weights[i - 1], 0)),
        }));
    }, [n, W, weights, values]);

    const optimalValue = results.find(r => r.optimal)?.value ?? 0;

    return (
        <div className={styles.page}>
            <p className={styles.title}>Порівняння алгоритмів</p>
            <p className={styles.subtitle}>n={n}, W={W} · всі методи запущені на одних і тих самих вхідних даних</p>

            {/* Зведена таблиця */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Алгоритм</th>
                        <th>Складність</th>
                        <th>Оптимальний?</th>
                        <th>Цінність</th>
                        <th>Предмети</th>
                        <th>Вага</th>
                        <th>Ефективність</th>
                        <th>Примітка</th>
                    </tr>
                    </thead>
                    <tbody>
                    {results.map(r => {
                        const isGreedy = r.id === 'greedy';
                        const diff = r.value - optimalValue;
                        return (
                            <tr key={r.id}>
                                <td>
                    <span className={styles.algoName} style={{ color: r.color }}>
                      {r.label}
                    </span>
                                </td>
                                <td>
                                    <span className={styles.mono}>{r.complexity}</span>
                                </td>
                                <td>
                    <span className={styles.badge}
                          style={{
                              background: r.optimal
                                  ? 'color-mix(in srgb, var(--col-dp) 15%, transparent)'
                                  : 'color-mix(in srgb, var(--col-brute) 15%, transparent)',
                              color: r.optimal ? 'var(--col-dp)' : 'var(--col-brute)',
                          }}>
                      {r.optimal ? 'Так' : 'Ні'}
                    </span>
                                </td>
                                <td>
                    <span className={styles.mono} style={{ fontWeight: 600, color: r.value < optimalValue ? 'var(--col-brute)' : 'var(--text)' }}>
                      {r.value}
                        {isGreedy && diff < 0 && (
                            <span className={styles.diff}> ({diff})</span>
                        )}
                    </span>
                                </td>
                                <td>
                    <span className={styles.mono} style={{ color: 'var(--text-2)' }}>
                      {r.items.join(', ')}
                    </span>
                                </td>
                                <td>
                                    <span className={styles.mono}>{r.weight} / {W}</span>
                                </td>
                                <td>
                                    <div className={styles.metricCell}>
                                        <span className={styles.metricVal} style={{ color: r.color }}>{r.metric.value}</span>
                                        <span className={styles.metricLabel}>{r.metric.label}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.note}>{r.note}</span>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}