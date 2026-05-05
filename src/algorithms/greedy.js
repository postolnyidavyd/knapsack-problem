// Жадібний алгоритм точно за схемою:
// 1. Рахуємо r[i] = v[i] / w[i]
// 2. Сортуємо за спаданням r[i], отримуємо порядок π
// 3. remainingW = W, totalV = 0, selected = [], j = 0
// 4. j < n?  →  w[π[j]] <= remainingW?
//    Так: беремо предмет, j++
//    Ні:  j++ (пропускаємо)
// 5. Вивести totalV, selected

export function generateGreedySteps(n, W, weights, values) {
  // Рахуємо питому цінність
  const ratios = Array.from({ length: n }, (_, i) => ({
    originalIdx: i,                           // 0-based індекс у вхідному масиві
    w: weights[i],
    v: values[i],
    r: values[i] / weights[i],
  }));

  // Порядок π — індекси після сортування за спаданням r[i]
  const sorted = [...ratios].sort((a, b) => b.r - a.r);
  const pi = sorted.map(item => item.originalIdx); // π[j] = оригінальний індекс

  const steps = [];
  let remainingW = W;
  let totalV     = 0;
  const selected = [];

  for (let j = 0; j < n; j++) {
    const idx = pi[j];      // оригінальний індекс предмету
    const canTake = weights[idx] <= remainingW;

    if (canTake) {
      selected.push(idx);
      remainingW -= weights[idx];
      totalV     += values[idx];
    }

    steps.push({
      j,
      idx,                        // який предмет розглядаємо (оригінальний індекс)
      canTake,
      remainingW: canTake ? remainingW : remainingW,
      totalV,
      selected: [...selected],
    });
  }

  return {
    sorted,   // відсортований список для відображення
    pi,
    steps,
    result: { totalV, selected },
  };
}
